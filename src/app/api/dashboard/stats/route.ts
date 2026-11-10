// src/app/api/dashboard/stats/route.ts
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

    const db = getDb();

    // Query collections strictly isolated by user
    const userFilter: any = userId !== "all" ? { userId } : {};

    // Get user's conversation IDs to accurately count messages
    const userConversations = await db
      .collection("fb_conversations")
      .find(userFilter, { projection: { _id: 1 } })
      .toArray();

    const userConvIds = userConversations.map((c) => c._id.toString());

    const messageFilterCustomer: any = { senderType: "customer" };
    if (userId !== "all") {
      messageFilterCustomer.conversationId = { $in: userConvIds };
    }

    const [
      totalDocuments,
      totalPages,
      totalConversations,
      totalCustomerMessages,
      recentConversations,
      wallet,
    ] = await Promise.all([
      db.collection("business_knowledge").countDocuments(userFilter),
      db.collection("facebook_pages").countDocuments(userFilter),
      userConversations.length,
      userId !== "all" && userConvIds.length === 0
        ? Promise.resolve(0)
        : db.collection("fb_messages").countDocuments(messageFilterCustomer),
      db
        .collection("fb_conversations")
        .find(userFilter)
        .sort({ lastMessageAt: -1 })
        .limit(5)
        .toArray(),
      getUserWallet({ userId, userEmail }),
    ]);

    const totalAiReplies = wallet.usedCredits;
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
      wallet,
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
