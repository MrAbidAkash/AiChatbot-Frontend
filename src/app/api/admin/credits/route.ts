// src/app/api/admin/credits/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getAdminSessionFromRequest } from "@/lib/admin-auth";
import { getDb } from "@/lib/db";
import { ObjectId } from "mongodb";
import { getUserWallet } from "@/lib/billing";

export async function GET(request: NextRequest) {
  try {
    const session = getAdminSessionFromRequest(request);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const db = getDb();

    // 1. Fetch all merchants
    const users = await db.collection("user").find({}).sort({ createdAt: -1 }).toArray();

    // 2. Fetch all pages to see connected store count
    const pages = await db.collection("facebook_pages").find({}).toArray();

    // 3. Fetch wallets for each merchant
    const merchantsWallets = await Promise.all(
      users.map(async (u) => {
        const uId = u._id.toString();
        const altId = u.id;
        const userPages = pages.filter((p) => p.userId === uId || (altId && p.userId === altId));

        const wallet = await getUserWallet({
          userId: uId,
          userEmail: u.email,
        });

        return {
          id: uId,
          altId: altId || null,
          name: u.name || "Merchant",
          email: u.email,
          image: u.image || null,
          createdAt: u.createdAt,
          pagesCount: userPages.length,
          wallet,
        };
      })
    );

    // 4. Fetch admin credit grant history
    const creditHistory = await db
      .collection("admin_credits")
      .find({})
      .sort({ createdAt: -1 })
      .limit(100)
      .toArray();

    const formattedHistory = creditHistory.map((c) => ({
      id: c._id.toString(),
      userId: c.userId,
      userEmail: c.userEmail,
      userName: c.userName || "Merchant",
      credits: c.credits,
      amount: c.amount,
      note: c.note,
      adminEmail: c.adminEmail,
      createdAt: c.createdAt,
    }));

    const totalGiftedCredits = creditHistory.reduce((sum, c) => sum + (Number(c.credits) || 0), 0);
    const totalGiftedAmount = creditHistory.reduce((sum, c) => sum + (Number(c.amount) || 0), 0);

    return NextResponse.json({
      merchants: merchantsWallets,
      history: formattedHistory,
      stats: {
        totalGiftedCredits,
        totalGiftedAmount,
        totalGrantsCount: creditHistory.length,
      },
    });
  } catch (error: any) {
    console.error("Error fetching admin credit data:", error);
    return NextResponse.json({ error: error.message || "Failed to load credits" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = getAdminSessionFromRequest(request);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { userId, credits, note } = body;

    const creditAmount = parseInt(credits, 10);
    if (!userId || isNaN(creditAmount) || creditAmount <= 0) {
      return NextResponse.json(
        { error: "Valid userId and positive credit amount (> 0) are required." },
        { status: 400 }
      );
    }

    const db = getDb();

    // Find the merchant user
    let userDoc: any = null;
    try {
      userDoc = await db.collection("user").findOne({ _id: new ObjectId(userId) });
    } catch {
      // not objectid
    }
    if (!userDoc) {
      userDoc = await db.collection("user").findOne({ id: userId });
    }
    if (!userDoc) {
      userDoc = await db.collection("user").findOne({ email: userId });
    }

    if (!userDoc) {
      return NextResponse.json({ error: "Merchant user not found." }, { status: 404 });
    }

    const uId = userDoc._id.toString();
    const costValue = Number((creditAmount * 0.5).toFixed(2));

    // Create grant record
    const grantDoc = {
      userId: uId,
      userEmail: userDoc.email,
      userName: userDoc.name || "Merchant",
      credits: creditAmount,
      amount: costValue,
      note: note && note.trim() ? note.trim() : "Admin Gifted Free Credits",
      adminEmail: session.email,
      createdAt: new Date(),
    };

    const insertResult = await db.collection("admin_credits").insertOne(grantDoc);

    // Compute updated wallet
    const updatedWallet = await getUserWallet({
      userId: uId,
      userEmail: userDoc.email,
    });

    return NextResponse.json({
      success: true,
      message: `সফলভাবে ${creditAmount} টি ফ্রি ক্রেডিট যোগ করা হয়েছে (${userDoc.name || userDoc.email})।`,
      grantId: insertResult.insertedId.toString(),
      wallet: updatedWallet,
    });
  } catch (error: any) {
    console.error("Error granting admin credits:", error);
    return NextResponse.json({ error: error.message || "Failed to grant credits" }, { status: 500 });
  }
}
