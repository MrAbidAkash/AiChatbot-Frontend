// src/app/api/courier/steadfast/config/route.ts
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import {
  getSteadfastConfig,
  saveSteadfastConfig,
  getSteadfastBalance,
  STEADFAST_PRIMARY_BASE_URL,
} from "@/lib/steadfast";

async function getAuthUserId(): Promise<string> {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });
    if (session?.user?.id) {
      return session.user.id;
    }
  } catch {
    // fallback
  }
  return "default";
}

export async function GET() {
  try {
    const userId = await getAuthUserId();
    const config = await getSteadfastConfig(userId);

    if (!config || !config.apiKey || !config.secretKey) {
      return NextResponse.json({
        isConfigured: false,
        apiKeyMasked: "",
        baseUrl: STEADFAST_PRIMARY_BASE_URL,
      });
    }

    const maskedKey =
      config.apiKey.length > 8
        ? `${config.apiKey.slice(0, 4)}••••••••${config.apiKey.slice(-4)}`
        : "••••••••";

    return NextResponse.json({
      isConfigured: true,
      apiKeyMasked: maskedKey,
      baseUrl: config.baseUrl || STEADFAST_PRIMARY_BASE_URL,
      updatedAt: config.updatedAt,
    });
  } catch (error: any) {
    console.error("Error fetching Steadfast config:", error);
    return NextResponse.json({ error: error.message || "Failed to get config" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const userId = await getAuthUserId();
    const body = await request.json();
    const { apiKey, secretKey, baseUrl, testConnection } = body;

    if (!apiKey || !apiKey.trim() || !secretKey || !secretKey.trim()) {
      return NextResponse.json(
        { error: "Api-Key এবং Secret-Key উভয়ই আবশ্যক।" },
        { status: 400 }
      );
    }

    const cleanApiKey = apiKey.trim();
    const cleanSecretKey = secretKey.trim();
    const cleanBaseUrl = baseUrl?.trim() || STEADFAST_PRIMARY_BASE_URL;

    // Optional test connection
    let balanceInfo = null;
    if (testConnection !== false) {
      try {
        balanceInfo = await getSteadfastBalance({
          apiKey: cleanApiKey,
          secretKey: cleanSecretKey,
          baseUrl: cleanBaseUrl,
        });
      } catch (testErr: any) {
        return NextResponse.json(
          {
            error: `Steadfast ক্রেডেনশিয়াল সঠিক নয় অথবা কানেকশন ব্যর্থ হয়েছে: ${testErr.message}`,
          },
          { status: 400 }
        );
      }
    }

    await saveSteadfastConfig(userId, {
      apiKey: cleanApiKey,
      secretKey: cleanSecretKey,
      baseUrl: cleanBaseUrl,
    });

    return NextResponse.json({
      success: true,
      message: "Steadfast API ক্রেডেনশিয়াল সফলভাবে সংরক্ষণ ও কানেক্ট করা হয়েছে!",
      balance: balanceInfo ? balanceInfo.current_balance : undefined,
    });
  } catch (error: any) {
    console.error("Error saving Steadfast config:", error);
    return NextResponse.json({ error: error.message || "Failed to save config" }, { status: 500 });
  }
}

