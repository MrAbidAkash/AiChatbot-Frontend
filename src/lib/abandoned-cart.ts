// src/lib/abandoned-cart.ts
import { getDb } from "./db";
import { sendFacebookMessage } from "./facebook";
import { recordConversationMessage } from "./conversations";

export interface AbandonedCartItem {
  conversationId: string;
  senderPsid: string;
  pageId: string;
  pageName: string;
  customerName: string;
  customerPhone?: string;
  deliveryAddress?: string;
  productOfInterest?: string;
  lastMessageText: string;
  lastMessageAt: Date;
  suggestedFollowup: string;
}

/**
 * Generate a courteous, warm, and highly converting follow-up message
 */
export function generatePersonalizedFollowup(
  customerName: string,
  productOfInterest?: string,
  language: "bn" | "en" = "bn",
): string {
  const cleanName = customerName && customerName !== "Customer" ? customerName : "";
  const nameSalutation = cleanName ? `${cleanName} ভাই/আপু, ` : "";

  if (language === "bn") {
    if (productOfInterest) {
      return `আসসালামু আলাইকুম ${nameSalutation}আপনার পছন্দের "${productOfInterest}"-টি কি আপনার জন্য বুক করে দেব? আমাদের স্টকে আর মাত্র কয়েকটি অবশিষ্ট আছে। আজকের মধ্যেই পার্সেল রেডি করে পাঠিয়ে দেওয়া যাবে!`;
    }
    return `আসসালামু আলাইকুম ${nameSalutation}আপনার পছন্দের প্রোডাক্টটি কি কনফার্ম করে দেব? আপনার ঠিকানায় কি পার্সেলটি পাঠিয়ে দেব?`;
  } else {
    if (productOfInterest) {
      return `Hi ${cleanName ? cleanName + ", " : ""}would you like us to reserve the "${productOfInterest}" for you? We have limited stock remaining and can dispatch it today!`;
    }
    return `Hi ${cleanName ? cleanName + ", " : ""}would you like to complete your order? Please let us know if you need any assistance!`;
  }
}

/**
 * Scan for high-intent conversations that went inactive between 30 minutes and 24 hours ago
 * (Within Meta's compliant 24-hour messaging window)
 */
export async function scanAbandonedConversations(options: {
  userId?: string;
  pageId?: string;
  limit?: number;
}): Promise<AbandonedCartItem[]> {
  const { userId, pageId, limit = 20 } = options;
  const db = getDb();

  const now = Date.now();
  const thirtyMinutesAgo = new Date(now - 30 * 60 * 1000);
  const twentyFourHoursAgo = new Date(now - 24 * 60 * 60 * 1000);

  // 1. Build conversation match query
  const matchQuery: any = {
    updatedAt: { $gte: twentyFourHoursAgo, $lte: thirtyMinutesAgo },
  };

  if (userId && userId !== "all") {
    matchQuery.$or = [{ userId }, { userId: "default" }, { userId: { $exists: false } }, { userId: null }];
  }
  if (pageId && pageId !== "all") {
    matchQuery.pageId = pageId;
  }

  const conversations = await db
    .collection("conversations")
    .find(matchQuery)
    .sort({ updatedAt: -1 })
    .limit(limit * 2)
    .toArray();

  const abandonedList: AbandonedCartItem[] = [];

  for (const conv of conversations) {
    if (!conv.senderPsid) continue;

    // Check if an order was already confirmed for this customer in the last 24h
    const existingOrder = await db.collection("orders").findOne({
      senderPsid: conv.senderPsid,
      createdAt: { $gte: twentyFourHoursAgo },
    });

    if (existingOrder) {
      continue; // Order was placed, not abandoned!
    }

    // Check if we already sent a follow-up to this customer in the last 24 hours
    const alreadyFollowedUp = await db.collection("conversation_messages").findOne({
      conversationId: conv._id.toString(),
      senderType: "ai",
      text: { $regex: /(?:বুক\s*করে\s*দেব|reserve|complete\s*your\s*order|পার্সেলটি\s*পাঠিয়ে)/i },
      createdAt: { $gte: twentyFourHoursAgo },
    });

    if (alreadyFollowedUp) {
      continue; // Already followed up!
    }

    // Retrieve recent messages to determine high intent
    const messages = await db
      .collection("conversation_messages")
      .find({ conversationId: conv._id.toString() })
      .sort({ createdAt: -1 })
      .limit(6)
      .toArray();

    if (messages.length === 0) continue;

    const allText = messages.map((m) => m.text || "").join(" ");

    // Check for high intent signals (price inquiry, stock, order inquiry, address keywords, phone)
    const hasIntent =
      /(?:order|অর্ডার|দাম|price|koto|কত|size|সাইজ|নিতে চাই|kinte|lagbe|ache|ঠিকানা|address|01[3-9]\d{8})/i.test(
        allText,
      );

    if (hasIntent) {
      // Extract candidate product
      let candidateProduct: string | undefined;
      for (const m of messages) {
        const prodMatch = (m.text || "").match(
          /(?:Formal Leather Wallet|Winter Fleece Hoodie|Embroidered Silk Kurti|Cotton Panjabi|Kabli|T-Shirt|Wallet|হুডি|পাঞ্জাবি|কুর্তি|ওয়ালেট)/i,
        );
        if (prodMatch) {
          candidateProduct = prodMatch[0];
          break;
        }
      }

      const lastMsg = messages[0];
      const customerName = conv.customerName || "Customer";
      const followupText = generatePersonalizedFollowup(customerName, candidateProduct, "bn");

      abandonedList.push({
        conversationId: conv._id.toString(),
        senderPsid: conv.senderPsid,
        pageId: conv.pageId,
        pageName: conv.pageName || "Our Store",
        customerName,
        customerPhone: conv.customerPhone || undefined,
        deliveryAddress: conv.deliveryAddress || undefined,
        productOfInterest: candidateProduct,
        lastMessageText: lastMsg.text || "",
        lastMessageAt: conv.updatedAt || conv.createdAt,
        suggestedFollowup: followupText,
      });

      if (abandonedList.length >= limit) {
        break;
      }
    }
  }

  return abandonedList;
}

/**
 * Send an automated follow-up message to an abandoned cart customer
 */
export async function sendCartFollowupMessage(options: {
  pageAccessToken: string;
  senderPsid: string;
  pageId: string;
  pageName: string;
  userId: string;
  messageText: string;
}): Promise<{ success: boolean; messageId?: string; error?: string }> {
  const { pageAccessToken, senderPsid, pageId, pageName, userId, messageText } = options;

  const result = await sendFacebookMessage(pageAccessToken, senderPsid, messageText);

  if (result.success) {
    const mid = result.data?.message_id;
    await recordConversationMessage({
      userId,
      pageId,
      pageName,
      senderPsid,
      senderType: "ai",
      text: messageText,
      mid,
      modelUsed: "cart-recovery-followup",
    });
    return { success: true, messageId: mid };
  } else {
    return { success: false, error: result.error };
  }
}
