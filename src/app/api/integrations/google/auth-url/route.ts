// src/app/api/integrations/google/auth-url/route.ts
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { isGoogleOAuthConfigured, getGoogleOAuthUrl } from "@/lib/google-drive";

export async function GET(request: NextRequest) {
  try {
    if (!isGoogleOAuthConfigured()) {
      return NextResponse.json(
        {
          configured: false,
          error: "Google OAuth credentials (GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET) are not configured.",
        },
        { status: 200 },
      );
    }

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

    const host = request.headers.get("host") || "localhost:3000";
    const protocol = host.includes("localhost") ? "http" : "https";
    const redirectUri = `${protocol}://${host}/api/integrations/google/callback`;

    const authUrl = getGoogleOAuthUrl(redirectUri, userId);

    return NextResponse.json({
      configured: true,
      authUrl,
      redirectUri,
      userId,
    });
  } catch (error: any) {
    console.error("Error generating Google auth URL:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

