// src/lib/conversations.ts
import { getDb } from "./db";
import { ObjectId } from "mongodb";

export interface ConversationRecord {
  _id?: ObjectId | string;
  userId?: string;
  pageId: string;
  pageName: string;
  senderPsid: string;
  customerName: string;
  customerAvatar?: string;
  lastMessage: string;
  lastMessageAt: Date;
  unread: boolean;
  status: "ai_replied" | "pending" | "human_replied";
  createdAt: Date;
  updatedAt: Date;
}

export interface MessageRecord {
  _id?: ObjectId | string;
  conversationId: string;
  userId?: string;
  senderPsid: string;
  senderType: "customer" | "ai" | "human";
  name: string;
  text: string;
  timestamp: Date;
  modelUsed?: string;
}

const CONV_COLLECTION = "fb_conversations";
const MSG_COLLECTION = "fb_messages";

/**
 * Record a message and update conversation status
 */
export async function recordConversationMessage(params: {
  userId?: string;
  pageId: string;
  pageName?: string;
  senderPsid: string;
  customerName?: string;
  customerAvatar?: string;
  senderType: "customer" | "ai" | "human";
  text: string;
  modelUsed?: string;
}): Promise<{ conversationId: string; messageId: string }> {
  const db = getDb();
  const convCol = db.collection<ConversationRecord>(CONV_COLLECTION);
  const msgCol = db.collection<MessageRecord>(MSG_COLLECTION);

  const now = new Date();

  // Find or create conversation
  let conv = await convCol.findOne({
    pageId: params.pageId,
    senderPsid: params.senderPsid,
  });

  let conversationId: string;

  const statusMap = {
    customer: "pending",
    ai: "ai_replied",
    human: "human_replied",
  } as const;

  if (!conv) {
    const newConv: ConversationRecord = {
      userId: params.userId || "default",
      pageId: params.pageId,
      pageName: params.pageName || "Facebook Page",
      senderPsid: params.senderPsid,
      customerName: params.customerName || `Customer ${params.senderPsid.slice(-4)}`,
      customerAvatar: params.customerAvatar || "",
      lastMessage: params.text,
      lastMessageAt: now,
      unread: params.senderType === "customer",
      status: statusMap[params.senderType],
      createdAt: now,
      updatedAt: now,
    };
    const res = await convCol.insertOne(newConv as any);
    conversationId = res.insertedId.toString();
  } else {
    conversationId = conv._id.toString();
    const updateData: Partial<ConversationRecord> = {
      lastMessage: params.text,
      lastMessageAt: now,
      unread: params.senderType === "customer",
      status: statusMap[params.senderType],
      updatedAt: now,
    };
    if (params.customerName && params.customerName !== conv.customerName) {
      updateData.customerName = params.customerName;
    }
    if (params.customerAvatar) {
      updateData.customerAvatar = params.customerAvatar;
    }
    if (params.userId && (!conv.userId || conv.userId === "default")) {
      updateData.userId = params.userId;
    }
    await convCol.updateOne({ _id: conv._id }, { $set: updateData });
  }

  // Insert individual message
  const newMsg: MessageRecord = {
    conversationId,
    userId: params.userId || conv?.userId || "default",
    senderPsid: params.senderPsid,
    senderType: params.senderType,
    name:
      params.senderType === "customer"
        ? params.customerName || "Customer"
        : params.senderType === "ai"
          ? "AI Assistant"
          : "Human Agent",
    text: params.text,
    timestamp: now,
    modelUsed: params.modelUsed,
  };

  const msgRes = await msgCol.insertOne(newMsg as any);

  return {
    conversationId,
    messageId: msgRes.insertedId.toString(),
  };
}

/**
 * Get all conversations for dashboard
 */
export async function getConversations(options: {
  userId?: string;
  pageId?: string;
  status?: string;
  search?: string;
}): Promise<ConversationRecord[]> {
  const db = getDb();
  const convCol = db.collection<ConversationRecord>(CONV_COLLECTION);

  const query: any = {};
  if (options.userId && options.userId !== "all") {
    query.userId = options.userId;
  }
  if (options.pageId) {
    query.pageId = options.pageId;
  }
  if (options.status && options.status !== "all") {
    query.status = options.status;
  }
  if (options.search) {
    query.$or = [
      { customerName: { $regex: options.search, $options: "i" } },
      { lastMessage: { $regex: options.search, $options: "i" } },
    ];
  }

  const convs = await convCol.find(query).sort({ lastMessageAt: -1 }).toArray();
  return convs.map((c) => ({
    ...c,
    _id: c._id.toString(),
  }));
}

/**
 * Get messages for a specific conversation
 */
export async function getConversationMessages(
  conversationId: string,
): Promise<MessageRecord[]> {
  const db = getDb();
  const msgCol = db.collection<MessageRecord>(MSG_COLLECTION);

  const msgs = await msgCol
    .find({ conversationId })
    .sort({ timestamp: 1 })
    .toArray();

  return msgs.map((m) => ({
    ...m,
    _id: m._id.toString(),
  }));
}

/**
 * Get conversation history for Gemini multi-turn prompt
 */
export async function getRecentConversationHistory(
  conversationId: string,
  limit = 8,
): Promise<Array<{ senderType: "customer" | "ai" | "human"; text: string }>> {
  const db = getDb();
  const msgCol = db.collection<MessageRecord>(MSG_COLLECTION);

  const msgs = await msgCol
    .find({ conversationId })
    .sort({ timestamp: -1 })
    .limit(limit)
    .toArray();

  return msgs.reverse().map((m) => ({
    senderType: m.senderType,
    text: m.text,
  }));
}

