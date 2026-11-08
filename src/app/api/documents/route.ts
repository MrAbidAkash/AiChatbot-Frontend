// src/app/api/documents/route.ts
import { NextRequest, NextResponse } from "next/server";
import { saveDocument, getDocuments } from "@/lib/knowledge";
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
      // fallback for dev
    }

    const searchParams = request.nextUrl.searchParams;
    const pageId = searchParams.get("pageId") || undefined;

    const docs = await getDocuments({ userId, pageId });
    return NextResponse.json({ documents: docs });
  } catch (error: any) {
    console.error("Error fetching documents:", error);
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
      // fallback for dev
    }

    const contentType = request.headers.get("content-type") || "";

    // 1. Handle JSON input (direct text or FAQ snippet)
    if (contentType.includes("application/json")) {
      const body = await request.json();
      const { title, content, pageId, fileType = "manual" } = body;

      if (!content || !content.trim()) {
        return NextResponse.json(
          { error: "Content is required" },
          { status: 400 },
        );
      }

      const docTitle = title && title.trim() ? title.trim() : "Business FAQ / Note";
      const doc = await saveDocument({
        userId,
        pageId,
        title: docTitle,
        fileName: `${docTitle.toLowerCase().replace(/\s+/g, "_")}.txt`,
        fileType: fileType as any,
        content: content.trim(),
      });

      return NextResponse.json({ success: true, document: doc });
    }

    // 2. Handle Multipart Form Data (File Upload)
    if (contentType.includes("multipart/form-data")) {
      const formData = await request.formData();
      const file = formData.get("file") as File | null;
      const customTitle = formData.get("title") as string | null;
      const pageId = (formData.get("pageId") as string) || undefined;

      if (!file) {
        return NextResponse.json({ error: "No file provided" }, { status: 400 });
      }

      const fileName = file.name;
      const extension = fileName.split(".").pop()?.toLowerCase() || "txt";
      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      let extractedText = "";
      let fileType: "pdf" | "txt" | "docx" | "csv" = "txt";

      if (extension === "pdf") {
        fileType = "pdf";
        try {
          // Use Gemini Multimodal PDF extraction (eliminates Next.js server worker/bundle issues,
          // handles tables, multilingual text, scanned documents, etc.)
          const { extractPdfTextWithGemini } = await import("@/lib/gemini");
          extractedText = await extractPdfTextWithGemini(buffer, fileName);
        } catch (pdfErr: any) {
          console.error("PDF extraction error:", pdfErr);
          return NextResponse.json(
            {
              error:
                pdfErr?.message ||
                "Failed to parse PDF file. Please ensure GEMINI_API_KEY is valid.",
            },
            { status: 400 },
          );
        }
      } else if (["txt", "md", "csv", "json"].includes(extension)) {
        fileType = extension === "csv" ? "csv" : "txt";
        extractedText = buffer.toString("utf-8");
      } else {
        // Fallback for docx/other text files
        extractedText = buffer.toString("utf-8");
      }

      if (!extractedText.trim()) {
        return NextResponse.json(
          { error: "Could not extract any readable text from this file." },
          { status: 400 },
        );
      }

      const title =
        customTitle && customTitle.trim()
          ? customTitle.trim()
          : fileName.replace(/\.[^/.]+$/, "");

      const sizeKb = (file.size / 1024).toFixed(1);
      const sizeStr = file.size > 1048576 ? `${(file.size / 1048576).toFixed(1)} MB` : `${sizeKb} KB`;

      const doc = await saveDocument({
        userId,
        pageId,
        title,
        fileName,
        fileType,
        size: sizeStr,
        content: extractedText.trim(),
      });

      return NextResponse.json({ success: true, document: doc });
    }

    return NextResponse.json(
      { error: "Unsupported Content-Type" },
      { status: 400 },
    );
  } catch (error: any) {
    console.error("Document upload error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
