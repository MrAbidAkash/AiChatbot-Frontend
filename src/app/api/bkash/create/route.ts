import { NextRequest, NextResponse } from "next/server";
import { createBkashPayment, BkashCreatePaymentRequest } from "@/lib/bkash";
import { savePaymentRecord } from "@/lib/payment-db";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

export async function POST(req: NextRequest) {
  try {
    console.log("Creating bKash payment...");

    const paymentData: BkashCreatePaymentRequest = await req.json();

    let userId = "";
    let userEmail = "";
    try {
      const session = await auth.api.getSession({
        headers: await headers(),
      });
      if (session?.user?.id) {
        userId = session.user.id;
        userEmail = session.user.email || "";
      }
    } catch {
      // non-fatal
    }

    console.log("Payment data:", paymentData);

    const bkashResponse = await createBkashPayment(paymentData);

    console.log("bKash response:", bkashResponse);

    // Save payment record to database
    try {
      const paymentRecord = await savePaymentRecord({
        paymentID: bkashResponse.paymentID,
        amount: paymentData.amount,
        transactionStatus: bkashResponse.transactionStatus,
        user: userId || undefined,
        customerInfo: {
          name: paymentData.customerInfo?.name || "",
          email: paymentData.customerInfo?.email || userEmail || "",
          phone: paymentData.customerInfo?.phone || "",
          address: paymentData.customerInfo?.address,
        },
      });
      console.log("Payment record saved:", paymentRecord);
    } catch (dbError) {
      console.error("Failed to save payment record:", dbError);
      // Continue with the response even if DB save fails
    }

    return NextResponse.json(bkashResponse);
  } catch (error) {
    console.error("bKash payment creation error:", error);

    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Payment creation failed",
      },
      { status: 500 },
    );
  }
}
