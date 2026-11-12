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
 * Extract quantity from text handling Bengali and English numbers
 */
export function extractQuantity(text: string): number | null {
  if (!text) return null;
  const bengaliMap: Record<string, string> = {
    "০": "0", "১": "1", "২": "2", "৩": "3", "৪": "4",
    "৫": "5", "৬": "6", "৭": "7", "৮": "8", "৯": "9",
  };
  const normalized = text.replace(/[০-৯]/g, (d) => bengaliMap[d] || d);

  // Match: 3 ta, 3ta, 3 pcs, 3 pieces, 3টি, 3টা, 3 টি অর্ডার, 3টা অর্ডার
  const match = normalized.match(/(\d+)\s*(?:ta|টি|টা|pcs|pieces|items?|পিস|টি\s*অর্ডার|টা\s*অর্ডার)/i);
  if (match) {
    const val = parseInt(match[1], 10);
    if (val > 0) return val;
  }
  return null;
}

/**
 * Extract Bangladeshi mobile phone numbers from text
 */
export function extractBangladeshiPhone(text: string): string | null {
  if (!text) return null;
  const match = text.match(/(?:\+?88\s*)?(01[3-9]\d{2}[\s\-]?\d{6})/);
  if (match) {
    return match[1].replace(/[\s\-]/g, "");
  }
  return null;
}

/**
 * Extract delivery address from customer messages in conversation history
 */
export function extractAddressFromHistory(
  customerMessage: string,
  history: Array<{ senderType: string; text: string }> = [],
): string | null {
  const customerTexts = [
    customerMessage,
    ...history.filter((h) => h.senderType === "customer").map((h) => h.text).reverse(),
  ];

  for (const text of customerTexts) {
    const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
    for (const line of lines) {
      // Skip lines that are phone numbers only
      if (/^(\+?88)?01[3-9]\d{8}$/.test(line.replace(/\s+/g, ""))) continue;

      // Check for common district / city / location keywords in BD
      const hasLocationKeyword =
        /(?:sadar|সদর|dhaka|ঢাকা|chittagong|চট্টগ্রাম|jhenaidah|ঝিনাইদহ|road|রোড|house|বাড়ি|বাড়ি|sector|সেক্টর|block|ব্লক|thana|থানা|dist|জেলা|bazar|বাজার|goli|গলি|holding|হোল্ডিং|flat|ফ্ল্যাট|ward|ওয়ার্ড|village|গ্রাম|sylhet|সিলেট|khulna|খুলনা|rajshahi|রাজশাহী|barishal|বরিশাল|rangpur|রংপুর|mymensingh|ময়মনসিংহ|comilla|কুমিল্লা|gazipur|গাজীপুর|narayanganj|নারায়ণগঞ্জ)/i.test(
          line,
        );

      if (hasLocationKeyword) {
        return line.replace(/(?:\+?88)?01[3-9]\d{8}/g, "").replace(/^[,\s\-]+|[,\s\-]+$/g, "").trim();
      }
    }
  }

  // Second pass: line with comma and length > 8
  for (const text of customerTexts) {
    const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
    for (const line of lines) {
      if (/^(\+?88)?01[3-9]\d{8}$/.test(line.replace(/\s+/g, ""))) continue;
      if (
        line.includes(",") &&
        line.length > 8 &&
        !/(?:price|koto|dam|stock|ache|confirm|hello|hi|order|অর্ডার|কনফার্ম)/i.test(line)
      ) {
        return line.replace(/(?:\+?88)?01[3-9]\d{8}/g, "").replace(/^[,\s\-]+|[,\s\-]+$/g, "").trim();
      }
    }
  }

  return null;
}

const BILINGUAL_SYNONYMS: Record<string, string[]> = {
  saree: ["শাড়ি", "শাড়ী", "সাড়ি", "সাড়ী", "saree", "sari", "sharee"],
  jamdani: ["জামদানি", "জামদানী", "jamdani"],
  kurti: ["কুর্তি", "কুরতি", "kurti", "kurta"],
  panjabi: ["পাঞ্জাবি", "পাঞ্জাবী", "panjabi", "punjabi"],
  dress: ["ড্রেস", "ম্যাক্সি", "maxi", "dress"],
  cotton: ["কটন", "সুতি", "cotton"],
  silk: ["সিল্ক", "রেশম", "silk"],
  tshirt: ["টিশার্ট", "টি-শার্ট", "tshirt", "t-shirt"],
  hoodie: ["হুডি", "hoodie"],
  wallet: ["ওয়ালেট", "ওয়ালেট", "মানিব্যাগ", "wallet"],
  kabli: ["কাবলি", "kabli"],
  pajama: ["পায়জামা", "পায়জামা", "পাজামা", "pajama", "pyjama"],
};

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

  // Extract parenthesized name if present (e.g. "Premium Jamdani Saree" from "প্রিমিয়াম জামদানি শাড়ি (Premium Jamdani Saree)")
  const parenMatch = targetProductName.match(/\(([A-Za-z0-9\s\-_&]{3,50})\)/);
  const preferredName = parenMatch ? parenMatch[1].trim() : targetProductName;

  const cleanTarget = targetProductName.toLowerCase().replace(/[^\w\u0980-\u09FF]/g, " ").trim();
  const cleanPreferred = preferredName.toLowerCase().replace(/[^\w\u0980-\u09FF]/g, " ").trim();

  const STOP_WORDS = new Set([
    "ta", "টা", "টি", "pcs", "piece", "pieces", "order", "confirm", "confirmed",
    "অর্ডার", "কনফার্ম", "size", "সাইজ", "item", "items", "ti", "the", "a", "an",
    "৩টি", "3টি", "3টা", "3ta", "১টি", "২টি", "৪টি", "৫টি", "1", "2", "3", "4", "5"
  ]);

  const targetWords = cleanTarget.split(/\s+/).filter((w) => Boolean(w) && !STOP_WORDS.has(w) && !/^\d+$/.test(w));
  const effectiveWords = targetWords.length > 0 ? targetWords : cleanTarget.split(/\s+/).filter(Boolean);

  // Expand target words with bilingual synonyms
  const expandedSet = new Set<string>(effectiveWords);
  for (const word of effectiveWords) {
    for (const [key, synonyms] of Object.entries(BILINGUAL_SYNONYMS)) {
      if (synonyms.some((s) => s.includes(word) || word.includes(s))) {
        synonyms.forEach((syn) => expandedSet.add(syn.toLowerCase()));
        expandedSet.add(key.toLowerCase());
      }
    }
  }
  const expandedTargetWords = Array.from(expandedSet);

  let bestMatchRow = -1;
  let bestScore = 0;

  for (let r = 1; r < rows.length; r++) {
    const row = rows[r];
    const rawCell = String(row[productColIndex] || "").trim();
    const cellProduct = rawCell.toLowerCase().replace(/[^\w\u0980-\u09FF]/g, " ").trim();
    if (!cellProduct) continue;

    // 1. Exact match with preferred name or full target
    if (cellProduct === cleanPreferred || cellProduct === cleanTarget) {
      bestMatchRow = r;
      bestScore = 1000;
      break;
    }

    // 2. Substring match
    if (cellProduct.includes(cleanPreferred) || cleanPreferred.includes(cellProduct)) {
      const score = 500 + Math.min(cellProduct.length, cleanPreferred.length);
      if (score > bestScore) {
        bestScore = score;
        bestMatchRow = r;
      }
      continue;
    }

    if (cellProduct.includes(cleanTarget) || cleanTarget.includes(cellProduct)) {
      const score = 400 + Math.min(cellProduct.length, cleanTarget.length);
      if (score > bestScore) {
        bestScore = score;
        bestMatchRow = r;
      }
      continue;
    }

    // 3. Keyword & synonym match
    const matchingWords = expandedTargetWords.filter((w) => cellProduct.includes(w));
    if (matchingWords.length > 0) {
      const score = (matchingWords.length / Math.max(1, effectiveWords.length)) * 100;
      if (score > bestScore) {
        bestScore = score;
        bestMatchRow = r;
      }
    }
  }

  if (bestMatchRow === -1 || bestScore < 10) return null;

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
      "metadata.googleFileId": spreadsheetId,
    });
    if (doc?._id) {
      await syncGoogleDocument(doc._id.toString(), doc.userId || userId);
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
 * Analyze a customer conversation with Gemini and deterministic checks to detect if an order has been confirmed
 */
export async function detectOrderConfirmationWithAI(options: {
  customerMessage: string;
  aiReply: string;
  conversationHistory?: Array<{ senderType: string; text: string }>;
}): Promise<DetectedOrder> {
  const { customerMessage, aiReply, conversationHistory = [] } = options;

  let detected: DetectedOrder = { isOrderConfirmed: false };
  const apiKey = process.env.GEMINI_API_KEY;

  if (apiKey) {
    const prompt = `Analyze this e-commerce customer support chat on Facebook Messenger.
Determine if the customer has confirmed or agreed to place an order, or if the bot has confirmed an order for them.

Recent Chat History:
${conversationHistory.map((h) => `${h.senderType.toUpperCase()}: ${h.text}`).join("\n")}
CUSTOMER: "${customerMessage}"
AI BOT: "${aiReply}"

Respond strictly with valid JSON:
{
  "isOrderConfirmed": true | false,
  "productName": "canonical product name or item ordered (prefer official English name like 'Premium Jamdani Saree' if mentioned in chat or in parentheses)",
  "quantity": number,
  "customerName": "customer name if provided",
  "customerPhone": "customer phone/mobile number (scan recent chat history and message)",
  "deliveryAddress": "delivery address or area (scan recent chat history and message)",
  "confidence": 0.0 to 1.0
}

Rules:
1. Set isOrderConfirmed to true if:
   - The customer confirmed the purchase (e.g. '3 ta order confirm', 'Saree ta confirm korun', 'confirm', 'অর্ডার কনফার্ম', 'বুক করুন', 'পাঠিয়ে দিন').
   - OR the AI Bot acknowledged/announced that the order is confirmed (e.g. 'সফলভাবে কনফার্ম করা হয়েছে', 'order is confirmed').
   - Even if the bot subsequently asked to re-confirm phone/address, if the customer requested confirmation or the bot stated it was confirmed, set isOrderConfirmed: true!
2. Do NOT set isOrderConfirmed to true if the customer is only asking about price, stock availability, or colors without indicating they want to buy/confirm.
3. Quantity: Extract the exact quantity (e.g. '3 ta order confirm' or '৩টি অর্ডার' means quantity = 3). Default to 1 if not specified.
4. Product Name: If the customer just says '3 ta order confirm' or 'confirm it', extract the product name being discussed from the AI Bot reply or previous history (e.g. 'Premium Jamdani Saree').
5. Phone & Address: Extract from any previous turn in the chat history if present (e.g. '01886092236', 'Jhenaidah Sadar, Jhenaidah').`;

    const models = ["gemini-flash-lite-latest", "gemini-flash-latest", "gemini-2.5-flash"];

    for (const model of models) {
      try {
        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
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
            const cleanedText = rawText.replace(/```(?:json)?/gi, "").replace(/```/g, "").trim();
            const parsed = JSON.parse(cleanedText);
            detected = {
              isOrderConfirmed: Boolean(parsed.isOrderConfirmed),
              productName: parsed.productName || undefined,
              quantity: typeof parsed.quantity === "number" ? parsed.quantity : 1,
              customerName: parsed.customerName || undefined,
              customerPhone: parsed.customerPhone || undefined,
              deliveryAddress: parsed.deliveryAddress || undefined,
              confidence: parsed.confidence || 0.8,
            };
            break;
          }
        }
      } catch (err) {
        console.warn(`Order detection analysis with ${model} warning:`, err);
      }
    }
  }

  // Deterministic refinements & fallbacks to guarantee no order is missed:
  // 1. Quantity extraction
  const qtyCustomer = extractQuantity(customerMessage);
  const qtyBot = extractQuantity(aiReply);
  if (qtyCustomer && qtyCustomer > 0) {
    detected.quantity = qtyCustomer;
  } else if ((!detected.quantity || detected.quantity <= 1) && qtyBot && qtyBot > 0) {
    detected.quantity = qtyBot;
  }
  if (!detected.quantity || detected.quantity < 1) {
    detected.quantity = 1;
  }

  // 2. Phone extraction
  if (!detected.customerPhone) {
    const phoneInMsg = extractBangladeshiPhone(customerMessage);
    if (phoneInMsg) {
      detected.customerPhone = phoneInMsg;
    } else {
      for (let i = conversationHistory.length - 1; i >= 0; i--) {
        const phone = extractBangladeshiPhone(conversationHistory[i].text);
        if (phone) {
          detected.customerPhone = phone;
          break;
        }
      }
    }
  }

  // 3. Address extraction
  if (!detected.deliveryAddress) {
    detected.deliveryAddress =
      extractAddressFromHistory(customerMessage, conversationHistory) || undefined;
  }

  // 4. Product Name extraction from parentheses in AI reply or history
  if (!detected.productName || detected.productName.length < 3) {
    const parenMatch = aiReply.match(/\(([A-Za-z0-9\s\-_&]{3,40})\)/);
    if (parenMatch) {
      detected.productName = parenMatch[1].trim();
    } else {
      for (let i = conversationHistory.length - 1; i >= 0; i--) {
        const histParen = conversationHistory[i].text.match(/\(([A-Za-z0-9\s\-_&]{3,40})\)/);
        if (histParen) {
          detected.productName = histParen[1].trim();
          break;
        }
      }
    }
  }

  // 5. Confirmation signal check:
  const hasConfirmationSignal =
    /(?:confirm|কনফার্ম|অর্ডার|order|বুক|book|নিতে চাই|কিনতে চাই|পাঠিয়ে দিন|পাঠান)/i.test(customerMessage) ||
    /(?:সফলভাবে\s*কনফার্ম|কনফার্ম\s*করা\s*হয়েছে|অর্ডারটি\s*সফলভাবে|order\s*(?:has\s*been\s*)?confirmed)/i.test(aiReply);

  if (hasConfirmationSignal && detected.productName) {
    detected.isOrderConfirmed = true;
  }

  return detected;
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

  const finalCustomerName = customerName || detected.customerName || "Customer";
  const finalQuantity = detected.quantity || 1;

  console.log(
    `[Auto-Stock] Order confirmed for "${detected.productName}" (Qty: ${finalQuantity}) by customer "${finalCustomerName}" (Phone: ${detected.customerPhone || "N/A"})`,
  );

  // 2. ALWAYS RECORD ORDER IN MONGODB FIRST!
  const db = getDb();
  let orderId: ObjectId | null = null;
  try {
    const insertRes = await db.collection("orders").insertOne({
      userId,
      pageId: pageId || null,
      customerName: finalCustomerName,
      customerPhone: detected.customerPhone || null,
      deliveryAddress: detected.deliveryAddress || null,
      senderPsid: senderPsid || null,
      productName: detected.productName,
      quantity: finalQuantity,
      status: "confirmed",
      stockDecremented: false,
      stockDeductionMessage: "Pending Google Sheet stock deduction",
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    orderId = insertRes.insertedId;
    console.log(`[Auto-Stock] Successfully recorded Order #${orderId.toString()} in MongoDB orders collection.`);
  } catch (orderInsertErr) {
    console.error("[Auto-Stock] Failed to record order in MongoDB:", orderInsertErr);
  }

  // 3. Find connected Google Sheets for this user/page
  const sheetConditions: any[] = [
    {
      $or: [
        { fileType: "sheet" },
        { fileType: "csv" },
        { "metadata.source": "google_sheets" },
      ],
    },
    { "metadata.googleFileId": { $exists: true, $ne: "" } },
  ];

  if (userId && userId !== "all") {
    sheetConditions.push({
      $or: [
        { userId },
        { userId: "default" },
        { userId: { $exists: false } },
        { userId: null },
      ],
    });
  }

  if (pageId && pageId !== "all") {
    sheetConditions.push({
      $or: [{ pageId }, { pageId: null }, { pageId: { $exists: false } }],
    });
  }

  const sheetQuery = sheetConditions.length > 1 ? { $and: sheetConditions } : sheetConditions[0];

  const sheets = await db
    .collection<BusinessDocument>("business_knowledge")
    .find(sheetQuery)
    .sort({ updatedAt: -1 })
    .toArray();

  if (sheets.length === 0) {
    console.warn(
      `[Auto-Stock] No connected Google Sheets found for user "${userId}". Order #${orderId?.toString()} preserved in database.`,
    );
    if (orderId) {
      try {
        await db.collection("orders").updateOne(
          { _id: orderId },
          {
            $set: {
              stockDeductionMessage: "No connected Google Sheet found to deduct stock.",
              updatedAt: new Date(),
            },
          },
        );
      } catch (e) {
        // ignore
      }
    }
    return null;
  }

  // 4. Attempt stock decrement in Google Sheet
  let lastErrorMessage = "";
  for (const sheet of sheets) {
    const spreadsheetId = sheet.metadata?.googleFileId;
    if (!spreadsheetId) continue;

    try {
      const sheetUserId = sheet.userId || userId;
      const result = await decrementGoogleSheetStock(
        sheetUserId,
        spreadsheetId,
        detected.productName,
        finalQuantity,
      );

      console.log(`[Auto-Stock] Google Sheet update successful: ${result.message}`);

      // Update MongoDB order record with sheet deduction details
      if (orderId) {
        try {
          await db.collection("orders").updateOne(
            { _id: orderId },
            {
              $set: {
                stockDecremented: true,
                spreadsheetId,
                sheetName: result.sheetName,
                stockCell: `${result.stockColumn}${result.matchedRow}`,
                previousStock: result.previousStock,
                newStock: result.newStock,
                stockDeductionMessage: result.message,
                updatedAt: new Date(),
              },
            },
          );
        } catch (updateErr) {
          console.warn("[Auto-Stock] Failed to update order with stock cell details:", updateErr);
        }
      }

      return result;
    } catch (err: any) {
      lastErrorMessage = err.message || String(err);
      console.warn(`[Auto-Stock] Attempt to update sheet "${sheet.title}" failed:`, lastErrorMessage);
    }
  }

  // If no sheet successfully updated
  if (orderId) {
    try {
      await db.collection("orders").updateOne(
        { _id: orderId },
        {
          $set: {
            stockDecremented: false,
            stockDeductionMessage: `Failed to deduct stock in sheet: ${lastErrorMessage}`,
            updatedAt: new Date(),
          },
        },
      );
    } catch (finalErr) {
      console.warn("[Auto-Stock] Failed to update order with error status:", finalErr);
    }
  }

  return null;
}
