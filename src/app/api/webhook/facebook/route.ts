// src/app/api/webhook/facebook/route.ts
import { NextRequest, NextResponse } from "next/server";
import {
  getFacebookPageByPageId,
  sendFacebookMessage,
  sendTypingIndicator,
  getFacebookUserProfile,
} from "@/lib/facebook";
import { getRelevantKnowledge } from "@/lib/knowledge";
import { generateCustomerReply } from "@/lib/gemini";
import {
  recordConversationMessage,
  getRecentConversationHistory,
} from "@/lib/conversations";

/**
 * GET: Webhook verification challenge from Meta Developers portal
 */
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const mode = searchParams.get("hub.mode");
  const token = searchParams.get("hub.verify_token");
  const challenge = searchParams.get("hub.challenge");

  const expectedToken =
    process.env.FACEBOOK_VERIFY_TOKEN || "chattime_ai_webhook_verify_token_2026";

  if (mode === "subscribe" && token === expectedToken) {
    console.log("Facebook Webhook verified successfully!");
    return new NextResponse(challenge, {
      status: 200,
      headers: { "Content-Type": "text/plain" },
    });
  }

  console.warn("Facebook Webhook verification failed. Received token:", token);
  return NextResponse.json({ error: "Verification token mismatch" }, { status: 403 });
}

/**
 * POST: Handles incoming customer messages from Facebook Messenger
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    if (body.object !== "page") {
      return NextResponse.json({ status: "IGNORED" }, { status: 200 });
    }

    const entries = body.entry || [];

    for (const entry of entries) {
      const pageId = entry.id;
      const messagingEvents = entry.messaging || [];

      for (const event of messagingEvents) {
        // Skip echo messages (messages sent by our own page) or read receipts
        if (!event.message || event.message.is_echo) {
          continue;
        }

        const senderPsid = event.sender?.id;
        const recipientPageId = event.recipient?.id || pageId;
        const customerMessage = event.message.text;

        if (!senderPsid || !customerMessage) {
          continue;
        }

        console.log(`Received message from customer ${senderPsid}: "${customerMessage}" on page ${recipientPageId}`);

        // Fetch page credentials & settings
        const page = await getFacebookPageByPageId(recipientPageId);
        if (!page) {
          console.warn(`No connected page found for Page ID: ${recipientPageId}`);
          continue;
        }

        // Fetch customer profile name
        const customerProfile = await getFacebookUserProfile(
          page.pageAccessToken,
          senderPsid,
        );

        // Record incoming message in database
        const { conversationId } = await recordConversationMessage({
          userId: page.userId,
          pageId: page.pageId,
          pageName: page.pageName,
          senderPsid,
          customerName: customerProfile.name,
          customerAvatar: customerProfile.profilePic,
          senderType: "customer",
          text: customerMessage,
        });

        // If auto-reply is disabled for this page, stop here (human agent can reply via Inbox)
        if (!page.isActive) {
          console.log(`Auto-reply disabled for page ${page.pageName}`);
          continue;
        }

        // Send typing indicator to customer
        await sendTypingIndicator(page.pageAccessToken, senderPsid, true);

        // Retrieve relevant business documents from knowledge base
        const businessKnowledge = await getRelevantKnowledge(customerMessage, {
          userId: page.userId,
          pageId: page.pageId,
        });

        // Retrieve recent conversation history for multi-turn dialogue
        const history = await getRecentConversationHistory(conversationId, 6);

        // Generate AI reply with Gemini
        let aiReplyText = "";
        let modelUsed = "";

        try {
          const aiResponse = await generateCustomerReply({
            customerMessage,
            businessKnowledge,
            businessName: page.pageName,
            botTone: page.botTone || "friendly",
            customInstructions: page.customInstructions,
            fallbackMessage: page.fallbackMessage,
            conversationHistory: history,
          });

          aiReplyText = aiResponse.reply;
          modelUsed = aiResponse.modelUsed;
        } catch (geminiError: any) {
          console.error("Gemini reply error:", geminiError);
          aiReplyText =
            page.fallbackMessage ||
            "Thank you for contacting us! Our team has received your message and will get back to you shortly.";
        }

        // Stop typing indicator
        await sendTypingIndicator(page.pageAccessToken, senderPsid, false);

        // Send reply to customer on Facebook Messenger
        const sendResult = await sendFacebookMessage(
          page.pageAccessToken,
          senderPsid,
          aiReplyText,
        );

        if (sendResult.success) {
          console.log(`Successfully auto-replied to customer ${senderPsid}`);
        } else {
          console.error(`Failed to send auto-reply to customer ${senderPsid}:`, sendResult.error);
        }

        // Record AI response in database
        await recordConversationMessage({
          userId: page.userId,
          pageId: page.pageId,
          pageName: page.pageName,
          senderPsid,
          customerName: customerProfile.name,
          customerAvatar: customerProfile.profilePic,
          senderType: "ai",
          text: aiReplyText,
          modelUsed,
        });
      }
    }

    // Always respond 200 OK quickly to avoid Facebook retry storms
    return NextResponse.json({ status: "EVENT_RECEIVED" }, { status: 200 });
  } catch (error: any) {
    console.error("Error processing Facebook webhook:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

