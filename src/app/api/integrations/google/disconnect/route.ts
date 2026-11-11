// src/app/api/integrations/google/disconnect/route.ts
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { disconnectGoogle } from "@/lib/google-drive";

export async function POST() {
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

    await disconnectGoogle(userId);
    return NextResponse.json({ success: true, message: "Google Drive disconnected" });
  } catch (error: any) {
    console.error("Error disconnecting Google:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

