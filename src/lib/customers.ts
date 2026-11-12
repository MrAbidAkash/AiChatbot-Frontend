// src/lib/customers.ts
import { getDb } from "./db";
import { ObjectId } from "mongodb";

export interface CustomerProfile {
  _id?: ObjectId | string;
  userId?: string;
  pageId: string;
  senderPsid: string;
  customerName: string;
  customerPhone?: string | null;
  deliveryAddress?: string | null;
  totalOrders: number;
  lastOrderAt?: Date | null;
  lastOrderProduct?: string | null;
  notes?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface SavedCustomerInfo {
  savedName: string;
  savedPhone?: string | null;
  savedAddress?: string | null;
  totalOrders: number;
  lastOrderAt?: Date | null;
  lastOrderProduct?: string | null;
}

const CUSTOMERS_COLLECTION = "customers";

/**
 * Look up a customer's saved profile & delivery address by senderPsid & pageId.
 * Falls back to recent confirmed orders if profile doesn't exist yet.
 */
export async function getCustomerProfile(
  pageId: string,
  senderPsid: string,
): Promise<SavedCustomerInfo | null> {
  if (!senderPsid) return null;
  const db = getDb();

  // 1. Check customers collection
  const customer = await db.collection<CustomerProfile>(CUSTOMERS_COLLECTION).findOne({
    senderPsid,
    ...(pageId ? { pageId } : {}),
  });

  if (customer && (customer.deliveryAddress || customer.customerPhone)) {
    return {
      savedName: customer.customerName || "Customer",
      savedPhone: customer.customerPhone,
      savedAddress: customer.deliveryAddress,
      totalOrders: customer.totalOrders || 0,
      lastOrderAt: customer.lastOrderAt,
      lastOrderProduct: customer.lastOrderProduct,
    };
  }

  // 2. Fallback: look up last confirmed order in orders collection
  const lastOrder = await db
    .collection("orders")
    .find({
      senderPsid,
      status: "confirmed",
    })
    .sort({ createdAt: -1 })
    .limit(1)
    .next();

  if (lastOrder && (lastOrder.deliveryAddress || lastOrder.customerPhone)) {
    const totalOrders = await db.collection("orders").countDocuments({
      senderPsid,
      status: "confirmed",
    });

    return {
      savedName: lastOrder.customerName || "Customer",
      savedPhone: lastOrder.customerPhone,
      savedAddress: lastOrder.deliveryAddress,
      totalOrders,
      lastOrderAt: lastOrder.createdAt ? new Date(lastOrder.createdAt) : null,
      lastOrderProduct: lastOrder.productName,
    };
  }

  // 3. Fallback: check fb_conversations
  const conv = await db.collection("fb_conversations").findOne({
    senderPsid,
    ...(pageId ? { pageId } : {}),
  });

  if (conv && ((conv as any).deliveryAddress || (conv as any).customerPhone)) {
    return {
      savedName: conv.customerName || "Customer",
      savedPhone: (conv as any).customerPhone,
      savedAddress: (conv as any).deliveryAddress,
      totalOrders: (conv as any).orderCount || 0,
      lastOrderAt: (conv as any).lastOrderAt,
    };
  }

  return null;
}

/**
 * Save or update customer's delivery address, phone, and order info
 */
export async function saveCustomerProfile(params: {
  userId?: string;
  pageId: string;
  senderPsid: string;
  customerName: string;
  customerPhone?: string | null;
  deliveryAddress?: string | null;
  productName?: string;
}): Promise<void> {
  const { userId, pageId, senderPsid, customerName, customerPhone, deliveryAddress, productName } =
    params;
  if (!senderPsid) return;

  const db = getDb();
  const now = new Date();

  const updateFields: any = {
    customerName,
    updatedAt: now,
  };

  if (userId) updateFields.userId = userId;
  if (pageId) updateFields.pageId = pageId;
  if (customerPhone) updateFields.customerPhone = customerPhone;
  if (deliveryAddress) updateFields.deliveryAddress = deliveryAddress;
  if (productName) {
    updateFields.lastOrderProduct = productName;
    updateFields.lastOrderAt = now;
  }

  try {
    await db.collection(CUSTOMERS_COLLECTION).updateOne(
      { senderPsid, pageId },
      {
        $set: updateFields,
        $inc: { totalOrders: 1 },
        $setOnInsert: {
          createdAt: now,
        },
      },
      { upsert: true },
    );

    // Also update fb_conversations for quick inspection in Inbox
    const convUpdate: any = { updatedAt: now };
    if (customerPhone) convUpdate.customerPhone = customerPhone;
    if (deliveryAddress) convUpdate.deliveryAddress = deliveryAddress;
    if (productName) convUpdate.lastOrderAt = now;

    await db.collection("fb_conversations").updateOne(
      { senderPsid, pageId },
      {
        $set: convUpdate,
        ...(productName ? { $inc: { orderCount: 1 } } : {}),
      },
    );

    console.log(
      `[Customer Profile] Saved delivery address and profile for "${customerName}" (${senderPsid}): ${deliveryAddress || "N/A"}`,
    );
  } catch (err) {
    console.error("[Customer Profile] Error saving customer profile:", err);
  }
}

