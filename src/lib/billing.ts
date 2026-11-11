// src/lib/billing.ts
import { getDb } from "./db";

export interface UserWalletInfo {
  totalAllocatedCredits: number;
  remainingReplies: number;
  remainingBalance: number;
  usedCredits: number;
  costPerReply: number;
  totalRechargedAmount: number;
  isPaidUser: boolean;
  planTitle: string;
  hasCredits: boolean;
  isActive: boolean;
}

export const COST_PER_REPLY = 0.50; // 50 poisa (৳0.50)
export const FREE_TRIAL_REPLIES = 50; // 50 free replies (worth ৳25.00)

/**
 * Retrieve user's current wallet, allocated AI replies, used credits, and remaining balance.
 */
export async function getUserWallet(options: {
  userId?: string;
  pageId?: string;
  userEmail?: string;
}): Promise<UserWalletInfo> {
  const db = getDb();
  const { userId, pageId, userEmail } = options;

  // 1. Gather all page IDs belonging to this user
  let pageIds: string[] = [];
  if (userId && userId !== "all" && userId !== "default") {
    const pages = await db
      .collection("facebook_pages")
      .find({ userId }, { projection: { pageId: 1 } })
      .toArray();
    pageIds = pages.map((p) => p.pageId);
  }
  if (pageId && !pageIds.includes(pageId)) {
    pageIds.push(pageId);
  }

  // 2. Build conversation filter to accurately match conversations belonging to this user or their pages
  let convFilter: any = {};
  if (userId && userId !== "all" && userId !== "default") {
    convFilter = pageIds.length > 0
      ? { $or: [{ userId }, { pageId: { $in: pageIds } }] }
      : { userId };
  } else if (pageIds.length > 0) {
    convFilter = { pageId: { $in: pageIds } };
  }

  const userConversations = await db
    .collection("fb_conversations")
    .find(convFilter, { projection: { _id: 1 } })
    .toArray();

  const userConvIds = userConversations.map((c) => c._id.toString());

  // 3. Count used AI replies
  let usedCredits = 0;
  if (userConvIds.length > 0) {
    usedCredits = await db.collection("fb_messages").countDocuments({
      senderType: "ai",
      conversationId: { $in: userConvIds },
    });
  }

  // 4. Gather completed payments
  const paymentFilter: any = {
    transactionStatus: "Completed",
  };
  const paymentOr: any[] = [];
  if (userEmail) {
    paymentOr.push({ "customerInfo.email": userEmail });
  }
  if (userId && userId !== "default" && userId !== "all") {
    paymentOr.push({ userId }, { user: userId });
  }
  if (paymentOr.length > 0) {
    paymentFilter.$or = paymentOr;
  }

  const completedPayments = await db.collection("payments").find(paymentFilter).toArray();

  const totalRechargedAmount = completedPayments.reduce(
    (sum, p) => sum + (Number(p.amount) || 0),
    0
  );

  // 5. Calculate recharged replies with tier bonuses
  const rechargedReplies = completedPayments.reduce((total, p) => {
    if (p.grantedReplies !== undefined) {
      return total + Number(p.grantedReplies);
    }
    const amt = Number(p.amount) || 0;
    const baseReplies = Math.round(amt / COST_PER_REPLY);
    const bonusMultiplier = amt >= 5000 ? 1.2 : amt >= 1000 ? 1.1 : 1.0;
    return total + Math.round(baseReplies * bonusMultiplier);
  }, 0);

  // 5b. Gather admin gifted complimentary credits
  const adminCreditFilter: any = {};
  const creditOr: any[] = [];
  if (userEmail) creditOr.push({ userEmail });
  if (userId && userId !== "default" && userId !== "all") {
    creditOr.push({ userId }, { user: userId });
  }
  if (creditOr.length > 0) adminCreditFilter.$or = creditOr;

  const adminCreditDocs = creditOr.length > 0
    ? await db.collection("admin_credits").find(adminCreditFilter).toArray()
    : [];

  const totalAdminGiftedCredits = adminCreditDocs.reduce(
    (sum, c) => sum + (Number(c.credits) || 0),
    0
  );

  // 6. Calculate total allocation and remaining
  const totalAllocatedCredits = FREE_TRIAL_REPLIES + rechargedReplies + totalAdminGiftedCredits;
  const remainingReplies = Math.max(0, totalAllocatedCredits - usedCredits);
  const remainingBalance = Number((remainingReplies * COST_PER_REPLY).toFixed(2));
  const isPaidUser = totalRechargedAmount > 0;
  const hasCredits = remainingReplies > 0;

  return {
    totalAllocatedCredits,
    remainingReplies,
    remainingBalance,
    usedCredits,
    costPerReply: COST_PER_REPLY,
    totalRechargedAmount,
    isPaidUser,
    planTitle: isPaidUser
      ? "রিচার্জড পেইড প্যাক"
      : totalAdminGiftedCredits > 0
      ? "স্পেশাল গিফট ক্রেডিট"
      : "ফ্রি ট্রায়াল ব্যালেন্স",
    hasCredits,
    isActive: hasCredits,
  };
}

