// src/app/api/integrations/google/status/route.ts
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { getGoogleStatus, isGoogleOAuthConfigured } from "@/lib/google-drive";

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

    const oauthConfigured = isGoogleOAuthConfigured();
    const status = await getGoogleStatus(userId);

    return NextResponse.json({
      configured: oauthConfigured,
      ...status,
    });
  } catch (error: any) {
    console.error("Error checking Google status:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

