// src/app/api/facebook/auth-url/route.ts
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

export async function GET(request: NextRequest) {
  const clientId = process.env.FACEBOOK_CLIENT_ID;

  if (!clientId || !clientId.trim()) {
    return NextResponse.json(
      {
        configured: false,
        error: "FACEBOOK_CLIENT_ID is not configured in .env",
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
  const redirectUri = `${protocol}://${host}/api/facebook/callback`;

  // Required permissions for Page listing and Messenger auto-reply
  const scopes = [
    "pages_show_list",
    "pages_messaging",
    "pages_manage_metadata",
    "pages_read_engagement",
  ].join(",");

  const authUrl = `https://www.facebook.com/v21.0/dialog/oauth?client_id=${encodeURIComponent(clientId.trim())}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${encodeURIComponent(scopes)}&response_type=code&state=${encodeURIComponent(userId)}`;

  return NextResponse.json({
    configured: true,
    authUrl,
    redirectUri,
    userId,
  });
}

