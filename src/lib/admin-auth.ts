import crypto from "crypto";
import { cookies } from "next/headers";
import { NextRequest } from "next/server";

export const ADMIN_COOKIE_NAME = "chattime_admin_session";
const ADMIN_SESSION_SECRET =
  process.env.ADMIN_SECRET ||
  process.env.BETTER_AUTH_SECRET ||
  "chattime_admin_super_secret_key_2026_secured";

export const DEFAULT_ADMIN_EMAILS = [
  "mrabidakash@gmail.com",
  "admin@chattimeai.com",
  (process.env.ADMIN_EMAIL || "").toLowerCase().trim(),
].filter(Boolean);

export const DEFAULT_ADMIN_PASSWORD =
  process.env.ADMIN_PASSWORD || "Admin@ChatTime2026!";

/**
 * Verify hardcoded admin credentials
 */
export function verifyAdminCredentials(email?: string, pass?: string): boolean {
  if (!email || !pass) return false;
  const cleanEmail = email.toLowerCase().trim();
  const cleanPass = pass.trim();

  const emailMatches = DEFAULT_ADMIN_EMAILS.some((e) => e === cleanEmail);
  const passMatches = cleanPass === DEFAULT_ADMIN_PASSWORD;

  return emailMatches && passMatches;
}

/**
 * Generate a cryptographically signed HMAC token for the admin session
 */
export function generateAdminToken(email: string): string {
  const payload = {
    email: email.toLowerCase().trim(),
    role: "super_admin",
    iat: Date.now(),
    exp: Date.now() + 1000 * 60 * 60 * 24 * 7, // 7 days validity
  };
  const b64Payload = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const signature = crypto
    .createHmac("sha256", ADMIN_SESSION_SECRET)
    .update(b64Payload)
    .digest("base64url");

  return `${b64Payload}.${signature}`;
}

/**
 * Verify HMAC token from cookie
 */
export function verifyAdminToken(
  token: string,
): { email: string; role: string } | null {
  if (!token || !token.includes(".")) return null;
  const [b64Payload, signature] = token.split(".");

  const expectedSignature = crypto
    .createHmac("sha256", ADMIN_SESSION_SECRET)
    .update(b64Payload)
    .digest("base64url");

  if (signature !== expectedSignature) return null;

  try {
    const payload = JSON.parse(
      Buffer.from(b64Payload, "base64url").toString("utf8"),
    );
    if (!payload.exp || Date.now() > payload.exp) return null;
    return payload;
  } catch {
    return null;
  }
}

/**
 * Get current admin session from incoming cookies (Server Component / Route Handler)
 */
export async function getAdminSession() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(ADMIN_COOKIE_NAME)?.value;
    if (!token) return null;
    return verifyAdminToken(token);
  } catch {
    return null;
  }
}

/**
 * Check admin session from NextRequest headers / cookies
 */
export function getAdminSessionFromRequest(req: NextRequest) {
  const token = req.cookies.get(ADMIN_COOKIE_NAME)?.value;
  if (!token) return null;
  return verifyAdminToken(token);
}

