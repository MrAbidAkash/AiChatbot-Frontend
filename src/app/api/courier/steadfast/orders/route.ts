// src/app/api/courier/steadfast/orders/route.ts
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import {
  getSteadfastConfig,
  createSteadfastOrder,
  saveParcelRecord,
  getUserParcels,
  SteadfastOrderPayload,
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

export async function GET(request: NextRequest) {
  try {
    const userId = await getAuthUserId();
    const searchParams = request.nextUrl.searchParams;

    const search = searchParams.get("search") || undefined;
    const status = searchParams.get("status") || undefined;
    const limit = searchParams.get("limit") ? parseInt(searchParams.get("limit")!, 10) : 50;
    const skip = searchParams.get("skip") ? parseInt(searchParams.get("skip")!, 10) : 0;

    const data = await getUserParcels(userId, { search, status, limit, skip });
    return NextResponse.json(data);
  } catch (error: any) {
    console.error("Error fetching parcels:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch parcels" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const userId = await getAuthUserId();
    const config = await getSteadfastConfig(userId);

    if (!config || !config.apiKey || !config.secretKey) {
      return NextResponse.json(
        {
          error:
            "Steadfast API সংযুক্ত করা হয়নি। অর্ডার পাঠানোর আগে দয়া করে 'API সেটিংস' এ গিয়ে আপনার API Key ও Secret Key সেভ করুন।",
        },
        { status: 400 }
      );
    }

    const body = await request.json();
    const {
      invoice,
      recipient_name,
      recipient_phone,
      recipient_address,
      cod_amount,
      note,
      item_description,
      total_lot,
      delivery_type,
      area,
      exact_area,
    } = body;

    // Validate fields
    if (!recipient_name || !recipient_name.trim()) {
      return NextResponse.json({ error: "কাস্টমারের নাম (recipient_name) আবশ্যক" }, { status: 400 });
    }
    if (!recipient_phone || !recipient_phone.trim()) {
      return NextResponse.json({ error: "কাস্টমারের ফোন নম্বর (recipient_phone) আবশ্যক" }, { status: 400 });
    }
    if (!recipient_address || !recipient_address.trim()) {
      return NextResponse.json({ error: "ডেলিভারি ঠিকানা (recipient_address) আবশ্যক" }, { status: 400 });
    }
    if (cod_amount === undefined || cod_amount === null || isNaN(Number(cod_amount))) {
      return NextResponse.json({ error: "সঠিক ক্যাশ অন ডেলিভারি (COD) এমাউন্ট প্রদান করুন" }, { status: 400 });
    }

    const generatedInvoice =
      invoice && invoice.trim()
        ? invoice.trim()
        : `INV-${Date.now().toString().slice(-6)}`;

    const orderPayload: SteadfastOrderPayload = {
      invoice: generatedInvoice,
      recipient_name: recipient_name.trim(),
      recipient_phone: recipient_phone.trim(),
      recipient_address: recipient_address.trim(),
      area: area ? String(area).trim() : undefined,
      exact_area: exact_area ? String(exact_area).trim() : undefined,
      cod_amount: Number(cod_amount),
      note: note ? String(note).trim() : undefined,
      item_description: item_description ? String(item_description).trim() : undefined,
      total_lot: total_lot ? Number(total_lot) : 1,
      delivery_type: delivery_type !== undefined ? Number(delivery_type) : 0,
    };

    // Call Steadfast API
    const steadfastResult = await createSteadfastOrder(
      {
        apiKey: config.apiKey,
        secretKey: config.secretKey,
        baseUrl: config.baseUrl,
      },
      orderPayload
    );

    // Save parcel in MongoDB
    const savedParcel = await saveParcelRecord({
      userId,
      invoice: generatedInvoice,
      recipient_name: orderPayload.recipient_name,
      recipient_phone: orderPayload.recipient_phone,
      recipient_address: orderPayload.recipient_address,
      area: orderPayload.area,
      exact_area: orderPayload.exact_area,
      cod_amount: orderPayload.cod_amount,
      note: orderPayload.note,
      item_description: orderPayload.item_description,
      total_lot: orderPayload.total_lot,
      delivery_type: orderPayload.delivery_type,
      consignment_id: steadfastResult.consignment_id,
      tracking_code: steadfastResult.tracking_code,
      status: steadfastResult.status || "in_review",
      rawResponse: steadfastResult.raw,
    });

    return NextResponse.json({
      success: true,
      message: "পার্সেল সফলভাবে Steadfast এ তৈরি হয়েছে!",
      parcel: savedParcel,
    });
  } catch (error: any) {
    console.error("Error creating Steadfast order:", error);
    return NextResponse.json(
      { error: error.message || "Failed to create parcel order" },
      { status: 500 }
    );
  }
}

