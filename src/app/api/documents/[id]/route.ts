// src/app/api/documents/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { deleteDocument } from "@/lib/knowledge";

export async function DELETE(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await context.params;
    if (!id) {
      return NextResponse.json({ error: "Document ID is required" }, { status: 400 });
    }

    const deleted = await deleteDocument(id);
    if (!deleted) {
      return NextResponse.json({ error: "Document not found or could not be deleted" }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: "Document deleted successfully" });
  } catch (error: any) {
    console.error("Delete document error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

