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

    // Query collections strictly isolated by user
    const userFilter: any = userId !== "all" ? { userId } : {};

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

    // Get user's conversation IDs to accurately count messages
    const userConversations = await db
      .collection("fb_conversations")
      .find(userFilter, { projection: { _id: 1 } })
      .toArray();

    const userConvIds = userConversations.map((c) => c._id.toString());

    const messageFilterAi: any = { senderType: "ai" };
    const messageFilterCustomer: any = { senderType: "customer" };

    if (userId !== "all") {
      messageFilterAi.conversationId = { $in: userConvIds };
      messageFilterCustomer.conversationId = { $in: userConvIds };
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
      userConversations.length,
      userId !== "all" && userConvIds.length === 0
        ? Promise.resolve(0)
        : db.collection("fb_messages").countDocuments(messageFilterAi),
      userId !== "all" && userConvIds.length === 0
        ? Promise.resolve(0)
        : db.collection("fb_messages").countDocuments(messageFilterCustomer),
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

    // Pricing: 50 poisa (৳0.50) per reply
    const COST_PER_REPLY = 0.50;

    // Calculate recharged replies including pack bonuses
    const rechargedReplies = completedPayments.reduce((total, p) => {
      const amt = Number(p.amount) || 0;
      const baseReplies = Math.round(amt / COST_PER_REPLY);
      const bonusMultiplier = amt >= 5000 ? 1.2 : amt >= 1000 ? 1.1 : 1.0;
      return total + Math.round(baseReplies * bonusMultiplier);
    }, 0);

    // Free trial allocation is 50 AI replies (worth ৳25.00)
    const freeTrialReplies = 50;
    const totalAllocatedReplies = freeTrialReplies + rechargedReplies;
    const remainingReplies = Math.max(0, totalAllocatedReplies - totalAiReplies);
    const remainingBalance = Number((remainingReplies * COST_PER_REPLY).toFixed(2));
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
        totalAllocatedCredits: totalAllocatedReplies,
        remainingReplies,
        remainingBalance,
        usedCredits: totalAiReplies,
        costPerReply: COST_PER_REPLY,
        totalRechargedAmount,
        isPaidUser,
        planTitle: isPaidUser ? "রিচার্জড পেইড প্যাক" : "ফ্রি ট্রায়াল ব্যালেন্স",
        isActive: remainingReplies > 0,
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
