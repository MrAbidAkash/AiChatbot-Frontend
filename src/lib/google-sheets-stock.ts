// src/lib/google-sheets-stock.ts
import { getValidGoogleToken, syncGoogleDocument } from "./google-drive";
import { getDb } from "./db";
import { BusinessDocument } from "./knowledge";
import { ObjectId } from "mongodb";

export interface StockUpdateResult {
  success: boolean;
  spreadsheetId: string;
  sheetName: string;
  productName: string;
  matchedRow: number;
  stockColumn: string;
  previousStock: number;
  newStock: number;
  message: string;
}

export interface DetectedOrder {
  isOrderConfirmed: boolean;
  productName?: string;
  quantity?: number;
  customerName?: string;
  customerPhone?: string;
  deliveryAddress?: string;
  confidence?: number;
}

/**
 * Convert 0-indexed column number to Excel column letters (0 -> A, 1 -> B, 26 -> AA)
 */
export function columnToLetter(column: number): string {
  let temp: number;
  let letter = "";
  let col = column + 1;
  while (col > 0) {
    temp = (col - 1) % 26;
    letter = String.fromCharCode(temp + 65) + letter;
    col = Math.floor((col - temp - 1) / 26);
  }
  return letter;
}

/**
 * Extract numeric stock count from text like "15", "15 pcs", "In stock (10)"
 */
export function parseNumericStock(value: any): number {
  if (typeof value === "number") return value;
  if (!value) return 0;
  const str = String(value).trim();
  const match = str.match(/\d+/);
  return match ? parseInt(match[0], 10) : 0;
}

/**
 * Find product row and stock column index in Google Sheet values grid
 */
export function findProductAndStockCell(
  rows: string[][],
  targetProductName: string,
): {
  rowIndex: number;
  stockColIndex: number;
  productColIndex: number;
  productName: string;
  currentStock: number;
} | null {
  if (!rows || rows.length < 2) return null;

  const headerRow = rows[0].map((h) => String(h || "").toLowerCase().trim());

  // 1. Locate product column
  let productColIndex = headerRow.findIndex(
    (h) =>
      h.includes("product") ||
      h.includes("item") ||
      h.includes("name") ||
      h.includes("title") ||
      h.includes("পণ্য") ||
      h.includes("নাম"),
  );
  if (productColIndex === -1) productColIndex = 0; // Default to first column

  // 2. Locate stock column
  let stockColIndex = headerRow.findIndex(
    (h) =>
      h.includes("stock") ||
      h.includes("qty") ||
      h.includes("quantity") ||
      h.includes("available") ||
      h.includes("স্টক") ||
      h.includes("পরিমাণ") ||
      h.includes("সংখ্যা"),
  );

  // If header doesn't explicitly mention stock, find a numeric column
  if (stockColIndex === -1) {
    for (let c = 0; c < headerRow.length; c++) {
      if (c !== productColIndex) {
        const hasNumber = rows.slice(1, 4).some((r) => /\d+/.test(r[c] || ""));
        if (hasNumber) {
          stockColIndex = c;
          break;
        }
      }
    }
  }

  if (stockColIndex === -1) return null;

  const cleanTarget = targetProductName.toLowerCase().replace(/[^\w\u0980-\u09FF]/g, " ").trim();
  const targetWords = cleanTarget.split(/\s+/).filter(Boolean);

  let bestMatchRow = -1;
  let bestScore = 0;

  // Search each data row
  for (let r = 1; r < rows.length; r++) {
    const row = rows[r];
    const cellProduct = String(row[productColIndex] || "").toLowerCase().trim();
    if (!cellProduct) continue;

    // Exact match
    if (cellProduct === cleanTarget) {
      bestMatchRow = r;
      break;
    }

    // Substring match
    if (cellProduct.includes(cleanTarget) || cleanTarget.includes(cellProduct)) {
      const score = Math.min(cellProduct.length, cleanTarget.length);
      if (score > bestScore) {
        bestScore = score;
        bestMatchRow = r;
      }
      continue;
    }

    // Keyword match
    const matchingWords = targetWords.filter((w) => cellProduct.includes(w));
    if (matchingWords.length > 0) {
      const score = (matchingWords.length / targetWords.length) * 10;
      if (score > bestScore && score >= 5) {
        bestScore = score;
        bestMatchRow = r;
      }
    }
  }

  if (bestMatchRow === -1) return null;

  const matchedRow = rows[bestMatchRow];
  const currentStock = parseNumericStock(matchedRow[stockColIndex]);

  return {
    rowIndex: bestMatchRow,
    stockColIndex,
    productColIndex,
    productName: matchedRow[productColIndex] || targetProductName,
    currentStock,
  };
}

/**
 * Decrement stock for a product directly in the merchant's Google Sheet
 */
export async function decrementGoogleSheetStock(
  userId: string,
  spreadsheetId: string,
  productName: string,
  quantityToDeduct = 1,
): Promise<StockUpdateResult> {
  const token = await getValidGoogleToken(userId);
  if (!token) {
    throw new Error("Google account is not connected or token expired.");
  }

  // 1. Fetch spreadsheet metadata to get the first sheet name
  const metaUrl = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}?fields=sheets.properties.title`;
  const metaRes = await fetch(metaUrl, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!metaRes.ok) {
    throw new Error(`Failed to fetch Google Sheet structure: ${await metaRes.text()}`);
  }

  const metaData = await metaRes.json();
  const sheetName = metaData.sheets?.[0]?.properties?.title || "Sheet1";

  // 2. Fetch sheet values
  const valuesUrl = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/'${encodeURIComponent(sheetName)}'!A1:Z500`;
  const valuesRes = await fetch(valuesUrl, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!valuesRes.ok) {
    throw new Error(`Failed to read rows from Google Sheet: ${await valuesRes.text()}`);
  }

  const valuesData = await valuesRes.json();
  const rows: string[][] = valuesData.values || [];

  if (rows.length === 0) {
    throw new Error("The Google Sheet appears to be empty.");
  }

  // 3. Find target product and stock cell
  const match = findProductAndStockCell(rows, productName);
  if (!match) {
    throw new Error(`Could not find product matching "${productName}" in Google Sheet.`);
  }

  const previousStock = match.currentStock;
  const newStock = Math.max(0, previousStock - quantityToDeduct);
  const colLetter = columnToLetter(match.stockColIndex);
  const cellAddress = `'${sheetName}'!${colLetter}${match.rowIndex + 1}`;

  // 4. Update cell in Google Sheet via Google Sheets API v4
  const updateUrl = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(cellAddress)}?valueInputOption=USER_ENTERED`;
  const updateRes = await fetch(updateUrl, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      range: cellAddress,
      majorDimension: "ROWS",
      values: [[newStock.toString()]],
    }),
  });

  if (!updateRes.ok) {
    const errText = await updateRes.text();
    throw new Error(`Google Sheets API update error: ${errText}`);
  }

  // 5. Automatically re-sync the document in MongoDB business_knowledge so AI immediately knows the new stock
  try {
    const db = getDb();
    const doc = await db.collection<BusinessDocument>("business_knowledge").findOne({
      userId,
      "metadata.googleFileId": spreadsheetId,
    });
    if (doc?._id) {
      await syncGoogleDocument(doc._id.toString(), userId);
    }
  } catch (syncErr) {
    console.warn("Background re-sync after stock update warning:", syncErr);
  }

  return {
    success: true,
    spreadsheetId,
    sheetName,
    productName: match.productName,
    matchedRow: match.rowIndex + 1,
    stockColumn: colLetter,
    previousStock,
    newStock,
    message: `Updated "${match.productName}" stock in Google Sheet from ${previousStock} to ${newStock} (Cell: ${colLetter}${match.rowIndex + 1}).`,
  };
}

/**
 * Analyze a customer conversation with Gemini to detect if an order has been confirmed
 */
export async function detectOrderConfirmationWithAI(options: {
  customerMessage: string;
  aiReply: string;
  conversationHistory?: Array<{ senderType: string; text: string }>;
}): Promise<DetectedOrder> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return { isOrderConfirmed: false };
  }

  const { customerMessage, aiReply, conversationHistory = [] } = options;

  const prompt = `Analyze this e-commerce customer support chat on Facebook Messenger.
Determine if the customer has CONFIRMED an order (e.g. provided their name/phone number/address, or explicitly agreed to confirm/buy).

Recent Chat History:
${conversationHistory.map((h) => `${h.senderType.toUpperCase()}: ${h.text}`).join("\n")}
CUSTOMER: "${customerMessage}"
AI BOT: "${aiReply}"

Respond strictly with valid JSON:
{
  "isOrderConfirmed": true | false,
  "productName": "extracted exact product name or item ordered, e.g. Black Cotton T-Shirt",
  "quantity": 1,
  "customerName": "customer name if provided",
  "customerPhone": "customer phone/mobile number if provided",
  "deliveryAddress": "delivery address or area if provided",
  "confidence": 0.0 to 1.0
}

Rules:
- Set isOrderConfirmed to true ONLY if the customer is placing or confirming a purchase (has indicated they want the product and provided details like phone, address, or said 'order confirm / deliver to me / অর্ডার কনফার্ম').
- Do not set isOrderConfirmed to true if they are only inquiring about price, colors, or availability.`;

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-lite-latest:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ role: "user", parts: [{ text: prompt }] }],
          generationConfig: {
            responseMimeType: "application/json",
            temperature: 0.1,
          },
        }),
      },
    );

    if (response.ok) {
      const data = await response.json();
      const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text;
      if (rawText) {
        const parsed = JSON.parse(rawText);
        return {
          isOrderConfirmed: Boolean(parsed.isOrderConfirmed),
          productName: parsed.productName || undefined,
          quantity: typeof parsed.quantity === "number" ? parsed.quantity : 1,
          customerName: parsed.customerName || undefined,
          customerPhone: parsed.customerPhone || undefined,
          deliveryAddress: parsed.deliveryAddress || undefined,
          confidence: parsed.confidence || 0.8,
        };
      }
    }
  } catch (err) {
    console.warn("Order detection analysis error:", err);
  }

  return { isOrderConfirmed: false };
}

/**
 * Process order confirmation in conversation: deducts stock in Google Sheet & logs order
 */
export async function handleAutoStockDeductionOnOrder(options: {
  userId: string;
  pageId?: string;
  customerMessage: string;
  aiReply: string;
  conversationHistory?: Array<{ senderType: string; text: string }>;
  customerName?: string;
  senderPsid?: string;
}): Promise<StockUpdateResult | null> {
  const { userId, pageId, customerMessage, aiReply, conversationHistory, customerName, senderPsid } =
    options;

  // 1. Detect if order is confirmed
  const detected = await detectOrderConfirmationWithAI({
    customerMessage,
    aiReply,
    conversationHistory,
  });

  if (!detected.isOrderConfirmed || !detected.productName) {
    return null;
  }

  console.log(
    `[Auto-Stock] Order confirmed for "${detected.productName}" (Qty: ${detected.quantity || 1}) by customer "${customerName || detected.customerName || "Customer"}"`,
  );

  // 2. Find merchant's connected Google Sheet for this page/user
  const db = getDb();
  const query: any = {
    userId,
    fileType: "sheet",
    "metadata.googleFileId": { $exists: true, $ne: "" },
  };
  if (pageId && pageId !== "all") {
    query.$or = [{ pageId }, { pageId: null }, { pageId: { $exists: false } }];
  }

  const sheets = await db
    .collection<BusinessDocument>("business_knowledge")
    .find(query)
    .sort({ updatedAt: -1 })
    .toArray();

  if (sheets.length === 0) {
    console.warn(
      `[Auto-Stock] No connected Google Sheets found with stock for user "${userId}". Skipping stock decrement.`,
    );
    return null;
  }

  // 3. Deduct stock in Google Sheet
  for (const sheet of sheets) {
    const spreadsheetId = sheet.metadata?.googleFileId;
    if (!spreadsheetId) continue;

    try {
      const result = await decrementGoogleSheetStock(
        userId,
        spreadsheetId,
        detected.productName,
        detected.quantity || 1,
      );

      console.log(`[Auto-Stock] Success: ${result.message}`);

      // Record order log in MongoDB
      try {
        await db.collection("orders").insertOne({
          userId,
          pageId: pageId || null,
          customerName: customerName || detected.customerName || "Customer",
          customerPhone: detected.customerPhone || null,
          deliveryAddress: detected.deliveryAddress || null,
          senderPsid: senderPsid || null,
          productName: result.productName,
          quantity: detected.quantity || 1,
          spreadsheetId,
          sheetName: result.sheetName,
          stockCell: `${result.stockColumn}${result.matchedRow}`,
          previousStock: result.previousStock,
          newStock: result.newStock,
          status: "confirmed",
          createdAt: new Date(),
        });
      } catch (orderErr) {
        console.warn("Failed to record order entry:", orderErr);
      }

      return result;
    } catch (err: any) {
      console.warn(`[Auto-Stock] Attempt to update sheet "${sheet.title}" failed:`, err.message);
    }
  }

  return null;
}

