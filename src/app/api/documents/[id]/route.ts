// src/app/api/documents/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { deleteDocument } from "@/lib/knowledge";
import { getDb } from "@/lib/db";
import { ObjectId } from "mongodb";

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await context.params;
    if (!id) {
      return NextResponse.json({ error: "Document ID is required" }, { status: 400 });
    }

    const db = getDb();
    const collection = db.collection("business_knowledge");

    let filter: any;
    try {
      filter = { _id: new ObjectId(id) };
    } catch {
      filter = { _id: id };
    }

    const doc = await collection.findOne(filter);
    if (!doc) {
      return NextResponse.json({ error: "Document not found" }, { status: 404 });
    }

    return NextResponse.json({ document: doc });
  } catch (error: any) {
    console.error("Get document error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

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

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await context.params;
    if (!id) {
      return NextResponse.json({ error: "Document ID is required" }, { status: 400 });
    }

    const body = await request.json();
    const { pageId } = body;

    const db = getDb();
    const collection = db.collection("business_knowledge");

    let filter: any;
    try {
      filter = { _id: new ObjectId(id) };
    } catch {
      filter = { _id: id };
    }

    const targetPageId =
      pageId && pageId !== "all" && pageId !== "global" ? pageId : null;

    const res = await collection.updateOne(filter, {
      $set: {
        pageId: targetPageId,
        updatedAt: new Date(),
      },
    });

    if (res.matchedCount === 0) {
      return NextResponse.json({ error: "Document not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, pageId: targetPageId });
  } catch (error: any) {
    console.error("Update document page error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

