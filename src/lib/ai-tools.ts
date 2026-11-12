// src/lib/ai-tools.ts
import { getDb } from "./db";
import { getValidGoogleToken } from "./google-drive";
import { findProductAndStockCell, parseNumericStock } from "./google-sheets-stock";
import { getSteadfastConfig, getSteadfastStatus } from "./steadfast";
import { BusinessDocument } from "./knowledge";

/**
 * Gemini Tool / Function Declarations Schema for Native Tool Calling
 */
export const GEMINI_TOOL_DECLARATIONS = [
  {
    name: "checkProductStockAndPrice",
    description:
      "Look up real-time inventory stock availability, quantity, and price for a product or item in the merchant's store.",
    parameters: {
      type: "OBJECT",
      properties: {
        productName: {
          type: "STRING",
          description:
            "The specific product or dress name/keyword to search for (e.g., 'Red Silk Dress', 'Cotton Panjabi', 'T-Shirt', 'Floral Kurti').",
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

  // 1. Try finding a connected Google Sheet first
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

  if (sheets.length > 0) {
    for (const sheet of sheets) {
      const spreadsheetId = sheet.metadata?.googleFileId;
      if (!spreadsheetId) continue;

      try {
        const token = await getValidGoogleToken(userId);
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

        const match = findProductAndStockCell(rows, productName);
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

  // 2. Fallback: Search knowledge documents for product name mentions
  const docQuery: any = {
    userId,
    $text: { $search: productName },
  };

  try {
    const textMatches = await db
      .collection<BusinessDocument>("business_knowledge")
      .find(docQuery)
      .limit(2)
      .toArray();

    if (textMatches.length > 0) {
      return {
        found: true,
        productName,
        details: textMatches.map((d) => d.summary || d.content.slice(0, 300)).join("\n"),
        source: "documents",
        message: `Found information in store documents matching "${productName}".`,
      };
    }
  } catch {
    // Ignore text search index error if not configured
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

