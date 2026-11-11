// src/app/api/integrations/google/import/route.ts
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import {
  getValidGoogleToken,
  fetchAuthenticatedGoogleContent,
  fetchPublicGoogleContent,
  parseGoogleUrl,
} from "@/lib/google-drive";
import { saveDocument } from "@/lib/knowledge";

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
    const { fileId, url, pageId, customTitle } = body;

    if (!fileId && !url) {
      return NextResponse.json(
        { error: "Either 'fileId' or 'url' is required." },
        { status: 400 },
      );
    }

    const finalPageId = pageId && pageId !== "all" && pageId !== "global" ? pageId : undefined;
    const token = await getValidGoogleToken(userId);

    let extracted: {
      title: string;
      fileName: string;
      content: string;
      fileType: "doc" | "sheet" | "pdf" | "txt" | "csv";
      size: string;
      webViewLink?: string;
    } | null = null;

    let importedFileId = fileId;
    let source = "google_drive";

    // 1. If URL was provided
    if (url) {
      const parsed = parseGoogleUrl(url);
      if (!parsed) {
        return NextResponse.json(
          {
            error:
              "Invalid Google URL. Please provide a valid Google Docs, Google Sheets, or Google Drive link.",
          },
          { status: 400 },
        );
      }

      importedFileId = parsed.fileId;
      source =
        parsed.type === "sheets"
          ? "google_sheets"
          : parsed.type === "docs"
            ? "google_docs"
            : "google_drive";

      // Try authenticated fetch first if user has connected token
      let fetchedContent = false;
      if (token) {
        try {
          extracted = await fetchAuthenticatedGoogleContent(token, parsed.fileId);
          fetchedContent = true;
        } catch (authErr) {
          console.warn("Authenticated fetch failed, attempting public fetch:", authErr);
        }
      }

      // If not authenticated or auth fetch failed, try public fetch
      if (!fetchedContent) {
        const publicData = await fetchPublicGoogleContent(parsed.fileId, parsed.type);
        const name = customTitle || publicData.title;
        extracted = {
          title: name,
          fileName:
            publicData.fileType === "sheet"
              ? `${name}.csv`
              : publicData.fileType === "doc"
                ? `${name}.txt`
                : `${name}.txt`,
          content: publicData.content,
          fileType: publicData.fileType,
          size: `${(publicData.content.length / 1024).toFixed(1)} KB`,
          webViewLink: url,
        };
      }
    } else {
      // 2. fileId was provided from Drive Picker
      if (!token) {
        return NextResponse.json(
          { error: "Google Drive is not connected. Please connect your Google account." },
          { status: 401 },
        );
      }

      extracted = await fetchAuthenticatedGoogleContent(token, fileId);
      source =
        extracted.fileType === "sheet"
          ? "google_sheets"
          : extracted.fileType === "doc"
            ? "google_docs"
            : "google_drive";
    }

    if (!extracted || !extracted.content || !extracted.content.trim()) {
      return NextResponse.json(
        { error: "Could not extract any readable content from this Google file." },
        { status: 400 },
      );
    }

    const title = customTitle && customTitle.trim() ? customTitle.trim() : extracted.title;

    const doc = await saveDocument({
      userId,
      pageId: finalPageId,
      title,
      fileName: extracted.fileName || `${title}.txt`,
      fileType: extracted.fileType,
      size: extracted.size,
      content: extracted.content.trim(),
      metadata: {
        source,
        googleFileId: importedFileId,
        sourceUrl: url || extracted.webViewLink,
        webViewLink: extracted.webViewLink || url,
        lastSyncedAt: new Date().toISOString(),
      },
    });

    return NextResponse.json({
      success: true,
      document: doc,
      source,
    });
  } catch (error: any) {
    console.error("Google file import error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to import Google file" },
      { status: 500 },
    );
  }
}
