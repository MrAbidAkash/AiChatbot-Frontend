// src/app/api/conversations/[id]/messages/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getConversationMessages } from "@/lib/conversations";

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await context.params;
    if (!id) {
      return NextResponse.json({ error: "Conversation ID is required" }, { status: 400 });
    }

    const messages = await getConversationMessages(id);
    return NextResponse.json({ messages });
  } catch (error: any) {
    console.error("Error fetching conversation messages:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

