// src/app/api/facebook/config/route.ts
import { NextResponse } from "next/server";

export async function GET() {
  const appId =
    process.env.FACEBOOK_CLIENT_ID ||
    process.env.NEXT_PUBLIC_FACEBOOK_APP_ID ||
    "";

  return NextResponse.json({
    appId,
    hasAppId: Boolean(appId && appId.trim().length > 0),
  });
}

