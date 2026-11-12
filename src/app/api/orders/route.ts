// src/app/api/orders/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { ObjectId } from "mongodb";
import {
  detectOrderConfirmationWithAI,
  decrementGoogleSheetStock,
} from "@/lib/google-sheets-stock";
import { BusinessDocument } from "@/lib/knowledge";

async function getAuthUserId(): Promise<string> {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });
    if (session?.user?.id) {
      return session.user.id;
    }
  } catch {
    // fallback
  }
  return "default";
}

/**
 * GET: Retrieve list of orders with filtering and search
 */
export async function GET(request: NextRequest) {
  try {
    const userId = await getAuthUserId();
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search");
    const status = searchParams.get("status");
    const limit = parseInt(searchParams.get("limit") || "50", 10);
    const page = parseInt(searchParams.get("page") || "1", 10);
    const skip = (page - 1) * limit;

    const db = getDb();
    const queryConditions: any[] = [];

    if (userId !== "all") {
      queryConditions.push({
        $or: [{ userId }, { userId: "default" }, { userId: { $exists: false } }],
      });
    }

    if (status && status !== "all") {
      queryConditions.push({ status });
    }

    if (search && search.trim()) {
      const cleanSearch = search.trim();
      queryConditions.push({
        $or: [
          { customerName: { $regex: cleanSearch, $options: "i" } },
          { customerPhone: { $regex: cleanSearch, $options: "i" } },
          { productName: { $regex: cleanSearch, $options: "i" } },
          { deliveryAddress: { $regex: cleanSearch, $options: "i" } },
        ],
      });
    }

    const query = queryConditions.length > 1 ? { $and: queryConditions } : queryConditions[0] || {};

    const [orders, total, confirmedCount, shippedCount, deliveredCount] = await Promise.all([
      db
        .collection("orders")
        .find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .toArray(),
      db.collection("orders").countDocuments(query),
      db.collection("orders").countDocuments({
        ...(userId !== "all" ? { $or: [{ userId }, { userId: "default" }, { userId: { $exists: false } }] } : {}),
        status: "confirmed",
      }),
      db.collection("orders").countDocuments({
        ...(userId !== "all" ? { $or: [{ userId }, { userId: "default" }, { userId: { $exists: false } }] } : {}),
        status: "shipped",
      }),
      db.collection("orders").countDocuments({
        ...(userId !== "all" ? { $or: [{ userId }, { userId: "default" }, { userId: { $exists: false } }] } : {}),
        status: "delivered",
      }),
    ]);

    return NextResponse.json({
      success: true,
      orders: orders.map((o) => ({
        ...o,
        _id: o._id.toString(),
      })),
      total,
      counts: {
        all: total,
        confirmed: confirmedCount,
        shipped: shippedCount,
        delivered: deliveredCount,
      },
      page,
      limit,
    });
  } catch (error: any) {
    console.error("Error fetching orders:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch orders" },
      { status: 500 },
    );
  }
}

/**
 * POST: Create an order manually or sync from recent Facebook conversations
 */
export async function POST(request: NextRequest) {
  try {
    const userId = await getAuthUserId();
    const body = await request.json();
    const db = getDb();

    // 1. Sync / backfill action from existing chat history
    if (body.action === "sync_conversations" || body.action === "sync_recent") {
      const convFilter: any =
        userId !== "all"
          ? { $or: [{ userId }, { userId: "default" }, { userId: { $exists: false } }] }
          : {};

      const conversations = await db
        .collection("fb_conversations")
        .find(convFilter)
        .sort({ lastMessageAt: -1 })
        .limit(20)
        .toArray();

      let syncedCount = 0;

      for (const conv of conversations) {
        // Fetch recent messages of this conversation
        const msgs = await db
          .collection("fb_messages")
          .find({ conversationId: conv._id.toString() })
          .sort({ timestamp: -1 })
          .limit(20)
          .toArray();

        if (msgs.length === 0) continue;

        // Check if order already exists for this senderPsid
        const existingOrder = await db.collection("orders").findOne({
          senderPsid: conv.senderPsid,
        });
        if (existingOrder) continue;

        // Find customer message with confirmation
        const history = msgs.reverse().map((m) => ({
          senderType: m.senderType,
          text: m.text,
        }));

        const lastCustomerMsg = [...history].reverse().find((h) => h.senderType === "customer");
        const lastAiMsg = [...history].reverse().find((h) => h.senderType === "ai");

        if (!lastCustomerMsg || !lastAiMsg) continue;

        const detected = await detectOrderConfirmationWithAI({
          customerMessage: lastCustomerMsg.text,
          aiReply: lastAiMsg.text,
          conversationHistory: history,
        });

        if (detected.isOrderConfirmed && detected.productName) {
          await db.collection("orders").insertOne({
            userId,
            pageId: conv.pageId || null,
            customerName: conv.customerName || detected.customerName || "Customer",
            customerPhone: detected.customerPhone || null,
            deliveryAddress: detected.deliveryAddress || null,
            senderPsid: conv.senderPsid,
            productName: detected.productName,
            quantity: detected.quantity || 1,
            status: "confirmed",
            stockDecremented: false,
            stockDeductionMessage: "Synced from Messenger conversation history",
            createdAt: conv.lastMessageAt || new Date(),
            updatedAt: new Date(),
          });
          syncedCount++;
        }
      }

      return NextResponse.json({
        success: true,
        message: `চ্যাট হিস্ট্রি স্ক্যান সম্পন্ন হয়েছে। ${syncedCount} টি নতুন কনফার্মড অর্ডার পাওয়া গেছে।`,
        syncedCount,
      });
    }

    // 2. Regular manual order creation
    const {
      customerName,
      customerPhone,
      deliveryAddress,
      productName,
      quantity = 1,
      status = "confirmed",
      notes,
      pageId,
      updateSheetStock = false,
    } = body;

    if (!customerName || !productName) {
      return NextResponse.json(
        { error: "Customer name and product name are required." },
        { status: 400 },
      );
    }

    const orderDoc: any = {
      userId,
      pageId: pageId || null,
      customerName: customerName.trim(),
      customerPhone: customerPhone ? customerPhone.trim() : null,
      deliveryAddress: deliveryAddress ? deliveryAddress.trim() : null,
      productName: productName.trim(),
      quantity: Number(quantity) || 1,
      status,
      notes: notes ? notes.trim() : null,
      stockDecremented: false,
      stockDeductionMessage: updateSheetStock ? "Processing sheet update..." : "Manual order entry",
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const insertRes = await db.collection("orders").insertOne(orderDoc);
    const orderId = insertRes.insertedId;

    // Optionally decrement Google Sheet stock if requested
    if (updateSheetStock) {
      try {
        const sheet = await db.collection<BusinessDocument>("business_knowledge").findOne({
          $or: [{ userId }, { userId: "default" }, { userId: { $exists: false } }],
          fileType: "sheet",
          "metadata.googleFileId": { $exists: true, $ne: "" },
        });

        if (sheet?.metadata?.googleFileId) {
          const result = await decrementGoogleSheetStock(
            userId,
            sheet.metadata.googleFileId,
            orderDoc.productName,
            orderDoc.quantity,
          );
          await db.collection("orders").updateOne(
            { _id: orderId },
            {
              $set: {
                stockDecremented: true,
                spreadsheetId: sheet.metadata.googleFileId,
                sheetName: result.sheetName,
                stockCell: `${result.stockColumn}${result.matchedRow}`,
                previousStock: result.previousStock,
                newStock: result.newStock,
                statusCell: result.statusColumn ? `${result.statusColumn}${result.matchedRow}` : undefined,
                previousStatus: result.previousStatus,
                newStatus: result.newStatus,
                stockDeductionMessage: result.message,
                updatedAt: new Date(),
              },
            },
          );
        }
      } catch (sheetErr: any) {
        console.warn("Manual order sheet decrement warning:", sheetErr);
      }
    }

    return NextResponse.json({
      success: true,
      orderId: orderId.toString(),
      message: "অর্ডার সফলভাবে সেভ করা হয়েছে।",
    });
  } catch (error: any) {
    console.error("Error creating order:", error);
    return NextResponse.json(
      { error: error.message || "Failed to create order" },
      { status: 500 },
    );
  }
}

/**
 * PATCH: Update order status, courier tracking, or details
 */
export async function PATCH(request: NextRequest) {
  try {
    const userId = await getAuthUserId();
    const body = await request.json();
    const { orderId, status, courierConsignmentId, courierTrackingCode, notes, customerPhone, deliveryAddress } = body;

    if (!orderId) {
      return NextResponse.json({ error: "orderId is required" }, { status: 400 });
    }

    const db = getDb();
    let filter: any;
    try {
      filter = { _id: new ObjectId(orderId) };
    } catch {
      filter = { _id: orderId };
    }

    if (userId !== "all") {
      filter = {
        $and: [
          filter,
          { $or: [{ userId }, { userId: "default" }, { userId: { $exists: false } }] },
        ],
      };
    }

    const updateFields: any = { updatedAt: new Date() };
    if (status) updateFields.status = status;
    if (courierConsignmentId) updateFields.courierConsignmentId = courierConsignmentId;
    if (courierTrackingCode) updateFields.courierTrackingCode = courierTrackingCode;
    if (notes !== undefined) updateFields.notes = notes;
    if (customerPhone) updateFields.customerPhone = customerPhone;
    if (deliveryAddress) updateFields.deliveryAddress = deliveryAddress;

    const res = await db.collection("orders").updateOne(filter, { $set: updateFields });

    if (res.matchedCount === 0) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: "অর্ডার স্ট্যাটাস সফলভাবে আপডেট করা হয়েছে।",
    });
  } catch (error: any) {
    console.error("Error updating order:", error);
    return NextResponse.json(
      { error: error.message || "Failed to update order" },
      { status: 500 },
    );
  }
}

/**
 * DELETE: Delete an order
 */
export async function DELETE(request: NextRequest) {
  try {
    const userId = await getAuthUserId();
    const { searchParams } = new URL(request.url);
    const orderId = searchParams.get("id");

    if (!orderId) {
      return NextResponse.json({ error: "Order ID is required" }, { status: 400 });
    }

    const db = getDb();
    let filter: any;
    try {
      filter = { _id: new ObjectId(orderId) };
    } catch {
      filter = { _id: orderId };
    }

    if (userId !== "all") {
      filter = {
        $and: [
          filter,
          { $or: [{ userId }, { userId: "default" }, { userId: { $exists: false } }] },
        ],
      };
    }

    const res = await db.collection("orders").deleteOne(filter);
    if (res.deletedCount === 0) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: "অর্ডার ডিলিট করা হয়েছে।" });
  } catch (error: any) {
    console.error("Error deleting order:", error);
    return NextResponse.json(
      { error: error.message || "Failed to delete order" },
      { status: 500 },
    );
  }
}
