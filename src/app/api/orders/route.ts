// src/app/api/orders/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

export async function GET(request: NextRequest) {
  try {
    let userId = "default";
    try {
      const session = await auth.api.getSession({
        headers: await headers(),
      });
      if (session?.user?.id) {
        userId = session.user.id;
      }
    } catch {
      // fallback
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search");
    const limit = parseInt(searchParams.get("limit") || "50", 10);
    const page = parseInt(searchParams.get("page") || "1", 10);
    const skip = (page - 1) * limit;

    const db = getDb();
    const query: any = {};
    if (userId !== "all") {
      query.$or = [{ userId }, { userId: "default" }, { userId: { $exists: false } }];
    }

    if (search && search.trim()) {
      const cleanSearch = search.trim();
      const searchConditions = [
        { customerName: { $regex: cleanSearch, $options: "i" } },
        { customerPhone: { $regex: cleanSearch, $options: "i" } },
        { productName: { $regex: cleanSearch, $options: "i" } },
        { deliveryAddress: { $regex: cleanSearch, $options: "i" } },
      ];

      if (query.$or) {
        query.$and = [{ $or: query.$or }, { $or: searchConditions }];
        delete query.$or;
      } else {
        query.$or = searchConditions;
      }
    }

    const [orders, total] = await Promise.all([
      db
        .collection("orders")
        .find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .toArray(),
      db.collection("orders").countDocuments(query),
    ]);

    return NextResponse.json({
      success: true,
      orders: orders.map((o) => ({
        ...o,
        _id: o._id.toString(),
      })),
      total,
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

