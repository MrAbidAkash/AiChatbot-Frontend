// src/app/api/facebook/callback/route.ts
import { NextRequest, NextResponse } from "next/server";
import { exchangeCodeForPages } from "@/lib/facebook";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get("code");
  const errorReason = searchParams.get("error_description") || searchParams.get("error");

  const host = request.headers.get("host") || "localhost:3000";
  const protocol = host.includes("localhost") ? "http" : "https";
  const redirectUri = `${protocol}://${host}/api/facebook/callback`;

  if (errorReason) {
    const errorHtml = `
      <!DOCTYPE html>
      <html>
      <head><title>Authentication Cancelled</title></head>
      <body style="font-family: system-ui, sans-serif; text-align: center; padding: 40px; background: #fafafa;">
        <h3 style="color: #dc2626;">Facebook Login Cancelled or Denied</h3>
        <p style="color: #666; font-size: 14px;">${errorReason}</p>
        <script>
          if (window.opener) {
            window.opener.postMessage({ type: 'FACEBOOK_AUTH_ERROR', error: ${JSON.stringify(errorReason)} }, '*');
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
    const { pages } = await exchangeCodeForPages(code, redirectUri);

    const successHtml = `
      <!DOCTYPE html>
      <html>
      <head><title>Facebook Connected!</title></head>
      <body style="font-family: system-ui, sans-serif; text-align: center; padding: 40px; background: #fafafa;">
        <h3 style="color: #16a34a;">Connected with Facebook!</h3>
        <p style="color: #666; font-size: 14px;">Loading your pages into the selector...</p>
        <script>
          if (window.opener) {
            window.opener.postMessage({
              type: 'FACEBOOK_AUTH_SUCCESS',
              pages: ${JSON.stringify(pages)}
            }, '*');
            window.close();
          } else {
            window.location.href = '/connect';
          }
        </script>
      </body>
      </html>
    `;
    return new NextResponse(successHtml, { headers: { "Content-Type": "text/html" } });
  } catch (err: any) {
    console.error("Facebook callback exchange error:", err);
    const failHtml = `
      <!DOCTYPE html>
      <html>
      <head><title>Facebook Connection Failed</title></head>
      <body style="font-family: system-ui, sans-serif; text-align: center; padding: 40px; background: #fafafa;">
        <h3 style="color: #dc2626;">Failed to Retrieve Facebook Pages</h3>
        <p style="color: #666; font-size: 14px;">${err.message}</p>
        <button onclick="window.close()" style="margin-top: 15px; padding: 8px 16px; border-radius: 6px; border: 1px solid #ccc; cursor: pointer;">Close Window</button>
        <script>
          if (window.opener) {
            window.opener.postMessage({ type: 'FACEBOOK_AUTH_ERROR', error: ${JSON.stringify(err.message)} }, '*');
            setTimeout(() => window.close(), 3000);
          }
        </script>
      </body>
      </html>
    `;
    return new NextResponse(failHtml, { headers: { "Content-Type": "text/html" } });
  }
}

