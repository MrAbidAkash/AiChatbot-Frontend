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
  {
    name: "calculateDeliveryCharge",
    description:
      "Calculate shipping delivery charge and estimated delivery days for a customer's address or district in Bangladesh (Inside Dhaka ৳80, Sub-Dhaka ৳100, Outside Dhaka ৳150) and compute total payable Cash on Delivery (COD) amount.",
    parameters: {
      type: "OBJECT",
      properties: {
        deliveryAddressOrDistrict: {
          type: "STRING",
          description:
            "Customer delivery address, district, or area (e.g. 'Dhaka Dhanmondi', 'Jhenaidah Sadar', 'Chittagong', 'Gazipur', 'Sylhet').",
        },
        orderSubtotal: {
          type: "NUMBER",
          description: "Subtotal amount of products ordered in BDT.",
        },
      },
      required: ["deliveryAddressOrDistrict"],
    },
  },
  {
    name: "recommendProductSize",
    description:
      "Recommend the optimal product size (S, M, L, XL, XXL) based on customer height, weight, and garment type (Panjabi, Hoodie, T-Shirt, Kurti).",
    parameters: {
      type: "OBJECT",
      properties: {
        height: {
          type: "STRING",
          description:
            "Customer's height in feet/inches or cm (e.g. '5 feet 8 inch', '5\\'8\"', '172 cm').",
        },
        weightKg: {
          type: "NUMBER",
          description: "Customer body weight in kilograms (e.g. 68, 72, 80).",
        },
        garmentType: {
          type: "STRING",
          description:
            "Type of clothing item (e.g. 'panjabi', 'hoodie', 'tshirt', 'kurti').",
        },
      },
      required: ["weightKg"],
    },
  },
  {
    name: "applyCouponDiscount",
    description:
      "Validate and apply promotional discount coupon code (e.g. 'WELCOME10', 'EID50', 'SAVE100', 'FREEDEL') to calculate discounts on customer orders.",
    parameters: {
      type: "OBJECT",
      properties: {
        couponCode: {
          type: "STRING",
          description:
            "The promotional code provided by the customer (e.g. 'WELCOME10', 'SAVE100').",
        },
        orderSubtotal: {
          type: "NUMBER",
          description: "Total order subtotal amount in BDT before discount.",
        },
      },
      required: ["couponCode", "orderSubtotal"],
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

      case "calculateDeliveryCharge": {
        const address = String(args.deliveryAddressOrDistrict || "").trim();
        const subtotal = typeof args.orderSubtotal === "number" ? args.orderSubtotal : undefined;
        return handleCalculateDeliveryCharge(address, subtotal);
      }

      case "recommendProductSize": {
        const height = String(args.height || "").trim();
        const weight = parseFloat(String(args.weightKg || "0"));
        const garmentType = String(args.garmentType || "").trim();
        return handleRecommendProductSize(height, weight, garmentType);
      }

      case "applyCouponDiscount": {
        const code = String(args.couponCode || "").trim();
        const subtotal = parseFloat(String(args.orderSubtotal || "0"));
        return await handleApplyCouponDiscount(userId, code, subtotal);
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

/**
 * Tool Handler 5: Calculate Bangladeshi delivery charge based on district / area
 */
function handleCalculateDeliveryCharge(
  address: string,
  subtotal?: number,
): Record<string, any> {
  const clean = address.toLowerCase();

  const isSubDhaka =
    /(?:savar|সাভার|gazipur|গাজীপুর|keraniganj|কেরানীগঞ্জ|narayanganj|নারায়ণগঞ্জ|tongi|টঙ্গী|dhamrai|ধামরাই)/i.test(
      clean,
    );

  const isDhakaCity =
    !isSubDhaka &&
    /(?:dhanmondi|ধানমন্ডি|mirpur|মিরপুর|gulshan|গুলশান|banani|বনানী|uttara|উত্তরা|motijheel|মতিঝিল|badda|বাড্ডা|rampura|রামপুরা|mohammadpur|মোহাম্মদপুর|khilgaon|খিলগাঁও|jatrabari|যাত্রাবাড়ী|lalbagh|লালবাগ|shahbagh|শাহবাগ|farmgate|ফার্মগেট|dhaka|ঢাকা|dhaka sadar|ঢাকা সদর)/i.test(
      clean,
    );

  let areaType: "dhaka_city" | "sub_dhaka" | "outside_dhaka" = "outside_dhaka";
  let deliveryCharge = 150;
  let estimatedDays = "2-3 business days";
  let areaNameBn = "ঢাকার বাইরে";

  if (isDhakaCity) {
    areaType = "dhaka_city";
    deliveryCharge = 80;
    estimatedDays = "24-48 hours";
    areaNameBn = "ঢাকার ভিতরে";
  } else if (isSubDhaka) {
    areaType = "sub_dhaka";
    deliveryCharge = 100;
    estimatedDays = "48 hours";
    areaNameBn = "ঢাকার উপশহর (সাব-ঢাকা)";
  }

  const totalPayable = subtotal ? subtotal + deliveryCharge : undefined;

  return {
    success: true,
    address,
    areaType,
    areaName: areaNameBn,
    deliveryCharge,
    estimatedDays,
    courier: "Steadfast Courier",
    cashOnDelivery: true,
    orderSubtotal: subtotal,
    totalPayable,
    message: subtotal
      ? `${areaNameBn} ডেলিভারি চার্জ ৳${deliveryCharge}। প্রোডাক্ট মূল্য ৳${subtotal} + ডেলিভারি চার্জ ৳${deliveryCharge} = সর্বমোট প্রদেয় ৳${totalPayable} (ক্যাশ অন ডেলিভারি)। ডেলিভারি সময়: ${estimatedDays}।`
      : `${areaNameBn} ডেলিভারি চার্জ ৳${deliveryCharge}। ডেলিভারি সময়: ${estimatedDays} (স্টেডফাস্ট কুরিয়ারে ক্যাশ অন ডেলিভারি)।`,
  };
}

/**
 * Tool Handler 6: Recommend size based on customer height, weight, and garment type
 */
function handleRecommendProductSize(
  heightStr: string,
  weightKg: number,
  garmentType: string = "",
): Record<string, any> {
  let recommendedSize = "L";
  let chest = '42"';
  let length = '42"';
  let fitNote = "";

  if (weightKg <= 58) {
    recommendedSize = "S";
    chest = '38"';
    length = '40"';
  } else if (weightKg <= 67) {
    recommendedSize = "M";
    chest = '40"';
    length = '41"';
  } else if (weightKg <= 77) {
    recommendedSize = "L";
    chest = '42"';
    length = '42"';
  } else if (weightKg <= 87) {
    recommendedSize = "XL";
    chest = '44"';
    length = '44"';
  } else {
    recommendedSize = "XXL";
    chest = '46"';
    length = '45"';
  }

  const garment = garmentType.toLowerCase();
  if (garment.includes("hoodie") || garment.includes("হুডি")) {
    fitNote = `হুডির জন্য "${recommendedSize}" সাইজটি একটু কমফোর্টেবল ও ট্রেন্ডি ড্রপ লুক দেবে।`;
  } else if (garment.includes("panjabi") || garment.includes("পাঞ্জাবি")) {
    fitNote = `পাঞ্জাবির ক্ষেত্রে "${recommendedSize}" সাইজটি আপনার বডিতে স্ট্যান্ডার্ড স্লিম ফিটে মানাবে (চেস্ট: ${chest}, লেন্থ: ${length})।`;
  } else if (garment.includes("t-shirt") || garment.includes("tshirt") || garment.includes("টি-শার্ট")) {
    fitNote = `টি-শার্টের ক্ষেত্রে "${recommendedSize}" সাইজটি পারফেক্ট ক্যাজুয়াল ফিট হবে।`;
  } else {
    fitNote = `আপনার মেজারমেন্ট অনুযায়ী "${recommendedSize}" সাইজটি সবচেয়ে মানানসই হবে।`;
  }

  return {
    success: true,
    recommendedSize,
    chestMeasurement: chest,
    lengthMeasurement: length,
    customerWeight: `${weightKg} kg`,
    customerHeight: heightStr || "Standard",
    garmentType: garmentType || "General",
    fitNote,
    message: `আপনার জন্য রিকমেন্ডেড সাইজ "${recommendedSize}"। ${fitNote}`,
  };
}

/**
 * Tool Handler 7: Apply promotional discount coupons
 */
async function handleApplyCouponDiscount(
  userId: string,
  couponCode: string,
  orderSubtotal: number,
): Promise<Record<string, any>> {
  const code = couponCode.toUpperCase().trim();
  const db = getDb();

  // 1. Check custom coupons defined in merchant's MongoDB collection
  try {
    const customCoupon = await db.collection("coupons").findOne({
      code,
      $or: [{ userId }, { userId: "default" }, { userId: { $exists: false } }],
      isActive: true,
    });

    if (customCoupon) {
      const minOrder = customCoupon.minOrderAmount || 0;
      if (orderSubtotal < minOrder) {
        return {
          success: false,
          couponCode: code,
          message: `এই কুপনটি ব্যবহার করতে ন্যূনতম ৳${minOrder} টাকার অর্ডার প্রয়োজন। আপনার বর্তমান অর্ডার ৳${orderSubtotal}।`,
        };
      }

      let discountAmount = 0;
      if (customCoupon.discountType === "percentage") {
        discountAmount = Math.round((orderSubtotal * customCoupon.discountValue) / 100);
        if (customCoupon.maxDiscount && discountAmount > customCoupon.maxDiscount) {
          discountAmount = customCoupon.maxDiscount;
        }
      } else {
        discountAmount = customCoupon.discountValue;
      }

      const newTotal = Math.max(0, orderSubtotal - discountAmount);
      return {
        success: true,
        couponCode: code,
        discountAmount,
        orderSubtotal,
        newTotal,
        message: `কুপন "${code}" সফলভাবে অ্যাপ্লাই করা হয়েছে! আপনি ৳${discountAmount} ডিসকাউন্ট পেয়েছেন। ডিসকাউন্টের পর প্রদেয় মূল্য ৳${newTotal}।`,
      };
    }
  } catch (dbErr) {
    console.warn("[AI Tools] Coupon DB lookup warning:", dbErr);
  }

  // 2. Built-in standard promotional codes
  if (code === "WELCOME10") {
    if (orderSubtotal < 800) {
      return {
        success: false,
        couponCode: code,
        message: 'কুপন "WELCOME10" ব্যবহার করতে ন্যূনতম ৳৮০০ টাকার অর্ডার প্রয়োজন।',
      };
    }
    const discountAmount = Math.round(orderSubtotal * 0.1);
    const newTotal = orderSubtotal - discountAmount;
    return {
      success: true,
      couponCode: code,
      discountAmount,
      orderSubtotal,
      newTotal,
      message: `অভিনন্দন! "WELCOME10" কুপনে ১০% ডিসকাউন্ট হিসেবে ৳${discountAmount} ছাড় পেয়েছেন! নতুন প্রদেয় মূল্য: ৳${newTotal}।`,
    };
  }

  if (code === "EID50" || code === "SAVE50") {
    const discountAmount = 50;
    const newTotal = Math.max(0, orderSubtotal - discountAmount);
    return {
      success: true,
      couponCode: code,
      discountAmount,
      orderSubtotal,
      newTotal,
      message: `কুপন "${code}" সফলভাবে গ্রহণ করা হয়েছে! ৳৫০ ফ্ল্যাট ডিসকাউন্টের পর আপনার প্রদেয় মূল্য ৳${newTotal}।`,
    };
  }

  if (code === "SAVE100" || code === "SPECIAL100") {
    if (orderSubtotal < 1200) {
      return {
        success: false,
        couponCode: code,
        message: 'কুপন "SAVE100" ব্যবহার করতে ন্যূনতম ৳১,২০০ টাকার অর্ডার প্রয়োজন।',
      };
    }
    const discountAmount = 100;
    const newTotal = Math.max(0, orderSubtotal - discountAmount);
    return {
      success: true,
      couponCode: code,
      discountAmount,
      orderSubtotal,
      newTotal,
      message: `কুপন "${code}" সফলভাবে গ্রহণ করা হয়েছে! ৳১০০ ডিসকাউন্টের পর আপনার প্রদেয় মূল্য ৳${newTotal}।`,
    };
  }

  return {
    success: false,
    couponCode: code,
    message: `দুঃখিত, "${code}" কুপন কোডটি সঠিক নয় অথবা এর মেয়াদ শেষ হয়ে গিয়েছে।`,
  };
}

