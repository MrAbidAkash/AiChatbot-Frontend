// src/app/api/wallet/route.ts
import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { getUserWallet } from "@/lib/billing";

export async function GET() {
  try {
    let userId = "default";
    let userEmail = "";
    try {
      const session = await auth.api.getSession({
        headers: await headers(),
      });
      if (session?.user?.id) {
        userId = session.user.id;
        userEmail = session.user.email || "";
      }
    } catch {
      // fallback
    }

    const wallet = await getUserWallet({ userId, userEmail });

    const db = getDb();
    const paymentFilter: any = {};
    if (userEmail || (userId && userId !== "default")) {
      paymentFilter.$or = [
        ...(userEmail ? [{ "customerInfo.email": userEmail }] : []),
        ...(userId ? [{ user: userId }, { userId }] : []),
      ];
    }

    const payments = await db
      .collection("payments")
      .find(paymentFilter)
      .sort({ createdAt: -1 })
      .limit(15)
      .toArray();

    return NextResponse.json({
      wallet,
      payments: payments.map((p) => ({
        ...p,
        _id: p._id.toString(),
      })),
    });
  } catch (error: any) {
    console.error("Wallet API error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

