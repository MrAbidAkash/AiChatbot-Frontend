// src/app/api/facebook/connect-page/route.ts
import { NextRequest, NextResponse } from "next/server";
import {
  upsertFacebookPage,
  subscribePageToWebhook,
} from "@/lib/facebook";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

export async function POST(request: NextRequest) {
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

    const body = await request.json();
    const {
      pageId,
      pageName,
      pageAccessToken,
      category,
      pictureUrl,
      botTone = "friendly",
      fallbackMessage,
      customInstructions,
    } = body;

    if (!pageId || !pageAccessToken) {
      return NextResponse.json(
        { error: "Page ID and Page Access Token are required" },
        { status: 400 },
      );
    }

    // Automatically attempt to subscribe page to Webhooks in Meta
    const subResult = await subscribePageToWebhook(pageId, pageAccessToken);
    if (!subResult.success) {
      console.warn("Webhook auto-subscription warning:", subResult.error);
    }

    // Save to MongoDB
    const saved = await upsertFacebookPage({
      userId,
      pageId,
      pageName: pageName || `Page (${pageId})`,
      pageAccessToken,
      category,
      pictureUrl,
      isActive: true,
      botTone,
      fallbackMessage,
      customInstructions,
    });

    return NextResponse.json({
      success: true,
      page: saved,
      subscribedToWebhook: subResult.success,
    });
  } catch (error: any) {
    console.error("Connect page error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

