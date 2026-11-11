// src/app/api/documents/[id]/sync/route.ts
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { syncGoogleDocument } from "@/lib/google-drive";

export async function POST(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await context.params;
    if (!id) {
      return NextResponse.json({ error: "Document ID is required" }, { status: 400 });
    }

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

    const updatedDoc = await syncGoogleDocument(id, userId);

    return NextResponse.json({
      success: true,
      document: updatedDoc,
      message: `Document "${updatedDoc.title}" successfully re-synced with Google Drive!`,
    });
  } catch (error: any) {
    console.error("Document sync error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to re-sync document with Google Drive." },
      { status: 500 },
    );
  }
}

