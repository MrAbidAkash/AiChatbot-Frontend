// src/app/api/courier/steadfast/orders/[id]/track/route.ts
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import {
  getSteadfastConfig,
  getSteadfastStatus,
  updateParcelStatus,
} from "@/lib/steadfast";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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
        { error: "Steadfast API কনফিগার করা হয়নি।" },
        { status: 400 }
      );
    }

    const { id } = await params;
    const searchParams = request.nextUrl.searchParams;
    const cid = searchParams.get("cid") || id;
    const trackingCode = searchParams.get("tracking_code");

    const statusResult = await getSteadfastStatus(
      {
        apiKey: config.apiKey,
        secretKey: config.secretKey,
        baseUrl: config.baseUrl,
      },
      trackingCode ? { tracking_code: trackingCode } : { consignment_id: cid }
    );

    // Update the parcel in MongoDB
    await updateParcelStatus(userId, cid, statusResult.status, statusResult.raw);

    return NextResponse.json({
      success: true,
      status: statusResult.status,
      raw: statusResult.raw,
    });
  } catch (error: any) {
    console.error("Error tracking Steadfast parcel:", error);
    return NextResponse.json(
      { error: error.message || "Failed to track parcel" },
      { status: 500 }
    );
  }
}

