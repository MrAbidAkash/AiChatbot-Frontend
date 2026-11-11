// src/app/api/integrations/google/files/route.ts
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { getValidGoogleToken, listGoogleDriveFiles } from "@/lib/google-drive";

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

    const token = await getValidGoogleToken(userId);
    if (!token) {
      return NextResponse.json(
        {
          error: "Google Drive is not connected. Please connect your Google account.",
          connected: false,
        },
        { status: 401 },
      );
    }

    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get("query") || undefined;
    const type = (searchParams.get("type") || "all") as any;
    const pageToken = searchParams.get("pageToken") || undefined;

    const result = await listGoogleDriveFiles(token, {
      query,
      type,
      pageToken,
    });

    return NextResponse.json({
      connected: true,
      files: result.files,
      nextPageToken: result.nextPageToken,
    });
  } catch (error: any) {
    console.error("Error listing Google Drive files:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

