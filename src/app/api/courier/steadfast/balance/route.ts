// src/app/api/courier/steadfast/balance/route.ts
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { getSteadfastConfig, getSteadfastBalance } from "@/lib/steadfast";

export async function GET() {
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

    const config = await getSteadfastConfig(userId);
    if (!config || !config.apiKey || !config.secretKey) {
      return NextResponse.json(
        { error: "Steadfast API কনফিগার করা হয়নি। দয়া করে আপনার API Key প্রদান করুন।" },
        { status: 400 }
      );
    }

    const balanceData = await getSteadfastBalance({
      apiKey: config.apiKey,
      secretKey: config.secretKey,
      baseUrl: config.baseUrl,
    });

    return NextResponse.json({
      success: true,
      current_balance: balanceData.current_balance,
      raw: balanceData.raw,
    });
  } catch (error: any) {
    console.error("Error fetching Steadfast balance:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch balance from Steadfast" },
      { status: 500 }
    );
  }
}

