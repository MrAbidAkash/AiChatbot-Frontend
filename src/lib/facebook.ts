// src/lib/facebook.ts
import { getDb } from "./db";
import { ObjectId } from "mongodb";

export interface FacebookPageRecord {
  _id?: ObjectId | string;
  userId?: string;
  pageId: string;
  pageName: string;
  pageAccessToken: string;
  isActive: boolean;
  botTone?: "friendly" | "professional" | "casual";
  fallbackMessage?: string;
  customInstructions?: string;
  createdAt: Date;
  updatedAt: Date;
}

const COLLECTION_NAME = "facebook_pages";

/**
 * Get Facebook page configuration by Page ID
 */
export async function getFacebookPageByPageId(
  pageId: string,
): Promise<FacebookPageRecord | null> {
  const db = getDb();
  const collection = db.collection<FacebookPageRecord>(COLLECTION_NAME);
  const page = await collection.findOne({ pageId });
  if (!page) {
    // If not in DB, check if default page token in process.env matches
    if (process.env.FACEBOOK_PAGE_ACCESS_TOKEN) {
      return {
        pageId,
        pageName: "Default Facebook Page",
        pageAccessToken: process.env.FACEBOOK_PAGE_ACCESS_TOKEN,
        isActive: true,
        botTone: "friendly",
        createdAt: new Date(),
        updatedAt: new Date(),
      };
    }
    return null;
  }
  return {
    ...page,
    _id: page._id.toString(),
  };
}

/**
 * Get all Facebook pages connected by a user
 */
export async function getFacebookPages(userId?: string): Promise<FacebookPageRecord[]> {
  const db = getDb();
  const collection = db.collection<FacebookPageRecord>(COLLECTION_NAME);
  const query: any = {};
  if (userId && userId !== "all") {
    query.$or = [{ userId }, { userId: "default" }, { userId: { $exists: false } }];
  }
  const pages = await collection.find(query).sort({ updatedAt: -1 }).toArray();
  return pages.map((p) => ({
    ...p,
    _id: p._id.toString(),
  }));
}

/**
 * Save or update a connected Facebook Page
 */
export async function upsertFacebookPage(data: {
  userId?: string;
  pageId: string;
  pageName: string;
  pageAccessToken: string;
  isActive?: boolean;
  botTone?: "friendly" | "professional" | "casual";
  fallbackMessage?: string;
  customInstructions?: string;
}): Promise<FacebookPageRecord> {
  const db = getDb();
  const collection = db.collection<FacebookPageRecord>(COLLECTION_NAME);

  const existing = await collection.findOne({ pageId: data.pageId });

  const record: Partial<FacebookPageRecord> = {
    userId: data.userId || "default",
    pageId: data.pageId,
    pageName: data.pageName,
    pageAccessToken: data.pageAccessToken,
    isActive: data.isActive !== undefined ? data.isActive : true,
    botTone: data.botTone || "friendly",
    fallbackMessage:
      data.fallbackMessage ||
      "I don't have that specific information right now. Our support team will get back to you shortly!",
    customInstructions: data.customInstructions || "",
    updatedAt: new Date(),
  };

  if (existing) {
    await collection.updateOne({ pageId: data.pageId }, { $set: record });
    return { ...existing, ...record, _id: existing._id.toString() } as FacebookPageRecord;
  } else {
    record.createdAt = new Date();
    const res = await collection.insertOne(record as any);
    return { ...record, _id: res.insertedId.toString() } as FacebookPageRecord;
  }
}

/**
 * Delete a connected Facebook page
 */
export async function deleteFacebookPage(pageId: string): Promise<boolean> {
  const db = getDb();
  const collection = db.collection<FacebookPageRecord>(COLLECTION_NAME);
  const res = await collection.deleteOne({ pageId });
  return res.deletedCount > 0;
}

/**
 * Send a message via Facebook Graph API Send API
 */
export async function sendFacebookMessage(
  pageAccessToken: string,
  recipientPsid: string,
  text: string,
): Promise<{ success: boolean; data?: any; error?: any }> {
  try {
    const url = `https://graph.facebook.com/v21.0/me/messages?access_token=${encodeURIComponent(pageAccessToken)}`;

    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        recipient: { id: recipientPsid },
        messaging_type: "RESPONSE",
        message: { text },
      }),
    });

    const data = await response.json();
    if (!response.ok) {
      console.error("Facebook Send API Error:", data);
      return { success: false, error: data };
    }

    return { success: true, data };
  } catch (err: any) {
    console.error("Failed to send message to Facebook:", err);
    return { success: false, error: err.message };
  }
}

/**
 * Send typing indicator to customer on Facebook Messenger
 */
export async function sendTypingIndicator(
  pageAccessToken: string,
  recipientPsid: string,
  typing: boolean,
): Promise<void> {
  try {
    const url = `https://graph.facebook.com/v21.0/me/messages?access_token=${encodeURIComponent(pageAccessToken)}`;
    await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        recipient: { id: recipientPsid },
        sender_action: typing ? "typing_on" : "typing_off",
      }),
    });
  } catch (err) {
    // Non-critical, ignore typing errors
  }
}

/**
 * Get customer profile from Facebook (First name, last name, avatar)
 */
export async function getFacebookUserProfile(
  pageAccessToken: string,
  psid: string,
): Promise<{ name: string; profilePic?: string }> {
  try {
    const url = `https://graph.facebook.com/v21.0/${psid}?fields=first_name,last_name,profile_pic&access_token=${encodeURIComponent(pageAccessToken)}`;
    const res = await fetch(url);
    if (res.ok) {
      const data = await res.json();
      const name = `${data.first_name || ""} ${data.last_name || ""}`.trim();
      return {
        name: name || `Customer ${psid.slice(-4)}`,
        profilePic: data.profile_pic,
      };
    }
  } catch (err) {
    console.warn("Could not fetch customer Facebook profile:", err);
  }
  return { name: `Customer ${psid.slice(-4)}` };
}

