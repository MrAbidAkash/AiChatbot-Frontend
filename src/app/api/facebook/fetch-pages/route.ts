// src/app/api/facebook/fetch-pages/route.ts
import { NextRequest, NextResponse } from "next/server";
import { fetchUserFacebookPages } from "@/lib/facebook";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userAccessToken } = body;

    if (!userAccessToken || !userAccessToken.trim()) {
      return NextResponse.json(
        { error: "User Access Token is required to fetch managed pages" },
        { status: 400 },
      );
    }

    const pages = await fetchUserFacebookPages(userAccessToken.trim());
    return NextResponse.json({ pages });
  } catch (error: any) {
    const isTokenError =
      error.message?.includes("OAuth") ||
      error.message?.includes("access token") ||
      error.message?.includes("format");

    return NextResponse.json(
      {
        error: isTokenError
          ? "Invalid Facebook Token. Please make sure you paste a valid User Access Token with 'pages_show_list' permission."
          : error.message || "Failed to fetch Facebook pages",
      },
      { status: 400 },
    );
  }
}

