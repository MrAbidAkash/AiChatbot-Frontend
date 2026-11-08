// src/app/api/conversations/route.ts
import { NextRequest, NextResponse } from "next/server";
import {
  getConversations,
  recordConversationMessage,
} from "@/lib/conversations";
import {
  getFacebookPageByPageId,
  sendFacebookMessage,
} from "@/lib/facebook";
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

    const searchParams = request.nextUrl.searchParams;
    const pageId = searchParams.get("pageId") || undefined;
    const status = searchParams.get("status") || undefined;
    const search = searchParams.get("search") || undefined;

    const conversations = await getConversations({
      userId,
      pageId,
      status,
      search,
    });

    return NextResponse.json({ conversations });
  } catch (error: any) {
    console.error("Error fetching conversations:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

/**
 * Send manual reply from Website Dashboard to customer on Facebook Messenger
 */
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
    const { conversationId, pageId, senderPsid, text } = body;

    if (!pageId || !senderPsid || !text) {
      return NextResponse.json(
        { error: "pageId, senderPsid and text are required" },
        { status: 400 },
      );
    }

    const page = await getFacebookPageByPageId(pageId);
    if (!page) {
      return NextResponse.json(
        { error: "Connected Facebook Page not found" },
        { status: 404 },
      );
    }

    // Send through Facebook Graph API
    const fbRes = await sendFacebookMessage(
      page.pageAccessToken,
      senderPsid,
      text,
    );

    if (!fbRes.success) {
      return NextResponse.json(
        { error: "Failed to send message to Facebook", details: fbRes.error },
        { status: 502 },
      );
    }

    // Record human reply in database
    await recordConversationMessage({
      userId,
      pageId,
      pageName: page.pageName,
      senderPsid,
      senderType: "human",
      text,
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Error sending manual reply:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

