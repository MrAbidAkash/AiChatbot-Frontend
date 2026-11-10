import { NextRequest, NextResponse } from "next/server";
import {
  verifyAdminCredentials,
  generateAdminToken,
  ADMIN_COOKIE_NAME,
} from "@/lib/admin-auth";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 },
      );
    }

    const isValid = verifyAdminCredentials(email, password);
    if (!isValid) {
      return NextResponse.json(
        { error: "Invalid admin credentials. Access denied." },
        { status: 401 },
      );
    }

    const token = generateAdminToken(email);

    const response = NextResponse.json({
      success: true,
      message: "Admin authentication successful",
      admin: {
        email: email.toLowerCase().trim(),
        role: "super_admin",
      },
    });

    // Set secure HTTP-only cookie
    response.cookies.set({
      name: ADMIN_COOKIE_NAME,
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });

    return response;
  } catch (error: any) {
    console.error("Admin login error:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred during admin login" },
      { status: 500 },
    );
  }
}

