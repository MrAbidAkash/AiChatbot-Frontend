import { NextRequest, NextResponse } from "next/server";
import { getAdminSessionFromRequest } from "@/lib/admin-auth";
import { getDb } from "@/lib/db";
import { ObjectId } from "mongodb";
import { generateCustomerReply } from "@/lib/gemini";
import { getRelevantKnowledge } from "@/lib/knowledge";

export async function GET(request: NextRequest) {
  try {
    const session = getAdminSessionFromRequest(request);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized. Admin session required." }, { status: 401 });
    }

    const db = getDb();
    const type = request.nextUrl.searchParams.get("type") || "users";
    const filterUserId = request.nextUrl.searchParams.get("userId") || undefined;

    // 1. SPECIFIC USER 360-DEGREE DETAILS
    if (type === "user-detail" && filterUserId) {
      let userDoc: any = null;

      if (filterUserId === "default" || filterUserId === "system") {
        userDoc = {
          _id: "default",
          id: "default",
          name: "System / Default Store",
          email: "system@default.local",
          createdAt: new Date(),
        };
      } else {
        try {
          userDoc = await db.collection("user").findOne({ _id: new ObjectId(filterUserId) });
        } catch {
          // fallback
        }
        if (!userDoc) {
          userDoc = await db.collection("user").findOne({ id: filterUserId });
        }
        if (!userDoc) {
          userDoc = await db.collection("user").findOne({ _id: filterUserId as any });
        }
      }

      if (!userDoc) {
        return NextResponse.json({ error: "User not found" }, { status: 404 });
      }

      const uId = userDoc._id ? userDoc._id.toString() : filterUserId;
      const possibleUserIds = Array.from(new Set([uId, userDoc.id, filterUserId].filter(Boolean)));
      const isDefault = filterUserId === "default" || filterUserId === "system";

      const queryFilter = isDefault
        ? { $or: [{ userId: "default" }, { userId: { $exists: false } }, { userId: null }] }
        : { userId: { $in: possibleUserIds } };

      // Fetch user's pages, docs, convs, and payments in parallel
      const [pages, docs, convs, payments] = await Promise.all([
        db.collection("facebook_pages").find(queryFilter).sort({ updatedAt: -1 }).toArray(),
        db.collection("business_knowledge").find(queryFilter).sort({ uploadedAt: -1 }).toArray(),
        db.collection("fb_conversations").find(queryFilter).sort({ lastMessageAt: -1 }).toArray(),
        db.collection("payments").find({
          $or: [
            { user: { $in: possibleUserIds } },
            { userId: { $in: possibleUserIds } },
            ...(userDoc.email ? [{ "customerInfo.email": userDoc.email }] : []),
          ],
        }).sort({ createdAt: -1 }).toArray(),
      ]);

      const convIds = convs.map((c) => c._id.toString());
      const messages = convIds.length > 0
        ? await db.collection("fb_messages").find({ conversationId: { $in: convIds } }).sort({ timestamp: 1 }).toArray()
        : [];

      const messagesByConv = new Map<string, any[]>();
      let totalAiReplies = 0;
      let totalCustomerMessages = 0;

      for (const m of messages) {
        if (m.senderType === "ai") totalAiReplies++;
        if (m.senderType === "customer") totalCustomerMessages++;

        const arr = messagesByConv.get(m.conversationId) || [];
        arr.push({
          id: m._id.toString(),
          senderType: m.senderType,
          name: m.name,
          text: m.text,
          timestamp: m.timestamp,
          modelUsed: m.modelUsed,
        });
        messagesByConv.set(m.conversationId, arr);
      }

      const totalSpent = payments
        .filter((p) => p.transactionStatus === "Completed")
        .reduce((sum, p) => sum + (Number(p.amount) || 0), 0);

      return NextResponse.json({
        user: {
          id: uId,
          name: userDoc.name || "Merchant",
          email: userDoc.email,
          image: userDoc.image || null,
          createdAt: userDoc.createdAt,
        },
        stats: {
          pagesCount: pages.length,
          activePagesCount: pages.filter((p) => p.isActive).length,
          docsCount: docs.length,
          totalDocsChars: docs.reduce((acc, d) => acc + (d.content ? d.content.length : 0), 0),
          convsCount: convs.length,
          totalAiReplies,
          totalCustomerMessages,
          totalSpent,
        },
        pages: pages.map((p) => ({
          id: p._id.toString(),
          pageId: p.pageId,
          pageName: p.pageName,
          isActive: Boolean(p.isActive),
          botTone: p.botTone || "friendly",
          customInstructions: p.customInstructions || "",
          fallbackMessage: p.fallbackMessage || "",
          hasToken: Boolean(p.pageAccessToken),
          updatedAt: p.updatedAt,
        })),
        documents: docs.map((d) => ({
          id: d._id.toString(),
          title: d.title,
          fileName: d.fileName,
          fileType: d.fileType,
          size: d.size,
          charCount: d.content ? d.content.length : 0,
          summary: d.summary || "",
          keyTopics: d.keyTopics || [],
          uploadedAt: d.uploadedAt,
        })),
        conversations: convs.map((c) => ({
          id: c._id.toString(),
          pageId: c.pageId,
          pageName: c.pageName,
          customerName: c.customerName,
          lastMessage: c.lastMessage,
          lastMessageAt: c.lastMessageAt,
          status: c.status,
          messagesCount: (messagesByConv.get(c._id.toString()) || []).length,
          messages: messagesByConv.get(c._id.toString()) || [],
        })),
        payments: payments.map((p) => ({
          id: p._id.toString(),
          paymentID: p.paymentID || p.trxID || p._id.toString(),
          trxID: p.trxID || "N/A",
          amount: p.amount,
          currency: p.currency || "BDT",
          transactionStatus: p.transactionStatus,
          customerPhone: p.customerMsisdn || p.customerInfo?.phone || "N/A",
          createdAt: p.createdAt || p.paymentCreateTime,
        })),
      });
    }

    if (type === "users") {
      const users = await db.collection("user").find({}).sort({ createdAt: -1 }).toArray();
      const [pages, docs, convs] = await Promise.all([
        db.collection("facebook_pages").find({}).toArray(),
        db.collection("business_knowledge").find({}).toArray(),
        db.collection("fb_conversations").find({}).toArray(),
      ]);

      const enhancedUsers = users.map((u) => {
        const uId = u._id.toString();
        const altId = u.id;
        const userPages = pages.filter((p) => p.userId === uId || (altId && p.userId === altId));
        const userDocs = docs.filter((d) => d.userId === uId || (altId && d.userId === altId));
        const userConvs = convs.filter((c) => c.userId === uId || (altId && c.userId === altId));

        return {
          id: uId,
          altId: altId || null,
          name: u.name,
          email: u.email,
          image: u.image || null,
          createdAt: u.createdAt,
          pagesCount: userPages.length,
          activePagesCount: userPages.filter((p) => p.isActive).length,
          docsCount: userDocs.length,
          conversationsCount: userConvs.length,
        };
      });

      return NextResponse.json({ users: enhancedUsers });
    }

    // Helper map of all users for owner resolution
    const users = await db.collection("user").find({}).toArray();
    const userMap = new Map();
    users.forEach((u) => {
      userMap.set(u._id.toString(), u);
      if (u.id) userMap.set(u.id, u);
    });

    const resolveOwner = (userId?: string) => {
      if (!userId) return { id: "default", name: "System / Default", email: "system" };
      const u = userMap.get(userId);
      if (u) {
        return {
          id: u._id.toString(),
          name: u.name || "Merchant",
          email: u.email,
        };
      }
      return { id: userId, name: "Merchant", email: userId };
    };

    if (type === "pages") {
      const pageFilter: any = {};
      if (filterUserId && filterUserId !== "all") {
        if (filterUserId === "default" || filterUserId === "system") {
          pageFilter.$or = [{ userId: "default" }, { userId: { $exists: false } }, { userId: null }];
        } else {
          const matchedUser = userMap.get(filterUserId);
          const userIds = matchedUser
            ? [matchedUser._id.toString(), matchedUser.id, filterUserId].filter(Boolean)
            : [filterUserId];
          pageFilter.userId = { $in: userIds };
        }
      }

      const pages = await db.collection("facebook_pages").find(pageFilter).sort({ updatedAt: -1 }).toArray();

      const enhancedPages = pages.map((p) => ({
        id: p._id.toString(),
        pageId: p.pageId,
        pageName: p.pageName,
        isActive: Boolean(p.isActive),
        botTone: p.botTone || "friendly",
        customInstructions: p.customInstructions || "",
        fallbackMessage: p.fallbackMessage || "",
        hasToken: Boolean(p.pageAccessToken),
        updatedAt: p.updatedAt,
        createdAt: p.createdAt,
        userId: p.userId,
        owner: resolveOwner(p.userId),
      }));

      return NextResponse.json({ pages: enhancedPages });
    }

    if (type === "documents") {
      const docFilter: any = {};
      if (filterUserId && filterUserId !== "all") {
        if (filterUserId === "default" || filterUserId === "system") {
          docFilter.$or = [{ userId: "default" }, { userId: { $exists: false } }, { userId: null }];
        } else {
          const matchedUser = userMap.get(filterUserId);
          const userIds = matchedUser
            ? [matchedUser._id.toString(), matchedUser.id, filterUserId].filter(Boolean)
            : [filterUserId];
          docFilter.userId = { $in: userIds };
        }
      }

      const docs = await db.collection("business_knowledge").find(docFilter).sort({ uploadedAt: -1 }).toArray();

      const enhancedDocs = docs.map((d) => ({
        id: d._id.toString(),
        title: d.title,
        fileName: d.fileName,
        fileType: d.fileType,
        size: d.size,
        charCount: d.content ? d.content.length : 0,
        summary: d.summary || "",
        keyTopics: d.keyTopics || [],
        uploadedAt: d.uploadedAt,
        userId: d.userId,
        owner: resolveOwner(d.userId),
      }));

      return NextResponse.json({ documents: enhancedDocs });
    }

    if (type === "conversations") {
      const convFilter: any = {};
      if (filterUserId && filterUserId !== "all") {
        if (filterUserId === "default" || filterUserId === "system") {
          convFilter.$or = [{ userId: "default" }, { userId: { $exists: false } }, { userId: null }];
        } else {
          const matchedUser = userMap.get(filterUserId);
          const userIds = matchedUser
            ? [matchedUser._id.toString(), matchedUser.id, filterUserId].filter(Boolean)
            : [filterUserId];
          convFilter.userId = { $in: userIds };
        }
      }

      const convs = await db.collection("fb_conversations").find(convFilter).sort({ lastMessageAt: -1 }).limit(100).toArray();
      const convIds = convs.map((c) => c._id.toString());
      const messages = convIds.length > 0
        ? await db
            .collection("fb_messages")
            .find({ conversationId: { $in: convIds } })
            .sort({ timestamp: 1 })
            .toArray()
        : [];

      const messagesByConv = new Map<string, any[]>();
      for (const m of messages) {
        const arr = messagesByConv.get(m.conversationId) || [];
        arr.push({
          id: m._id.toString(),
          senderType: m.senderType,
          name: m.name,
          text: m.text,
          timestamp: m.timestamp,
          modelUsed: m.modelUsed,
        });
        messagesByConv.set(m.conversationId, arr);
      }

      const enhancedConvs = convs.map((c) => ({
        id: c._id.toString(),
        pageId: c.pageId,
        pageName: c.pageName,
        customerName: c.customerName,
        lastMessage: c.lastMessage,
        lastMessageAt: c.lastMessageAt,
        status: c.status,
        userId: c.userId,
        owner: resolveOwner(c.userId),
        messagesCount: (messagesByConv.get(c._id.toString()) || []).length,
        messages: messagesByConv.get(c._id.toString()) || [],
      }));

      return NextResponse.json({ conversations: enhancedConvs });
    }

    if (type === "payments") {
      const payments = await db.collection("payments").find({}).sort({ createdAt: -1 }).toArray();
      return NextResponse.json({
        payments: payments.map((p) => ({
          id: p._id.toString(),
          paymentID: p.paymentID || p.trxID || p._id.toString(),
          trxID: p.trxID || "N/A",
          amount: p.amount,
          currency: p.currency || "BDT",
          transactionStatus: p.transactionStatus,
          customerPhone: p.customerMsisdn || p.customerInfo?.phone || "N/A",
          customerEmail: p.customerInfo?.email || "N/A",
          createdAt: p.createdAt || p.paymentCreateTime,
        })),
      });
    }

    return NextResponse.json({ error: "Invalid type requested" }, { status: 400 });
  } catch (error: any) {
    console.error("Admin data error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = getAdminSessionFromRequest(request);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { action, id, data } = body;
    const db = getDb();

    if (action === "toggle-page") {
      const page = await db.collection("facebook_pages").findOne({ _id: new ObjectId(id) });
      if (!page) return NextResponse.json({ error: "Page not found" }, { status: 404 });
      await db.collection("facebook_pages").updateOne(
        { _id: new ObjectId(id) },
        { $set: { isActive: !page.isActive, updatedAt: new Date() } },
      );
      return NextResponse.json({ success: true, isActive: !page.isActive });
    }

    if (action === "delete-page") {
      await db.collection("facebook_pages").deleteOne({ _id: new ObjectId(id) });
      return NextResponse.json({ success: true, message: "Page removed" });
    }

    if (action === "delete-doc") {
      await db.collection("business_knowledge").deleteOne({ _id: new ObjectId(id) });
      return NextResponse.json({ success: true, message: "Document removed" });
    }

    if (action === "test-ai") {
      const { message, pageId } = data || {};
      const query = message || "Hello! What are your business delivery terms?";
      const knowledge = await getRelevantKnowledge(query, pageId ? { pageId } : {});
      const aiRes = await generateCustomerReply({
        customerMessage: query,
        businessKnowledge: knowledge,
        businessName: "ChatTime Admin Testing Sandbox",
        botTone: "friendly",
        pageId,
        enableTools: true,
      });

      return NextResponse.json({
        success: true,
        reply: aiRes.reply,
        modelUsed: aiRes.modelUsed,
        knowledgeChars: knowledge.length,
      });
    }

    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  } catch (error: any) {
    console.error("Admin action error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
