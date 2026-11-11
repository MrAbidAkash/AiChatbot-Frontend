// src/app/api/integrations/google/stock/route.ts
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { decrementGoogleSheetStock } from "@/lib/google-sheets-stock";
import { getValidGoogleToken } from "@/lib/google-drive";

export async function POST(request: NextRequest) {
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

    const body = await request.json();
    const { spreadsheetId, productName, quantity = 1 } = body;

    if (!spreadsheetId || !productName) {
      return NextResponse.json(
        { error: "Both 'spreadsheetId' and 'productName' are required." },
        { status: 400 },
      );
    }

    const result = await decrementGoogleSheetStock(
      userId,
      spreadsheetId,
      productName,
      Number(quantity),
    );

    return NextResponse.json(result);
  } catch (error: any) {
    console.error("Manual Google Sheet stock update error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to update Google Sheet stock" },
      { status: 500 },
    );
  }
}

export async function GET(request: NextRequest) {
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

    const searchParams = request.nextUrl.searchParams;
    const spreadsheetId = searchParams.get("spreadsheetId");

    if (!spreadsheetId) {
      return NextResponse.json({ error: "spreadsheetId is required" }, { status: 400 });
    }

    const token = await getValidGoogleToken(userId);
    if (!token) {
      return NextResponse.json(
        { error: "Google account is not connected" },
        { status: 401 },
      );
    }

    const valuesUrl = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/A1:Z50`;
    const res = await fetch(valuesUrl, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!res.ok) {
      return NextResponse.json(
        { error: `Google Sheets API error: ${await res.text()}` },
        { status: res.status },
      );
    }

    const data = await res.json();
    return NextResponse.json({ success: true, values: data.values || [] });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
