// src/app/api/dashboard/stats/route.ts
import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

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

    const db = getDb();

    // Query collections
    const userFilter: any =
      userId !== "all"
        ? { $or: [{ userId }, { userId: "default" }, { userId: { $exists: false } }] }
        : {};

    // Completed bKash / payment records for user
    const paymentFilter: any = {
      transactionStatus: "Completed",
    };
    if (userEmail || (userId && userId !== "default")) {
      paymentFilter.$or = [
        ...(userEmail ? [{ "customerInfo.email": userEmail }] : []),
        ...(userId ? [{ user: userId }, { userId }] : []),
      ];
    }

    const [
      totalDocuments,
      totalPages,
      totalConversations,
      totalAiReplies,
      totalCustomerMessages,
      recentConversations,
      completedPayments,
    ] = await Promise.all([
      db.collection("business_knowledge").countDocuments(userFilter),
      db.collection("facebook_pages").countDocuments(userFilter),
      db.collection("fb_conversations").countDocuments(userFilter),
      db.collection("fb_messages").countDocuments({ senderType: "ai" }),
      db.collection("fb_messages").countDocuments({ senderType: "customer" }),
      db
        .collection("fb_conversations")
        .find(userFilter)
        .sort({ lastMessageAt: -1 })
        .limit(5)
        .toArray(),
      db.collection("payments").find(paymentFilter).toArray(),
    ]);

    const totalRechargedAmount = completedPayments.reduce(
      (sum, p) => sum + (Number(p.amount) || 0),
      0
    );

    // Free trial allocation is 50 AI replies (equivalent to ৳50.00)
    const freeTrialCredits = 50;
    const totalAllocatedCredits = freeTrialCredits + totalRechargedAmount;
    const remainingBalance = Math.max(0, totalAllocatedCredits - totalAiReplies);
    const isPaidUser = totalRechargedAmount > 0;

    const totalMessages = totalAiReplies + totalCustomerMessages;
    const responseRate =
      totalCustomerMessages > 0
        ? Math.min(100, Math.round((totalAiReplies / totalCustomerMessages) * 100))
        : 100;

    return NextResponse.json({
      totalDocuments,
      totalPages,
      totalConversations,
      totalMessages,
      totalAiReplies,
      responseRate,
      wallet: {
        totalAllocatedCredits,
        remainingBalance,
        usedCredits: totalAiReplies,
        totalRechargedAmount,
        isPaidUser,
        planTitle: isPaidUser ? "রিচার্জড পেইড প্যাক" : "ফ্রি ট্রায়াল ব্যালেন্স",
        isActive: remainingBalance > 0,
      },
      recentConversations: recentConversations.map((c) => ({
        ...c,
        _id: c._id.toString(),
      })),
    });
  } catch (error: any) {
    console.error("Dashboard stats error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
