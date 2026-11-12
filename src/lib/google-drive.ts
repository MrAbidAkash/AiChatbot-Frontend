// src/lib/google-drive.ts
import { getDb } from "./db";
import { saveDocument, BusinessDocument } from "./knowledge";
import { extractPdfTextWithGemini } from "./gemini";
import { ObjectId } from "mongodb";

export interface GoogleIntegration {
  _id?: ObjectId | string;
  userId: string;
  email: string;
  name?: string;
  picture?: string;
  accessToken: string;
  refreshToken?: string;
  expiresAt: Date;
  scope?: string;
  connectedAt: Date;
  updatedAt: Date;
}

export interface GoogleDriveFile {
  id: string;
  name: string;
  mimeType: string;
  size?: string;
  iconLink?: string;
  webViewLink?: string;
  modifiedTime?: string;
  category: "docs" | "sheets" | "pdf" | "other";
}

const COLLECTION_NAME = "google_integrations";

/**
 * Check if Google OAuth credentials are configured
 */
export function isGoogleOAuthConfigured(): boolean {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  return !!(clientId && clientId.trim() && clientSecret && clientSecret.trim());
}

/**
 * Generate Google OAuth consent URL for Drive & Docs / Sheets access
 */
export function getGoogleOAuthUrl(redirectUri: string, state: string): string {
  const clientId = process.env.GOOGLE_CLIENT_ID?.trim();
  if (!clientId) {
    throw new Error("GOOGLE_CLIENT_ID is not configured in environment variables.");
  }

  const scopes = [
    "https://www.googleapis.com/auth/drive.readonly",
    "https://www.googleapis.com/auth/documents.readonly",
    "https://www.googleapis.com/auth/spreadsheets.readonly",
    "https://www.googleapis.com/auth/userinfo.email",
    "https://www.googleapis.com/auth/userinfo.profile",
  ].join(" ");

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: scopes,
    access_type: "offline",
    prompt: "consent",
    state: state,
  });

  return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
}

/**
 * Exchange authorization code for access and refresh tokens
 */
export async function exchangeGoogleCode(code: string, redirectUri: string) {
  const clientId = process.env.GOOGLE_CLIENT_ID?.trim();
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET?.trim();

  if (!clientId || !clientSecret) {
    throw new Error("Google OAuth credentials are not properly configured.");
  }

  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri,
      grant_type: "authorization_code",
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`Google token exchange failed (${response.status}): ${errorBody}`);
  }

  const tokenData = await response.json();

  // Fetch user profile info (email, name, picture)
  let profile = { email: "", name: "", picture: "" };
  try {
    const userinfoRes = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
      headers: {
        Authorization: `Bearer ${tokenData.access_token}`,
      },
    });
    if (userinfoRes.ok) {
      profile = await userinfoRes.json();
    }
  } catch (err) {
    console.warn("Failed to fetch Google user profile:", err);
  }

  return { tokenData, profile };
}

/**
 * Save or update Google integration in MongoDB
 */
export async function saveGoogleIntegration(
  userId: string,
  tokenData: any,
  profile: { email: string; name?: string; picture?: string },
) {
  const db = getDb();
  const collection = db.collection<GoogleIntegration>(COLLECTION_NAME);

  const existing = await collection.findOne({ userId });

  const expiresAt = new Date(
    Date.now() + (tokenData.expires_in || 3600) * 1000,
  );

  const refreshToken = tokenData.refresh_token || existing?.refreshToken;

  const integrationData: Partial<GoogleIntegration> = {
    userId,
    email: profile.email || existing?.email || "Unknown",
    name: profile.name || existing?.name || "",
    picture: profile.picture || existing?.picture || "",
    accessToken: tokenData.access_token,
    refreshToken,
    expiresAt,
    scope: tokenData.scope || existing?.scope || "",
    updatedAt: new Date(),
  };

  if (existing) {
    await collection.updateOne({ userId }, { $set: integrationData });
  } else {
    await collection.insertOne({
      ...integrationData,
      connectedAt: new Date(),
    } as GoogleIntegration);
  }

  return {
    connected: true,
    email: integrationData.email,
    name: integrationData.name,
    picture: integrationData.picture,
  };
}

/**
 * Get valid Google integration with auto-refreshing access token
 */
export async function getValidGoogleToken(userId: string): Promise<string | null> {
  const db = getDb();
  const collection = db.collection<GoogleIntegration>(COLLECTION_NAME);

  let integration = await collection.findOne({ userId });
  if (!integration) {
    integration = await collection.findOne({
      $or: [{ userId: "default" }, { userId: { $exists: false } }],
    });
  }
  if (!integration) {
    const all = await collection.find({}).limit(2).toArray();
    if (all.length === 1) {
      integration = all[0];
    }
  }
  if (!integration) return null;

  const now = new Date();
  // If token is still valid with 2 minutes buffer
  if (integration.expiresAt && integration.expiresAt.getTime() - now.getTime() > 120000) {
    return integration.accessToken;
  }

  // If expired, try refreshing using refresh_token
  if (!integration.refreshToken) {
    console.warn("Google token expired and no refresh token available for user:", userId);
    return integration.accessToken; // Fallback attempt
  }

  const clientId = process.env.GOOGLE_CLIENT_ID?.trim();
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET?.trim();
  if (!clientId || !clientSecret) return integration.accessToken;

  try {
    const res = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        refresh_token: integration.refreshToken,
        grant_type: "refresh_token",
      }),
    });

    if (res.ok) {
      const data = await res.json();
      const newExpiresAt = new Date(Date.now() + (data.expires_in || 3600) * 1000);
      await collection.updateOne(
        { userId },
        {
          $set: {
            accessToken: data.access_token,
            expiresAt: newExpiresAt,
            updatedAt: new Date(),
          },
        },
      );
      return data.access_token;
    } else {
      console.error("Failed to refresh Google token:", await res.text());
    }
  } catch (err) {
    console.error("Error refreshing Google token:", err);
  }

  return integration.accessToken;
}

/**
 * Get Google integration status for user
 */
export async function getGoogleStatus(userId: string) {
  const db = getDb();
  const collection = db.collection<GoogleIntegration>(COLLECTION_NAME);
  const integration = await collection.findOne({ userId });

  if (!integration) {
    return { connected: false };
  }

  return {
    connected: true,
    email: integration.email,
    name: integration.name,
    picture: integration.picture,
    connectedAt: integration.connectedAt,
    lastUpdated: integration.updatedAt,
  };
}

/**
 * Disconnect Google integration for user
 */
export async function disconnectGoogle(userId: string) {
  const db = getDb();
  const collection = db.collection<GoogleIntegration>(COLLECTION_NAME);
  const res = await collection.deleteOne({ userId });
  return res.deletedCount > 0;
}

/**
 * Determine high-level category from mimeType
 */
function getCategoryFromMimeType(mimeType: string): "docs" | "sheets" | "pdf" | "other" {
  if (mimeType === "application/vnd.google-apps.document" || mimeType.includes("word")) {
    return "docs";
  }
  if (
    mimeType === "application/vnd.google-apps.spreadsheet" ||
    mimeType.includes("spreadsheet") ||
    mimeType.includes("csv")
  ) {
    return "sheets";
  }
  if (mimeType === "application/pdf") {
    return "pdf";
  }
  return "other";
}

/**
 * List files from Google Drive
 */
export async function listGoogleDriveFiles(
  accessToken: string,
  options: {
    query?: string;
    type?: "all" | "docs" | "sheets" | "pdfs";
    pageToken?: string;
  } = {},
): Promise<{ files: GoogleDriveFile[]; nextPageToken?: string }> {
  const { query, type = "all", pageToken } = options;

  const conditions: string[] = ["trashed = false"];

  if (type === "docs") {
    conditions.push(
      "(mimeType = 'application/vnd.google-apps.document' or mimeType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document')",
    );
  } else if (type === "sheets") {
    conditions.push(
      "(mimeType = 'application/vnd.google-apps.spreadsheet' or mimeType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' or mimeType = 'text/csv')",
    );
  } else if (type === "pdfs") {
    conditions.push("mimeType = 'application/pdf'");
  } else {
    // Only fetch supported document/sheet/pdf file types
    conditions.push(
      "(mimeType = 'application/vnd.google-apps.document' or " +
        "mimeType = 'application/vnd.google-apps.spreadsheet' or " +
        "mimeType = 'application/pdf' or " +
        "mimeType = 'text/plain' or " +
        "mimeType = 'text/csv' or " +
        "mimeType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' or " +
        "mimeType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document')",
    );
  }

  if (query && query.trim()) {
    const escapedQuery = query.trim().replace(/'/g, "\\'");
    conditions.push(`name contains '${escapedQuery}'`);
  }

  const q = conditions.join(" and ");

  const url = new URL("https://www.googleapis.com/drive/v3/files");
  url.searchParams.set("q", q);
  url.searchParams.set("pageSize", "30");
  url.searchParams.set(
    "fields",
    "nextPageToken,files(id,name,mimeType,size,modifiedTime,webViewLink,iconLink)",
  );
  url.searchParams.set("orderBy", "modifiedTime desc");
  if (pageToken) {
    url.searchParams.set("pageToken", pageToken);
  }

  const res = await fetch(url.toString(), {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Google Drive API error (${res.status}): ${errText}`);
  }

  const data = await res.json();
  const rawFiles = data.files || [];

  const files: GoogleDriveFile[] = rawFiles.map((f: any) => {
    let sizeStr = "Google Doc";
    if (f.size) {
      const bytes = parseInt(f.size, 10);
      sizeStr =
        bytes > 1048576
          ? `${(bytes / 1048576).toFixed(1)} MB`
          : `${(bytes / 1024).toFixed(1)} KB`;
    } else if (f.mimeType === "application/vnd.google-apps.spreadsheet") {
      sizeStr = "Google Sheet";
    }

    return {
      id: f.id,
      name: f.name,
      mimeType: f.mimeType,
      size: sizeStr,
      iconLink: f.iconLink,
      webViewLink: f.webViewLink,
      modifiedTime: f.modifiedTime,
      category: getCategoryFromMimeType(f.mimeType),
    };
  });

  return {
    files,
    nextPageToken: data.nextPageToken,
  };
}

/**
 * Format CSV rows into structured, clean textual data optimal for AI comprehension
 */
export function formatCsvForAI(csvText: string, docTitle = "Spreadsheet"): string {
  if (!csvText || !csvText.trim()) return "";

  const lines = csvText
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);

  if (lines.length === 0) return "";

  // Parse simple CSV line with quotes support
  const parseLine = (line: string): string[] => {
    const result: string[] = [];
    let cur = "";
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') {
        if (inQuotes && line[i + 1] === '"') {
          cur += '"';
          i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (char === "," && !inQuotes) {
        result.push(cur.trim());
        cur = "";
      } else {
        cur += char;
      }
    }
    result.push(cur.trim());
    return result;
  };

  const headers = parseLine(lines[0]);
  const rowCount = lines.length - 1;

  let structured = `DOCUMENT: ${docTitle} (Structured Spreadsheet Data)\n`;
  structured += `Total Records: ${rowCount}\n`;
  structured += `Columns: [${headers.join(", ")}]\n\n`;
  structured += `--- SPREADSHEET ROWS ---\n`;

  for (let i = 1; i < lines.length; i++) {
    const cells = parseLine(lines[i]);
    // Skip empty lines
    if (cells.every((c) => !c)) continue;

    const rowDetails: string[] = [];
    for (let c = 0; c < headers.length; c++) {
      const headerName = headers[c] || `Column ${c + 1}`;
      const cellVal = cells[c] || "-";
      rowDetails.push(`${headerName}: ${cellVal}`);
    }
    structured += `Row ${i}: ${rowDetails.join(" | ")}\n`;
  }

  return structured;
}

/**
 * Parse Google URL to extract file ID and type
 */
export function parseGoogleUrl(
  url: string,
): { fileId: string; type: "docs" | "sheets" | "drive" } | null {
  if (!url || typeof url !== "string") return null;

  // Google Docs: https://docs.google.com/document/d/1aBcDeFgHiJkLmNoPqRsTuVwXyZ/edit
  const docMatch = url.match(/\/document\/d\/([a-zA-Z0-9-_]+)/);
  if (docMatch && docMatch[1]) {
    return { fileId: docMatch[1], type: "docs" };
  }

  // Google Sheets: https://docs.google.com/spreadsheets/d/1aBcDeFgHiJkLmNoPqRsTuVwXyZ/edit
  const sheetMatch = url.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
  if (sheetMatch && sheetMatch[1]) {
    return { fileId: sheetMatch[1], type: "sheets" };
  }

  // Google Drive: https://drive.google.com/file/d/1aBcDeFgHiJkLmNoPqRsTuVwXyZ/view
  const driveFileMatch = url.match(/\/file\/d\/([a-zA-Z0-9-_]+)/);
  if (driveFileMatch && driveFileMatch[1]) {
    return { fileId: driveFileMatch[1], type: "drive" };
  }

  // Google Drive open?id=...
  const driveIdMatch = url.match(/[?&]id=([a-zA-Z0-9-_]+)/);
  if (driveIdMatch && driveIdMatch[1] && url.includes("drive.google.com")) {
    return { fileId: driveIdMatch[1], type: "drive" };
  }

  return null;
}

/**
 * Fetch content from public Google Docs or Sheets link (without requiring OAuth)
 */
export async function fetchPublicGoogleContent(
  fileId: string,
  type: "docs" | "sheets" | "drive",
): Promise<{ title: string; content: string; fileType: "doc" | "sheet" | "pdf" | "txt" }> {
  if (type === "docs") {
    const exportUrl = `https://docs.google.com/document/d/${fileId}/export?format=txt`;
    const res = await fetch(exportUrl, { redirect: "follow" });

    if (!res.ok || res.headers.get("content-type")?.includes("text/html")) {
      throw new Error(
        "Could not access Google Doc. Please make sure the link sharing is set to 'Anyone with the link can view' (Public), or connect your Google Drive account.",
      );
    }

    const text = await res.text();
    if (!text.trim()) {
      throw new Error("The Google Doc appears to be empty.");
    }

    // Try extracting title from the first non-empty line
    const lines = text.split("\n").map((l) => l.trim()).filter(Boolean);
    const title = lines[0] ? lines[0].slice(0, 60) : "Google Document";

    return {
      title,
      content: text.trim(),
      fileType: "doc",
    };
  }

  if (type === "sheets") {
    const exportUrl = `https://docs.google.com/spreadsheets/d/${fileId}/export?format=csv`;
    const res = await fetch(exportUrl, { redirect: "follow" });

    if (!res.ok || res.headers.get("content-type")?.includes("text/html")) {
      throw new Error(
        "Could not access Google Sheet. Please make sure the link sharing is set to 'Anyone with the link can view' (Public), or connect your Google Drive account.",
      );
    }

    const csvText = await res.text();
    if (!csvText.trim()) {
      throw new Error("The Google Sheet appears to be empty.");
    }

    const title = "Google Sheet Data";
    const structuredContent = formatCsvForAI(csvText, title);

    return {
      title,
      content: structuredContent,
      fileType: "sheet",
    };
  }

  // Drive file download (PDF or text)
  const downloadUrl = `https://drive.google.com/uc?export=download&id=${fileId}`;
  const res = await fetch(downloadUrl, { redirect: "follow" });

  if (!res.ok || res.headers.get("content-type")?.includes("text/html")) {
    throw new Error(
      "Could not download Google Drive file. Please make sure the file is shared with 'Anyone with the link can view', or connect your Google Drive account.",
    );
  }

  const contentType = res.headers.get("content-type") || "";
  const arrayBuffer = await res.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  if (contentType.includes("pdf") || buffer.slice(0, 4).toString() === "%PDF") {
    const extractedText = await extractPdfTextWithGemini(buffer, `gdrive_${fileId}.pdf`);
    return {
      title: "Google Drive PDF",
      content: extractedText,
      fileType: "pdf",
    };
  }

  const text = buffer.toString("utf-8");
  return {
    title: "Google Drive File",
    content: text,
    fileType: "txt",
  };
}

/**
 * Fetch and parse a file from Google Drive using an authenticated Bearer token
 */
export async function fetchAuthenticatedGoogleContent(
  accessToken: string,
  fileId: string,
): Promise<{
  title: string;
  fileName: string;
  content: string;
  fileType: "doc" | "sheet" | "pdf" | "txt" | "csv";
  size: string;
  webViewLink?: string;
}> {
  // 1. Get file metadata
  const metaUrl = `https://www.googleapis.com/drive/v3/files/${fileId}?fields=id,name,mimeType,size,webViewLink`;
  const metaRes = await fetch(metaUrl, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!metaRes.ok) {
    const errText = await metaRes.text();
    throw new Error(`Failed to retrieve file metadata (${metaRes.status}): ${errText}`);
  }

  const meta = await metaRes.json();
  const { name, mimeType, webViewLink } = meta;

  // 2. Extract content based on mimeType
  if (mimeType === "application/vnd.google-apps.document") {
    // Export Google Doc as plain text
    const exportUrl = `https://www.googleapis.com/drive/v3/files/${fileId}/export?mimeType=text/plain`;
    const docRes = await fetch(exportUrl, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (!docRes.ok) {
      throw new Error(`Failed to export Google Doc: ${await docRes.text()}`);
    }

    const text = await docRes.text();
    return {
      title: name,
      fileName: `${name}.txt`,
      content: text.trim(),
      fileType: "doc",
      size: `${(text.length / 1024).toFixed(1)} KB`,
      webViewLink,
    };
  }

  if (mimeType === "application/vnd.google-apps.spreadsheet") {
    // Export Google Sheet as CSV
    const exportUrl = `https://www.googleapis.com/drive/v3/files/${fileId}/export?mimeType=text/csv`;
    const sheetRes = await fetch(exportUrl, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (!sheetRes.ok) {
      throw new Error(`Failed to export Google Sheet: ${await sheetRes.text()}`);
    }

    const csvText = await sheetRes.text();
    const structured = formatCsvForAI(csvText, name);

    return {
      title: name,
      fileName: `${name}.csv`,
      content: structured,
      fileType: "sheet",
      size: `${(csvText.length / 1024).toFixed(1)} KB`,
      webViewLink,
    };
  }

  if (mimeType === "application/pdf") {
    // Download raw PDF bytes
    const dlUrl = `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`;
    const pdfRes = await fetch(dlUrl, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (!pdfRes.ok) {
      throw new Error(`Failed to download PDF from Google Drive: ${await pdfRes.text()}`);
    }

    const arrayBuffer = await pdfRes.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const text = await extractPdfTextWithGemini(buffer, name);

    const sizeBytes = buffer.length;
    const sizeStr =
      sizeBytes > 1048576
        ? `${(sizeBytes / 1048576).toFixed(1)} MB`
        : `${(sizeBytes / 1024).toFixed(1)} KB`;

    return {
      title: name,
      fileName: name.endsWith(".pdf") ? name : `${name}.pdf`,
      content: text,
      fileType: "pdf",
      size: sizeStr,
      webViewLink,
    };
  }

  // Text / CSV / other files in Drive
  const dlUrl = `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`;
  const fileRes = await fetch(dlUrl, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!fileRes.ok) {
    throw new Error(`Failed to read file from Google Drive: ${await fileRes.text()}`);
  }

  const rawText = await fileRes.text();
  const isCsv = mimeType.includes("csv") || name.endsWith(".csv");

  return {
    title: name,
    fileName: name,
    content: isCsv ? formatCsvForAI(rawText, name) : rawText.trim(),
    fileType: isCsv ? "csv" : "txt",
    size: `${(rawText.length / 1024).toFixed(1)} KB`,
    webViewLink,
  };
}

/**
 * Re-sync an existing Google Document or Sheet with its live source
 */
export async function syncGoogleDocument(
  docId: string,
  userId: string,
): Promise<BusinessDocument> {
  const db = getDb();
  const collection = db.collection<BusinessDocument>("business_knowledge");

  let docObjectId: ObjectId | string;
  try {
    docObjectId = new ObjectId(docId);
  } catch {
    docObjectId = docId;
  }

  const doc = await collection.findOne({ _id: docObjectId as any });
  if (!doc) {
    throw new Error("Document not found in database.");
  }

  // Strictly enforce: ONLY Google Sheets and Google Docs can be updated/synced
  const isSheet = doc.fileType === "sheet" || doc.metadata?.source === "google_sheets";
  const isDoc = doc.fileType === "doc" || doc.metadata?.source === "google_docs";

  if (!isSheet && !isDoc) {
    throw new Error("Only Google Sheets and Google Docs can be dynamically updated. PDF and static Drive files cannot be updated via sync.");
  }

  const googleFileId = doc.metadata?.googleFileId;
  const sourceUrl = doc.metadata?.sourceUrl;

  if (!googleFileId && !sourceUrl) {
    throw new Error("This document was not imported from Google Drive, Docs, or Sheets.");
  }

  let freshContent = "";
  let freshSize = doc.size;

  // 1. If we have a valid Google OAuth token, use it
  const token = await getValidGoogleToken(userId);
  if (token && googleFileId) {
    const fetched = await fetchAuthenticatedGoogleContent(token, googleFileId);
    freshContent = fetched.content;
    freshSize = fetched.size;
  } else if (sourceUrl) {
    // 2. Fall back to public URL fetch
    const parsed = parseGoogleUrl(sourceUrl);
    if (!parsed) {
      throw new Error("Invalid Google document URL.");
    }
    const fetched = await fetchPublicGoogleContent(parsed.fileId, parsed.type);
    freshContent = fetched.content;
    freshSize = `${(freshContent.length / 1024).toFixed(1)} KB`;
  } else if (googleFileId) {
    // 3. Fall back to public fetch with fileId
    const type = doc.fileType === "sheet" ? "sheets" : doc.fileType === "doc" ? "docs" : "drive";
    const fetched = await fetchPublicGoogleContent(googleFileId, type);
    freshContent = fetched.content;
    freshSize = `${(freshContent.length / 1024).toFixed(1)} KB`;
  } else {
    throw new Error("Cannot re-sync: Missing Google file identifier or access token.");
  }

  if (!freshContent.trim()) {
    throw new Error("Extracted content is empty after sync.");
  }

  // Update existing document
  const updatedDoc = await saveDocument({
    userId: doc.userId,
    pageId: doc.pageId,
    title: doc.title,
    fileName: doc.fileName,
    fileType: doc.fileType,
    size: freshSize,
    content: freshContent,
    replaceExisting: true,
    metadata: {
      ...doc.metadata,
      lastSyncedAt: new Date().toISOString(),
    },
  });

  return updatedDoc;
}

