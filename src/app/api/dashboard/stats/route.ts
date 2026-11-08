// src/app/api/dashboard/stats/route.ts
import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

export async function GET() {
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

    const db = getDb();

    // Query collections
    const userFilter: any =
      userId !== "all"
        ? { $or: [{ userId }, { userId: "default" }, { userId: { $exists: false } }] }
        : {};

    const [
      totalDocuments,
      totalPages,
      totalConversations,
      totalAiReplies,
      totalCustomerMessages,
      recentConversations,
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
    ]);

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

