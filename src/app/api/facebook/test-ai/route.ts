// src/app/api/facebook/test-ai/route.ts
import { NextRequest, NextResponse } from "next/server";
import { generateCustomerReply } from "@/lib/gemini";
import { getRelevantKnowledge, getDocuments } from "@/lib/knowledge";
import { getFacebookPageByPageId } from "@/lib/facebook";
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
      message,
      pageId,
      conversationHistory = [],
      botTone,
      customInstructions,
    } = body;

    if (!message || !message.trim()) {
      return NextResponse.json({ error: "Message is required" }, { status: 400 });
    }

    let businessName = "Our Store";
    let activeTone = botTone || "friendly";
    let instructions = customInstructions || "";
    let fallbackMsg =
      "I don't have that specific information in my documents right now. A team member will assist you shortly!";

    const targetPageId =
      pageId && pageId !== "all" && pageId !== "global" ? pageId : undefined;

    if (targetPageId) {
      const page = await getFacebookPageByPageId(targetPageId);
      if (page) {
        businessName = page.pageName;
        activeTone = page.botTone || activeTone;
        instructions = page.customInstructions || instructions;
        if (page.fallbackMessage) fallbackMsg = page.fallbackMessage;
      }
    }

    // Retrieve business documents with strict page matching
    const docs = await getDocuments({
      userId,
      pageId: targetPageId,
    });

    const businessKnowledge = await getRelevantKnowledge(message, {
      userId,
      pageId: targetPageId,
    });

    const result = await generateCustomerReply({
      customerMessage: message,
      businessKnowledge,
      businessName,
      botTone: activeTone,
      customInstructions: instructions,
      fallbackMessage: fallbackMsg,
      conversationHistory,
    });

    return NextResponse.json({
      success: true,
      reply: result.reply,
      modelUsed: result.modelUsed,
      pageName: businessName,
      pageId: targetPageId || null,
      docCount: docs.length,
      docTitles: docs.map((d) => d.title),
      hasKnowledge: Boolean(businessKnowledge && businessKnowledge.trim().length > 0),
    });
  } catch (error: any) {
    console.error("Test AI error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

