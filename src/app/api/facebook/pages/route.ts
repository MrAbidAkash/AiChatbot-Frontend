// src/app/api/facebook/pages/route.ts
import { NextRequest, NextResponse } from "next/server";
import {
  getFacebookPages,
  upsertFacebookPage,
  deleteFacebookPage,
  updateFacebookPageSettings,
} from "@/lib/facebook";
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

    const pages = await getFacebookPages(userId);
    return NextResponse.json({ pages });
  } catch (error: any) {
    console.error("Error fetching Facebook pages:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

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
      isActive = true,
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

    const cleanPageName = pageName && pageName.trim() ? pageName.trim() : `Facebook Page (${pageId})`;

    const saved = await upsertFacebookPage({
      userId,
      pageId: pageId.trim(),
      pageName: cleanPageName,
      pageAccessToken: pageAccessToken.trim(),
      isActive,
      botTone,
      fallbackMessage,
      customInstructions,
    });

    return NextResponse.json({ success: true, page: saved });
  } catch (error: any) {
    console.error("Error saving Facebook page:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const pageId = searchParams.get("pageId");

    if (!pageId) {
      return NextResponse.json({ error: "pageId parameter is required" }, { status: 400 });
    }

    const deleted = await deleteFacebookPage(pageId);
    return NextResponse.json({ success: deleted });
  } catch (error: any) {
    console.error("Error deleting Facebook page:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
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
    const { pageId, botTone, customInstructions, fallbackMessage, isActive } = body;

    const modifiedCount = await updateFacebookPageSettings({
      userId,
      pageId: pageId || "global",
      botTone,
      customInstructions,
      fallbackMessage,
      isActive,
    });

    return NextResponse.json({ success: true, modifiedCount });
  } catch (error: any) {
    console.error("Error updating Facebook page settings:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

