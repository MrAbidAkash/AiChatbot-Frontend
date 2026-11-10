import { NextRequest, NextResponse } from "next/server";
import { getAdminSessionFromRequest } from "@/lib/admin-auth";
import { getDb } from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    const session = getAdminSessionFromRequest(request);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized. Admin session required." }, { status: 401 });
    }

    const db = getDb();

    // Query platform collections in parallel
    const [
      totalUsers,
      totalPages,
      activePages,
      totalDocuments,
      totalConversations,
      totalAiReplies,
      totalCustomerMessages,
      completedPayments,
      recentUsers,
      recentPages,
      recentConversations,
    ] = await Promise.all([
      db.collection("user").countDocuments({}),
      db.collection("facebook_pages").countDocuments({}),
      db.collection("facebook_pages").countDocuments({ isActive: true }),
      db.collection("business_knowledge").countDocuments({}),
      db.collection("fb_conversations").countDocuments({}),
      db.collection("fb_messages").countDocuments({ senderType: "ai" }),
      db.collection("fb_messages").countDocuments({ senderType: "customer" }),
      db.collection("payments").find({ transactionStatus: "Completed" }).toArray(),
      db.collection("user").find({}).sort({ createdAt: -1 }).limit(6).toArray(),
      db.collection("facebook_pages").find({}).sort({ updatedAt: -1 }).limit(6).toArray(),
      db.collection("fb_conversations").find({}).sort({ lastMessageAt: -1 }).limit(6).toArray(),
    ]);

    const totalRevenue = completedPayments.reduce(
      (sum, p) => sum + (Number(p.amount) || 0),
      0,
    );

    // Environment & Developer Configuration Status (Securely exposed to admin only)
    const devConfig = {
      webhookUrl: `${request.nextUrl.origin || "https://chattimeai.com"}/api/webhook/facebook`,
      verifyToken: process.env.FACEBOOK_VERIFY_TOKEN || "chattime_ai_webhook_verify_token_2026",
      facebookAppId: process.env.FACEBOOK_CLIENT_ID || "Not configured",
      hasFacebookSecret: Boolean(process.env.FACEBOOK_CLIENT_SECRET),
      hasGeminiKey: Boolean(process.env.GEMINI_API_KEY),
      hasMongoUri: Boolean(process.env.MONGODB_URI),
      geminiModel: "gemini-flash-lite-latest",
      serverTime: new Date().toISOString(),
    };

    return NextResponse.json({
      metrics: {
        totalUsers,
        totalPages,
        activePages,
        totalDocuments,
        totalConversations,
        totalAiReplies,
        totalCustomerMessages,
        totalMessages: totalAiReplies + totalCustomerMessages,
        totalPaymentsCount: completedPayments.length,
        totalRevenue,
      },
      recentUsers: recentUsers.map((u) => ({
        id: u._id.toString(),
        name: u.name,
        email: u.email,
        createdAt: u.createdAt,
      })),
      recentPages: recentPages.map((p) => ({
        id: p._id.toString(),
        pageId: p.pageId,
        pageName: p.pageName,
        isActive: p.isActive,
        userId: p.userId,
        botTone: p.botTone || "friendly",
        updatedAt: p.updatedAt,
      })),
      recentConversations: recentConversations.map((c) => ({
        id: c._id.toString(),
        pageId: c.pageId,
        pageName: c.pageName,
        customerName: c.customerName,
        lastMessage: c.lastMessage,
        lastMessageAt: c.lastMessageAt,
        status: c.status,
      })),
      devConfig,
    });
  } catch (error: any) {
    console.error("Admin stats error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

