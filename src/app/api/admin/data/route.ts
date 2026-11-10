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

    if (type === "users") {
      const users = await db.collection("user").find({}).sort({ createdAt: -1 }).toArray();
      const [pages, docs, convs] = await Promise.all([
        db.collection("facebook_pages").find({}).toArray(),
        db.collection("business_knowledge").find({}).toArray(),
        db.collection("fb_conversations").find({}).toArray(),
      ]);

      const enhancedUsers = users.map((u) => {
        const uId = u._id.toString();
        const userPages = pages.filter((p) => p.userId === uId);
        const userDocs = docs.filter((d) => d.userId === uId);
        const userConvs = convs.filter((c) => c.userId === uId);

        return {
          id: uId,
          name: u.name,
          email: u.email,
          createdAt: u.createdAt,
          pagesCount: userPages.length,
          docsCount: userDocs.length,
          conversationsCount: userConvs.length,
        };
      });

      return NextResponse.json({ users: enhancedUsers });
    }

    if (type === "pages") {
      const pages = await db.collection("facebook_pages").find({}).sort({ updatedAt: -1 }).toArray();
      const users = await db.collection("user").find({}).toArray();
      const userMap = new Map(users.map((u) => [u._id.toString(), u]));

      const enhancedPages = pages.map((p) => {
        const owner = p.userId ? userMap.get(p.userId) : null;
        return {
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
          owner: owner ? { name: owner.name, email: owner.email } : { name: "Admin / System", email: "default" },
        };
      });

      return NextResponse.json({ pages: enhancedPages });
    }

    if (type === "documents") {
      const docs = await db.collection("business_knowledge").find({}).sort({ uploadedAt: -1 }).toArray();
      const users = await db.collection("user").find({}).toArray();
      const userMap = new Map(users.map((u) => [u._id.toString(), u]));

      const enhancedDocs = docs.map((d) => {
        const owner = d.userId ? userMap.get(d.userId) : null;
        return {
          id: d._id.toString(),
          title: d.title,
          fileName: d.fileName,
          fileType: d.fileType,
          size: d.size,
          charCount: d.content ? d.content.length : 0,
          summary: d.summary || "",
          keyTopics: d.keyTopics || [],
          uploadedAt: d.uploadedAt,
          owner: owner ? { name: owner.name, email: owner.email } : { name: "System", email: "default" },
        };
      });

      return NextResponse.json({ documents: enhancedDocs });
    }

    if (type === "conversations") {
      const convs = await db.collection("fb_conversations").find({}).sort({ lastMessageAt: -1 }).limit(50).toArray();
      const convIds = convs.map((c) => c._id.toString());
      const messages = await db
        .collection("fb_messages")
        .find({ conversationId: { $in: convIds } })
        .sort({ timestamp: 1 })
        .toArray();

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

