// src/app/api/webhook/facebook/route.ts
import { NextRequest, NextResponse, after } from "next/server";
import {
  getFacebookPageByPageId,
  sendFacebookMessage,
  sendTypingIndicator,
  getFacebookUserProfile,
  isConnectedFacebookPage,
} from "@/lib/facebook";
import { getRelevantKnowledge } from "@/lib/knowledge";
import { generateCustomerReply } from "@/lib/gemini";
import {
  recordConversationMessage,
  getRecentConversationHistory,
  isMessageMidProcessed,
} from "@/lib/conversations";
import { getUserWallet } from "@/lib/billing";
import { handleAutoStockDeductionOnOrder } from "@/lib/google-sheets-stock";

export const dynamic = "force-dynamic";

/**
 * In-memory deduplication cache for Facebook message IDs (mid).
 * Facebook Messenger assigns a unique `mid` to every message.
 * When Meta retries webhook delivery due to timeout, the `mid` is identical.
 */
const processedMids = new Map<string, number>();
const MID_CACHE_TTL_MS = 15 * 60 * 1000; // 15 minutes TTL

function cleanupOldMids() {
  const cutoff = Date.now() - MID_CACHE_TTL_MS;
  for (const [mid, timestamp] of processedMids.entries()) {
    if (timestamp < cutoff) {
      processedMids.delete(mid);
    }
  }
}

function isMidSeen(mid?: string): boolean {
  if (!mid) return false;
  const timestamp = processedMids.get(mid);
  if (!timestamp) return false;
  if (Date.now() - timestamp > MID_CACHE_TTL_MS) {
    processedMids.delete(mid);
    return false;
  }
  return true;
}

function markMidSeen(mid?: string) {
  if (!mid) return;
  processedMids.set(mid, Date.now());
  if (processedMids.size > 2000) {
    cleanupOldMids();
  }
}

/**
 * In-flight lock map to prevent concurrent duplicate processing for the same sender and text.
 */
const inFlightRequests = new Map<string, number>();
const IN_FLIGHT_TIMEOUT_MS = 10 * 1000; // 10 seconds

interface ValidEventItem {
  pageId: string;
  recipientPageId: string;
  senderPsid: string;
  customerMessage: string;
  mid?: string;
  inFlightKey: string;
}

/**
 * Helper to asynchronously process a single incoming Facebook message
 */
async function processIncomingMessage(item: ValidEventItem) {
  const { pageId, recipientPageId, senderPsid, customerMessage, mid } = item;

  // 1. Guard against infinite bot loop: ensure sender is not a connected Facebook Page
  if (await isConnectedFacebookPage(senderPsid)) {
    console.log(`[FB Webhook] Sender ${senderPsid} is a connected Page ID. Ignoring self/page message.`);
    return;
  }

  // 2. Persistent DB deduplication check
  if (mid && (await isMessageMidProcessed(mid))) {
    console.log(`[FB Webhook] Message MID ${mid} already processed in DB. Skipping.`);
    return;
  }

  // 3. Fetch connected page credentials & settings
  const page = await getFacebookPageByPageId(recipientPageId);
  if (!page) {
    console.warn(`[FB Webhook] No connected page found for Page ID: ${recipientPageId}`);
    return;
  }

  // 4. Fetch customer profile info (name, avatar)
  const customerProfile = await getFacebookUserProfile(
    page.pageAccessToken,
    senderPsid,
  );

  // 5. Record incoming customer message in database
  const { conversationId } = await recordConversationMessage({
    userId: page.userId,
    pageId: page.pageId,
    pageName: page.pageName,
    senderPsid,
    customerName: customerProfile.name,
    customerAvatar: customerProfile.profilePic,
    senderType: "customer",
    text: customerMessage,
    mid,
  });

  // 6. If AI auto-reply is disabled for this page, stop here (agent can reply manually via Inbox)
  if (!page.isActive) {
    console.log(`[FB Webhook] Auto-reply is disabled for page "${page.pageName}". Saved message for human agent.`);
    return;
  }

  // 7. Check user AI credits and wallet balance
  const wallet = await getUserWallet({
    userId: page.userId,
    pageId: page.pageId,
  });

  if (!wallet.hasCredits) {
    console.warn(
      `[FB Webhook] Balance exhausted for user "${page.userId}" on page "${page.pageName}". Remaining replies: 0 (Used: ${wallet.usedCredits}/${wallet.totalAllocatedCredits}, Balance: ৳${wallet.remainingBalance}). Halting AI auto-reply.`
    );
    // The incoming customer message is already recorded as 'pending' in the Inbox so human agent can reply manually.
    return;
  }

  // 8. Show typing indicator in Messenger
  await sendTypingIndicator(page.pageAccessToken, senderPsid, true);

  // 9. Retrieve isolated knowledge documents for this specific page
  const businessKnowledge = await getRelevantKnowledge(customerMessage, {
    userId: page.userId,
    pageId: page.pageId,
  });

  console.log(
    `[FB Webhook] Knowledge loaded (${businessKnowledge.length} chars) for page "${page.pageName}". Generating AI reply...`,
  );

  // 10. Retrieve recent conversation history for multi-turn context
  const history = await getRecentConversationHistory(conversationId, 6);

  // 11. Generate AI reply with Gemini
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
      userId: page.userId,
      pageId: page.pageId,
      enableTools: true,
    });

    aiReplyText = aiResponse.reply;
    modelUsed = aiResponse.modelUsed;
    console.log(`[FB Webhook] AI reply generated (${aiReplyText.length} chars, model: ${modelUsed})`);
  } catch (geminiError: any) {
    console.error("[FB Webhook] Gemini reply error:", geminiError);
    aiReplyText =
      page.fallbackMessage ||
      "Thank you for contacting us! Our support team will get back to you shortly.";
  }

  // 11. Turn off typing indicator
  await sendTypingIndicator(page.pageAccessToken, senderPsid, false);

  // 12. Send reply to customer on Facebook Messenger
  const sendResult = await sendFacebookMessage(
    page.pageAccessToken,
    senderPsid,
    aiReplyText,
  );

  const replyMid = sendResult.data?.message_id;
  if (replyMid) {
    // Register our own reply MID in cache so we never echo or loop on it
    markMidSeen(replyMid);
  }

  if (sendResult.success) {
    console.log(`[FB Webhook] Successfully auto-replied to customer ${senderPsid} (MID: ${replyMid || "N/A"})`);
  } else {
    console.error(`[FB Webhook] Failed to send auto-reply to customer ${senderPsid}:`, sendResult.error);
  }

  // 13. Record AI response in database
  await recordConversationMessage({
    userId: page.userId,
    pageId: page.pageId,
    pageName: page.pageName,
    senderPsid,
    customerName: customerProfile.name,
    customerAvatar: customerProfile.profilePic,
    senderType: "ai",
    text: aiReplyText,
    mid: replyMid,
    modelUsed,
  });

  // 14. If customer confirmed an order, automatically decrement product stock in Google Sheet
  handleAutoStockDeductionOnOrder({
    userId: page.userId || "default",
    pageId: page.pageId,
    customerMessage,
    aiReply: aiReplyText,
    conversationHistory: history,
    customerName: customerProfile.name,
    senderPsid,
  }).catch((stockErr) => {
    console.warn("[FB Webhook] Background Google Sheet stock update error:", stockErr);
  });
}

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
    const validEvents: ValidEventItem[] = [];

    for (const entry of entries) {
      const pageId = entry.id;
      const messagingEvents = entry.messaging || [];

      for (const event of messagingEvents) {
        // 1. Skip echoes (messages sent by our own page)
        if (event.message?.is_echo) {
          continue;
        }

        // 2. Skip delivery receipts, read receipts, and reactions
        if (event.delivery || event.read || event.reaction) {
          continue;
        }

        // 3. Skip messages sent by apps/bots (human customer messages never have app_id)
        if (event.message?.app_id) {
          continue;
        }

        const senderPsid = event.sender?.id;
        const recipientPageId = event.recipient?.id || pageId;
        const customerMessage = event.message?.text?.trim();
        const mid = event.message?.mid;

        // 4. Ensure message has valid sender and non-empty text
        if (!senderPsid || !customerMessage) {
          continue;
        }

        // 5. Never process messages where sender is the page itself
        if (senderPsid === pageId || senderPsid === recipientPageId) {
          continue;
        }

        // 6. Deduplicate by Facebook Message ID (mid) in memory
        if (mid && isMidSeen(mid)) {
          console.log(`[FB Webhook] Duplicate message mid ${mid} detected in memory. Skipping.`);
          continue;
        }

        // 7. Check in-flight lock for identical sender and text within 10s
        const inFlightKey = `${senderPsid}:${customerMessage}`;
        const inFlightTime = inFlightRequests.get(inFlightKey);
        if (inFlightTime && Date.now() - inFlightTime < IN_FLIGHT_TIMEOUT_MS) {
          console.log(`[FB Webhook] Request already in-flight for ${inFlightKey}. Skipping concurrent duplicate.`);
          continue;
        }

        // Immediately mark seen in memory before asynchronous execution starts
        if (mid) {
          markMidSeen(mid);
        }
        inFlightRequests.set(inFlightKey, Date.now());

        console.log(`[FB Webhook] Accepted new message from ${senderPsid}: "${customerMessage}" (MID: ${mid || "none"})`);

        validEvents.push({
          pageId,
          recipientPageId,
          senderPsid,
          customerMessage,
          mid,
          inFlightKey,
        });
      }
    }

    if (validEvents.length === 0) {
      return NextResponse.json({ status: "NO_ACTION" }, { status: 200 });
    }

    // Schedule background processing via Next.js after()
    // This allows returning 200 OK to Meta IMMEDIATELY (< 50ms), preventing Meta timeout retry storms!
    after(async () => {
      for (const item of validEvents) {
        try {
          await processIncomingMessage(item);
        } catch (err: any) {
          console.error(`[FB Webhook] Background processing error for ${item.senderPsid}:`, err);
        } finally {
          inFlightRequests.delete(item.inFlightKey);
        }
      }
    });

    // Always respond 200 OK immediately to Meta
    return NextResponse.json({ status: "EVENT_RECEIVED" }, { status: 200 });
  } catch (error: any) {
    console.error("Error processing Facebook webhook:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}


