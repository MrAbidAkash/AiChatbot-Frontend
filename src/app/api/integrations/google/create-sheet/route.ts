// src/app/api/integrations/google/create-sheet/route.ts
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { getDb } from "@/lib/db";
import { getValidGoogleToken, createGoogleSpreadsheet } from "@/lib/google-drive";
import { saveDocument } from "@/lib/knowledge";

export const MAX_DOCUMENTS_LIMIT = 10;

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

    const token = await getValidGoogleToken(userId);
    if (!token) {
      return NextResponse.json(
        {
          error: "Google account is not connected. Please connect your Google Drive account first.",
          connected: false,
        },
        { status: 401 },
      );
    }

    // Check document limit
    const db = getDb();
    const countQuery: any = {};
    if (userId && userId !== "all") {
      countQuery.$or = [{ userId }, { userId: "default" }, { userId: { $exists: false } }];
    }
    const currentDocCount = await db.collection("business_knowledge").countDocuments(countQuery);

    if (currentDocCount >= MAX_DOCUMENTS_LIMIT) {
      return NextResponse.json(
        {
          error: "সর্বোচ্চ ১০টি ফাইল বা ডকুমেন্ট সংরক্ষণ করা সম্ভব। নতুন শিট তৈরি করতে অনুগ্রহ করে পূর্বের কোনো ফাইল ডিলিট করুন।",
        },
        { status: 400 },
      );
    }

    const body = await request.json().catch(() => ({}));
    const { title, pageId } = body;
    const finalPageId = pageId && pageId !== "all" && pageId !== "global" ? pageId : undefined;

    // Create the spreadsheet directly in merchant's Google Drive
    const created = await createGoogleSpreadsheet(token, title);

    // Automatically index it into ChatTime AI knowledge base
    const doc = await saveDocument({
      userId,
      pageId: finalPageId,
      title: created.title,
      fileName: `${created.title}.csv`,
      fileType: "sheet",
      size: `${(created.structuredContent.length / 1024).toFixed(1)} KB`,
      content: created.structuredContent,
      metadata: {
        source: "google_sheets",
        googleFileId: created.spreadsheetId,
        sourceUrl: created.spreadsheetUrl,
        webViewLink: created.spreadsheetUrl,
        createdByApp: true,
      },
    });

    return NextResponse.json({
      success: true,
      spreadsheetId: created.spreadsheetId,
      url: created.spreadsheetUrl,
      title: created.title,
      document: doc,
    });
  } catch (error: any) {
    console.error("Error creating Google Spreadsheet:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to create Google Spreadsheet in Drive" },
      { status: 500 },
    );
  }
}
