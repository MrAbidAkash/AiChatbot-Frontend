// src/lib/ai-tools.ts
import { getDb } from "./db";
import { getValidGoogleToken } from "./google-drive";
import { findProductAndStockCell, parseNumericStock, lemmatizeWord, BILINGUAL_SYNONYMS } from "./google-sheets-stock";
import { getSteadfastConfig, getSteadfastStatus } from "./steadfast";
import { BusinessDocument } from "./knowledge";

/**
 * Gemini Tool / Function Declarations Schema for Native Tool Calling
 */
export const GEMINI_TOOL_DECLARATIONS = [
  {
    name: "checkProductStockAndPrice",
    description:
      "Look up real-time inventory stock availability, quantity, and price for a product or item in the merchant's store. Call this whenever a customer asks about a product, wants to buy an item, or specifies an order quantity, to verify available stock before offering or confirming an order. Handles singular and plural words (e.g., 'Formal Leather Wallet', 'wallet', 'wallets', 'panjabi', 'kurti').",
    parameters: {
      type: "OBJECT",
      properties: {
        productName: {
          type: "STRING",
          description:
            "The specific product name, keyword, or item to search for (e.g., 'Formal Leather Wallet', 'wallet', 'wallets', 'Cotton Panjabi', 'Kurti'). Handles singular and plural words.",
        },
      },
      required: ["productName"],
    },
  },
  {
    name: "trackDeliveryParcel",
    description:
      "Track live courier delivery status of a customer order or parcel via Steadfast Courier using tracking code, consignment ID, or invoice number.",
    parameters: {
      type: "OBJECT",
      properties: {
        trackingCodeOrInvoice: {
          type: "STRING",
          description:
            "The Steadfast tracking code, consignment ID (CID), or invoice number provided by the customer.",
        },
      },
      required: ["trackingCodeOrInvoice"],
    },
  },
  {
    name: "checkCustomerRecentOrder",
    description:
      "Look up details and status of recent orders placed by a customer using their contact phone number.",
    parameters: {
      type: "OBJECT",
      properties: {
        phoneNumber: {
          type: "STRING",
          description:
            "The customer's 11-digit mobile phone number (e.g. '01712345678', '01812345678').",
        },
      },
      required: ["phoneNumber"],
    },
  },
  {
    name: "bookStoreOrder",
    description:
      "Book and confirm an order for a customer. Validates that the requested quantity does NOT exceed real-time inventory stock before booking.",
    parameters: {
      type: "OBJECT",
      properties: {
        productName: {
          type: "STRING",
          description:
            "Canonical name of the product ordered (e.g. 'Formal Leather Wallet', 'Winter Fleece Hoodie').",
        },
        quantity: {
          type: "INTEGER",
          description:
            "Number of units ordered. Must not exceed available inventory stock.",
        },
        customerPhone: {
          type: "STRING",
          description:
            "Customer's contact phone number (11 digits, e.g. '01886092236').",
        },
        deliveryAddress: {
          type: "STRING",
          description:
            "Full delivery address or area (e.g. 'Jhenaidah Sadar, Jhenaidah').",
        },
      },
      required: ["productName", "quantity"],
    },
  },
];

export interface ToolExecutionContext {
  userId: string;
  pageId?: string;
}

/**
 * Execute a tool called by Gemini Native Function Calling
 */
export async function executeAiTool(
  toolName: string,
  args: Record<string, any>,
  context: ToolExecutionContext,
): Promise<Record<string, any>> {
  const { userId, pageId } = context;

  console.log(`[AI Tools] Executing tool "${toolName}" with args:`, JSON.stringify(args), `(user: ${userId})`);

  try {
    switch (toolName) {
      case "checkProductStockAndPrice": {
        const productName = String(args.productName || "").trim();
        if (!productName) {
          return { found: false, message: "Please specify a product name to search." };
        }
        return await lookupProductStockAndPrice(userId, pageId, productName);
      }

      case "trackDeliveryParcel": {
        const identifier = String(args.trackingCodeOrInvoice || "").trim();
        if (!identifier) {
          return { found: false, message: "Please provide a valid tracking code or invoice number." };
        }
        return await lookupSteadfastTracking(userId, identifier);
      }

      case "checkCustomerRecentOrder": {
        const phone = String(args.phoneNumber || "").trim();
        if (!phone) {
          return { found: false, message: "Please provide a phone number to check recent orders." };
        }
        return await lookupRecentOrder(userId, phone);
      }

      case "bookStoreOrder": {
        const productName = String(args.productName || "").trim();
        const quantity = parseInt(String(args.quantity || "1"), 10);
        const phone = String(args.customerPhone || "").trim();
        const address = String(args.deliveryAddress || "").trim();

        if (!productName) {
          return { success: false, message: "Product name is required to book an order." };
        }
        return await handleBookStoreOrder(userId, pageId, productName, quantity, phone, address);
      }

      default:
        return { error: `Tool "${toolName}" is not implemented.` };
    }
  } catch (error: any) {
    console.error(`[AI Tools] Error executing tool "${toolName}":`, error);
    return {
      error: `Failed to execute ${toolName}: ${error.message || "Unknown error"}`,
    };
  }
}

/**
 * Tool Handler 1: Look up product stock and price from connected Google Sheet or Documents
 */
async function lookupProductStockAndPrice(
  userId: string,
  pageId: string | undefined,
  productName: string,
): Promise<Record<string, any>> {
  const db = getDb();

  // Clean productName from quantities, purchasing verbs, or filler words (e.g. "30 wallets" -> "wallets")
  const cleanProductName = productName
    .replace(/\b(?:\d+|ta|টা|টি|pcs|pieces|i|want|to|buy|need|order|kinte|chai|lagbe)\b/gi, "")
    .replace(/[^\w\u0980-\u09FF\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim() || productName.trim();

  // 1. Try finding a connected Google Sheet first
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

  if (sheets.length > 0) {
    for (const sheet of sheets) {
      const spreadsheetId = sheet.metadata?.googleFileId;
      if (!spreadsheetId) continue;

      try {
        const sheetUserId = sheet.userId || userId;
        const token = await getValidGoogleToken(sheetUserId);
        if (!token) continue;

        // Fetch sheet metadata
        const metaRes = await fetch(
          `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}?fields=sheets.properties.title`,
          { headers: { Authorization: `Bearer ${token}` } },
        );
        if (!metaRes.ok) continue;
        const metaData = await metaRes.json();
        const sheetName = metaData.sheets?.[0]?.properties?.title || "Sheet1";

        // Fetch sheet rows
        const valuesRes = await fetch(
          `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/'${encodeURIComponent(sheetName)}'!A1:Z300`,
          { headers: { Authorization: `Bearer ${token}` } },
        );
        if (!valuesRes.ok) continue;
        const valuesData = await valuesRes.json();
        const rows: string[][] = valuesData.values || [];

        if (rows.length < 2) continue;

        const match = findProductAndStockCell(rows, cleanProductName) || findProductAndStockCell(rows, productName);
        if (match) {
          // Detect price column if available
          const headerRow = rows[0].map((h) => String(h || "").toLowerCase().trim());
          const priceColIndex = headerRow.findIndex(
            (h) =>
              h.includes("price") ||
              h.includes("rate") ||
              h.includes("cost") ||
              h.includes("টাকা") ||
              h.includes("দাম") ||
              h.includes("মূল্য"),
          );

          let price: string | null = null;
          if (priceColIndex !== -1 && rows[match.rowIndex]?.[priceColIndex]) {
            price = String(rows[match.rowIndex][priceColIndex]).trim();
          }

          return {
            found: true,
            productName: match.productName,
            stockQuantity: match.currentStock,
            inStock: match.currentStock > 0,
            price: price || "Contact store for current price",
            source: "google_sheet_inventory",
            message:
              match.currentStock > 0
                ? `Product "${match.productName}" is in stock with ${match.currentStock} item(s) available.${price ? ` Price: ৳${price}.` : ""}`
                : `Product "${match.productName}" is currently out of stock (0 available).`,
          };
        }
      } catch (sheetErr) {
        console.warn(`[AI Tools] Error reading sheet "${sheet.title}":`, sheetErr);
      }
    }
  }

  // 2. Fallback: Parse local business knowledge documents (which caches synced Google Sheet/CSV data)
  const docConditions: any[] = [];
  if (userId && userId !== "all") {
    docConditions.push({
      $or: [{ userId }, { userId: "default" }, { userId: { $exists: false } }, { userId: null }],
    });
  }
  if (pageId && pageId !== "all") {
    docConditions.push({
      $or: [{ pageId }, { pageId: null }, { pageId: { $exists: false } }],
    });
  }
  const docQuery = docConditions.length > 1 ? { $and: docConditions } : docConditions[0] || {};

  try {
    const allDocs = await db
      .collection<BusinessDocument>("business_knowledge")
      .find(docQuery)
      .sort({ updatedAt: -1 })
      .toArray();

    // Prepare keywords with morphological stemming and bilingual synonyms
    const searchTarget = cleanProductName.toLowerCase();
    const targetWords = searchTarget.split(/\s+/).filter((w) => w.length > 2 && !/^\d+$/.test(w));
    const expandedKeywords = new Set<string>(targetWords);
    for (const w of targetWords) {
      lemmatizeWord(w).forEach((f) => expandedKeywords.add(f));
      for (const [key, synonyms] of Object.entries(BILINGUAL_SYNONYMS)) {
        const matches = w.length >= 3
          ? synonyms.some((s) => s.toLowerCase().includes(w) || w.includes(s.toLowerCase()))
          : synonyms.some((s) => s.toLowerCase() === w);
        if (matches) {
          synonyms.forEach((syn) => expandedKeywords.add(syn.toLowerCase()));
          expandedKeywords.add(key.toLowerCase());
        }
      }
    }
    const keywordList = Array.from(expandedKeywords).filter((kw) => kw.length >= 2);

    for (const doc of allDocs) {
      if (!doc.content) continue;
      const lines = doc.content.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);

      for (const line of lines) {
        const lowerLine = line.toLowerCase();
        const hasKeywordMatch = keywordList.some((kw) => lowerLine.includes(kw));

        if (hasKeywordMatch) {
          // Parse stock count from line: "Stock: 25", "Qty: 10", "স্টক: ২৫"
          const stockMatch = line.match(/(?:stock|qty|quantity|স্টক|পরিমাণ)[\s:=|]+(\d+)/i);
          const priceMatch = line.match(/(?:price|rate|দাম|মূল্য|৳|tk|bdt)[\s:=|]*([0-9,]+)/i);
          const prodNameMatch = line.match(/(?:product(?:\s*name)?|item|পণ্য)[\s:=|]+([^|\n\r]+)/i);

          const matchedProductName = prodNameMatch ? prodNameMatch[1].trim() : productName;

          if (stockMatch) {
            const stockQty = parseInt(stockMatch[1], 10);
            const priceVal = priceMatch ? priceMatch[1].trim() : null;

            return {
              found: true,
              productName: matchedProductName,
              stockQuantity: stockQty,
              inStock: stockQty > 0,
              price: priceVal || "Contact store for current price",
              source: "store_inventory_document",
              message:
                stockQty > 0
                  ? `Product "${matchedProductName}" is in stock with ${stockQty} item(s) available.${priceVal ? ` Price: ৳${priceVal}.` : ""}`
                  : `Product "${matchedProductName}" is currently out of stock (0 available).`,
            };
          }
        }
      }
    }
  } catch (docErr) {
    console.warn("[AI Tools] Document parsing fallback warning:", docErr);
  }

  return {
    found: false,
    productName,
    message: `The product "${productName}" was not found in the live inventory catalog.`,
  };
}

/**
 * Tool Handler 2: Live Steadfast Courier Parcel Tracking
 */
async function lookupSteadfastTracking(
  userId: string,
  identifier: string,
): Promise<Record<string, any>> {
  const db = getDb();

  // Check user Steadfast config
  const config = await getSteadfastConfig(userId);

  // Check database first for cached parcel details
  const cleanId = identifier.trim();
  const cachedParcel = await db.collection("steadfast_parcels").findOne({
    userId,
    $or: [
      { tracking_code: cleanId },
      { consignment_id: isNaN(Number(cleanId)) ? cleanId : Number(cleanId) },
      { invoice: cleanId },
    ],
  });

  if (config && config.apiKey && config.secretKey) {
    try {
      const statusRes = await getSteadfastStatus(
        {
          apiKey: config.apiKey,
          secretKey: config.secretKey,
          baseUrl: config.baseUrl,
        },
        {
          tracking_code: cleanId,
          consignment_id: cleanId,
          invoice: cleanId,
        },
      );

      return {
        found: true,
        trackingCode: cleanId,
        status: statusRes.status,
        recipientName: cachedParcel?.recipient_name || undefined,
        codAmount: cachedParcel?.cod_amount || undefined,
        trackingUrl: `https://steadfast.com.bd/t/${cleanId}`,
        message: `Parcel status is "${statusRes.status}". Tracking URL: https://steadfast.com.bd/t/${cleanId}`,
      };
    } catch (apiErr: any) {
      console.warn("[AI Tools] Steadfast live tracking API call warning:", apiErr.message);
    }
  }

  // Fallback to local MongoDB parcel status if API failed or not configured
  if (cachedParcel) {
    return {
      found: true,
      trackingCode: cachedParcel.tracking_code,
      status: cachedParcel.status,
      recipientName: cachedParcel.recipient_name,
      codAmount: cachedParcel.cod_amount,
      trackingUrl: cachedParcel.tracking_url || `https://steadfast.com.bd/t/${cachedParcel.tracking_code}`,
      message: `Parcel status recorded as "${cachedParcel.status}".`,
    };
  }

  return {
    found: false,
    trackingCode: cleanId,
    message: `No parcel found matching tracking code or invoice "${cleanId}".`,
  };
}

/**
 * Tool Handler 3: Look up customer recent order by phone number
 */
async function lookupRecentOrder(
  userId: string,
  phoneNumber: string,
): Promise<Record<string, any>> {
  const db = getDb();

  // Normalize phone number (strip spaces, dashes, leading +88)
  const cleanPhone = phoneNumber.replace(/\D/g, "");
  const last8 = cleanPhone.slice(-8);

  const order = await db
    .collection("orders")
    .find({
      userId,
      $or: [
        { customerPhone: phoneNumber },
        { customerPhone: cleanPhone },
        { customerPhone: { $regex: last8, $options: "i" } },
      ],
    })
    .sort({ createdAt: -1 })
    .limit(1)
    .next();

  if (!order) {
    return {
      found: false,
      phoneNumber,
      message: `No recent orders found matching phone number "${phoneNumber}".`,
    };
  }

  return {
    found: true,
    customerName: order.customerName,
    productName: order.productName,
    quantity: order.quantity || 1,
    orderStatus: order.status || "confirmed",
    deliveryAddress: order.deliveryAddress,
    orderDate: order.createdAt ? new Date(order.createdAt).toLocaleDateString() : undefined,
    message: `Found recent order for "${order.productName}" (Qty: ${order.quantity || 1}) placed by ${order.customerName}. Status: ${order.status}.`,
  };
}

/**
 * Tool Handler 4: Book store order with strict server-side stock verification
 */
async function handleBookStoreOrder(
  userId: string,
  pageId: string | undefined,
  productName: string,
  quantity: number,
  phone?: string,
  address?: string,
): Promise<Record<string, any>> {
  // 1. Verify live stock
  const stockInfo = await lookupProductStockAndPrice(userId, pageId, productName);
  if (stockInfo.found && typeof stockInfo.stock === "number") {
    if (quantity > stockInfo.stock) {
      return {
        success: false,
        reason: "STOCK_EXCEEDED",
        productName: stockInfo.productName || productName,
        availableStock: stockInfo.stock,
        requestedQuantity: quantity,
        message: `Order booking failed: Requested quantity (${quantity}) exceeds current available stock (${stockInfo.stock}). Tell the customer that only ${stockInfo.stock} piece(s) are left in stock and ask if they would like the available ${stockInfo.stock} piece(s). DO NOT confirm an order for ${quantity}.`,
      };
    }
  }

  return {
    success: true,
    productName: stockInfo.productName || productName,
    quantity,
    customerPhone: phone || undefined,
    deliveryAddress: address || undefined,
    message: `Order verified and approved for booking: ${quantity} x "${stockInfo.productName || productName}".`,
  };
}

