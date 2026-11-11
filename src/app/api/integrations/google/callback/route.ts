// src/app/api/integrations/google/callback/route.ts
import { NextRequest, NextResponse } from "next/server";
import { exchangeGoogleCode, saveGoogleIntegration } from "@/lib/google-drive";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get("code");
  const stateUserId = searchParams.get("state") || "default";
  const errorReason = searchParams.get("error_description") || searchParams.get("error");

  const host = request.headers.get("host") || "localhost:3000";
  const protocol = host.includes("localhost") ? "http" : "https";
  const redirectUri = `${protocol}://${host}/api/integrations/google/callback`;

  if (errorReason) {
    const errorHtml = `
      <!DOCTYPE html>
      <html>
      <head><title>Google Authentication Cancelled</title></head>
      <body style="font-family: system-ui, sans-serif; text-align: center; padding: 40px; background: #fafafa; color: #333;">
        <h3 style="color: #dc2626;">Google Authorization Cancelled</h3>
        <p style="color: #666; font-size: 14px;">${errorReason}</p>
        <script>
          if (window.opener) {
            window.opener.postMessage({ type: 'GOOGLE_AUTH_ERROR', error: ${JSON.stringify(errorReason)} }, '*');
            setTimeout(() => window.close(), 1500);
          }
        </script>
      </body>
      </html>
    `;
    return new NextResponse(errorHtml, { headers: { "Content-Type": "text/html" } });
  }

  if (!code) {
    return NextResponse.json({ error: "Missing authorization code" }, { status: 400 });
  }

  try {
    const { tokenData, profile } = await exchangeGoogleCode(code, redirectUri);
    await saveGoogleIntegration(stateUserId, tokenData, profile);

    const successHtml = `
      <!DOCTYPE html>
      <html>
      <head><title>Google Connected!</title></head>
      <body style="font-family: system-ui, sans-serif; text-align: center; padding: 40px; background: #fafafa; color: #333;">
        <div style="font-size: 40px; margin-bottom: 12px;">✅</div>
        <h3 style="color: #16a34a; margin: 0 0 8px 0;">Google Drive Connected!</h3>
        <p style="color: #666; font-size: 14px;">Connected as <strong>${profile.email || "Google User"}</strong></p>
        <p style="color: #888; font-size: 12px;">Syncing your files...</p>
        <script>
          if (window.opener) {
            window.opener.postMessage({
              type: 'GOOGLE_AUTH_SUCCESS',
              email: ${JSON.stringify(profile.email)},
              name: ${JSON.stringify(profile.name || "")},
              picture: ${JSON.stringify(profile.picture || "")},
              userId: ${JSON.stringify(stateUserId)}
            }, '*');
            setTimeout(() => window.close(), 1000);
          } else {
            window.location.href = '/documents';
          }
        </script>
      </body>
      </html>
    `;
    return new NextResponse(successHtml, { headers: { "Content-Type": "text/html" } });
  } catch (err: any) {
    console.error("Google callback exchange error:", err);
    const failHtml = `
      <!DOCTYPE html>
      <html>
      <head><title>Google Connection Failed</title></head>
      <body style="font-family: system-ui, sans-serif; text-align: center; padding: 40px; background: #fafafa; color: #333;">
        <div style="font-size: 40px; margin-bottom: 12px;">❌</div>
        <h3 style="color: #dc2626;">Failed to Connect Google Drive</h3>
        <p style="color: #666; font-size: 14px;">${err.message}</p>
        <button onclick="window.close()" style="margin-top: 15px; padding: 8px 16px; border-radius: 6px; border: 1px solid #ccc; cursor: pointer; background: #fff;">Close Window</button>
        <script>
          if (window.opener) {
            window.opener.postMessage({ type: 'GOOGLE_AUTH_ERROR', error: ${JSON.stringify(err.message)} }, '*');
            setTimeout(() => window.close(), 3000);
          }
        </script>
      </body>
      </html>
    `;
    return new NextResponse(failHtml, { headers: { "Content-Type": "text/html" } });
  }
}

