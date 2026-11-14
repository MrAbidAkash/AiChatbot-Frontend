// src/lib/inventory-engine.ts
import { getDb } from "./db";
import { BusinessDocument } from "./knowledge";
import { getValidGoogleToken } from "./google-drive";
import { lemmatizeWord, BILINGUAL_SYNONYMS, extractQuantity } from "./google-sheets-stock";

export interface CatalogProduct {
  id?: string;
  name: string;
  price: string;
  stock: number;
  status: string;
  category?: string;
  rawLine?: string;
}

/**
 * Detect whether text is in English or Bengali/Banglish
 */
export function detectCustomerLanguage(text: string): "bn" | "en" {
  if (!text) return "bn";
  // Bengali Unicode range: 0980-09FF
  const hasBengali = /[\u0980-\u09FF]/.test(text);
  if (hasBengali) return "bn";

  // Check for common Banglish keywords
  const isBanglish = /\b(?:koto|ache|dam|hobe|chai|lagbe|pathan|din|amake|ami|korte|chacchi|kore|apnader|bhai|bhaiya|apu|korbo)\b/i.test(text);
  if (isBanglish) return "bn";

  return "en";
}

/**
 * Format English number to Bengali digits
 */
export function toBengaliNumber(val: number | string): string {
  const bengaliDigits = ["০", "১", "২", "৩", "৪", "৫", "৬", "৭", "৮", "৯"];
  return String(val).replace(/\d/g, (d) => bengaliDigits[parseInt(d, 10)]);
}

/**
 * Extract structured catalog products from text content (synced Google Sheet, CSV, or formatted document)
 */
export function extractCatalogFromContent(content: string): CatalogProduct[] {
  if (!content) return [];
  const products: CatalogProduct[] = [];
  const lines = content.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);

  for (const line of lines) {
    // Only lines containing a pipe '|' or colon ':' that look like product rows
    const hasInventoryKeywords =
      line.includes("|") &&
      /(?:stock|qty|quantity|স্টক|পরিমাণ|price|দাম|মূল্য|টাকা)/i.test(line);

    if (hasInventoryKeywords) {
      const parts = line.split("|").map((p) => p.trim());
      let name: string | null = null;
      let price: string | null = null;
      let stock: number | null = null;
      let status = "In Stock";

      for (const part of parts) {
        const nameMatch = part.match(/(?:product(?:\s*name)?|item|পণ্য)[\s:=]+([^|]+)/i);
        if (nameMatch) name = nameMatch[1].trim();

        const priceMatch = part.match(/(?:price|rate|cost|দাম|মূল্য|টাকা|৳|tk|bdt)[\s:=]*([0-9,]+)/i);
        if (priceMatch) price = priceMatch[1].trim();

        const stockMatch = part.match(/(?:stock|qty|quantity|স্টক|পরিমাণ)[\s:=]+(\d+)/i);
        if (stockMatch) stock = parseInt(stockMatch[1], 10);

        const statusMatch = part.match(/(?:status|অবস্থা|স্ট্যাটাস)[\s:=]+([^|]+)/i);
        if (statusMatch) status = statusMatch[1].trim();
      }

      // If name wasn't explicitly prefixed with "Product Name:", take the first column
      if (!name && parts.length >= 2) {
        const cleanFirst = parts[0].replace(/^Row\s*\d+[\s:]*/i, "").trim();
        if (
          cleanFirst &&
          !/^(?:columns|total records|---)/i.test(cleanFirst) &&
          cleanFirst.length >= 3
        ) {
          name = cleanFirst;
        }
      }

      if (name && stock !== null) {
        products.push({
          name,
          price: price || "N/A",
          stock,
          status: stock > 0 ? status || "In Stock" : "Out of Stock",
          rawLine: line,
        });
      }
    }
  }

  return products;
}

/**
 * Retrieve the active catalog products for a store from connected Google Sheets or database documents
 */
export async function getStoreCatalog(options: {
  userId?: string;
  pageId?: string;
} = {}): Promise<CatalogProduct[]> {
  const { userId, pageId } = options;
  const db = getDb();

  // 1. Check Google Sheets via Google Sheets API if token exists
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
      $or: [{ userId }, { userId: "default" }, { userId: { $exists: false } }, { userId: null }],
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
        const token = await getValidGoogleToken(sheet.userId || userId || "default");
        if (token) {
          const metaRes = await fetch(
            `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}?fields=sheets.properties.title`,
            { headers: { Authorization: `Bearer ${token}` } },
          );
          if (metaRes.ok) {
            const metaData = await metaRes.json();
            const sheetName = metaData.sheets?.[0]?.properties?.title || "Sheet1";

            const valuesRes = await fetch(
              `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/'${encodeURIComponent(sheetName)}'!A1:Z100`,
              { headers: { Authorization: `Bearer ${token}` } },
            );

            if (valuesRes.ok) {
              const valuesData = await valuesRes.json();
              const rows: string[][] = valuesData.values || [];

              if (rows.length >= 2) {
                const headerRow = rows[0].map((h) => String(h || "").toLowerCase().trim());
                let prodCol = headerRow.findIndex((h) =>
                  h.includes("product") || h.includes("item") || h.includes("name") || h.includes("পণ্য")
                );
                if (prodCol === -1) prodCol = 0;

                let stockCol = headerRow.findIndex((h) =>
                  h === "stock" || h === "qty" || h === "quantity" || h.includes("stock") || h.includes("স্টক")
                );
                let priceCol = headerRow.findIndex((h) =>
                  h.includes("price") || h.includes("rate") || h.includes("দাম") || h.includes("মূল্য") || h.includes("টাকা")
                );
                let statusCol = headerRow.findIndex((h) =>
                  h.includes("status") || h.includes("অবস্থা") || h.includes("স্ট্যাটাস")
                );

                if (stockCol !== -1) {
                  const liveProducts: CatalogProduct[] = [];
                  for (let r = 1; r < rows.length; r++) {
                    const row = rows[r];
                    const name = String(row[prodCol] || "").trim();
                    if (!name) continue;

                    const stockStr = String(row[stockCol] || "0");
                    const numMatch = stockStr.match(/\d+/);
                    const stock = numMatch ? parseInt(numMatch[0], 10) : 0;

                    const price = priceCol !== -1 && row[priceCol] ? String(row[priceCol]).trim() : "N/A";
                    const status = statusCol !== -1 && row[statusCol] ? String(row[statusCol]).trim() : stock > 0 ? "In Stock" : "Out of Stock";

                    liveProducts.push({ name, price, stock, status });
                  }

                  if (liveProducts.length > 0) {
                    return liveProducts;
                  }
                }
              }
            }
          }
        }
      } catch (sheetErr) {
        console.warn("[InventoryEngine] Live Google Sheet fetch warning:", sheetErr);
      }
    }
  }

  // 2. Fallback: Parse local documents from MongoDB business_knowledge
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

  const docs = await db
    .collection<BusinessDocument>("business_knowledge")
    .find(docQuery)
    .sort({ updatedAt: -1 })
    .toArray();

  for (const doc of docs) {
    if (doc.content) {
      const extracted = extractCatalogFromContent(doc.content);
      if (extracted.length > 0) {
        return extracted;
      }
    }
  }

  return [];
}

/**
 * Resolve a product in catalog using plural/singular morphological lemmatization and synonyms
 */
export function resolveProductInCatalog(
  catalog: CatalogProduct[],
  userQuery: string,
): CatalogProduct | null {
  if (!catalog || catalog.length === 0 || !userQuery) return null;

  // Clean the query: remove quantities, numbers, and purchasing verbs
  const clean = userQuery
    .replace(/\b(?:\d+|ta|টা|টি|pcs|pieces|items?|i|want|to|buy|need|order|kinte|chai|chacchi|lagbe|ache|koto|dam|price|pawa|jabe)\b/gi, " ")
    .replace(/[^\w\u0980-\u09FF\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  const words = clean.split(/\s+/).filter((w) => w.length >= 2);
  if (words.length === 0) return null;

  const expanded = new Set<string>();
  for (const w of words) {
    const lower = w.toLowerCase();
    expanded.add(lower);
    lemmatizeWord(lower).forEach((f) => expanded.add(f.toLowerCase()));

    for (const [key, syns] of Object.entries(BILINGUAL_SYNONYMS)) {
      if (lower.length >= 3 && syns.some((s) => s.toLowerCase().includes(lower) || lower.includes(s.toLowerCase()))) {
        syns.forEach((s) => expanded.add(s.toLowerCase()));
        expanded.add(key.toLowerCase());
      }
    }
  }

  const expWords = Array.from(expanded).filter((w) => w.length >= 2);

  let bestMatch: CatalogProduct | null = null;
  let bestScore = 0;

  for (const item of catalog) {
    const itemName = item.name.toLowerCase();
    let score = 0;

    // Direct exact or substring match
    if (itemName === clean.toLowerCase()) {
      return item;
    }

    for (const ew of expWords) {
      if (itemName.includes(ew)) {
        score += ew.length * 2;
      }
    }

    if (score > bestScore) {
      bestScore = score;
      bestMatch = item;
    }
  }

  return bestScore >= 4 ? bestMatch : null;
}

/**
 * Check if the customer is asking what products are available
 */
export function isCatalogInquiry(message: string): boolean {
  if (!message) return false;
  return /(?:ki ki|kiki|কি কি|কী কী|available|collection|কালেকশন|প্রোডাক্ট|products?|তালিকা|list|catalog|সব প্রোডাক্ট|কি আছে|কী আছে)/i.test(
    message.trim(),
  );
}

/**
 * Check if the customer is asking whether a specific item is available
 */
export function isProductAvailabilityInquiry(message: string): boolean {
  if (!message) return false;
  return /(?:ache\??|আছে\??|hobe\??|হবে\??|pawa jabe\??|পাওয়া যাবে\??|available\??|koto\??|দাম কত|price\??|dam\??)/i.test(
    message.trim(),
  );
}

/**
 * Check if customer expresses direct purchase intent
 */
export function isPurchaseIntent(message: string): boolean {
  if (!message) return false;
  return /(?:order|অর্ডার|নিতে চাই|কিনতে চাই|order korte|buy|purchase|lagbe|need|পাঠিয়ে দিন|পাঠান|বুক)/i.test(
    message.trim(),
  );
}

/**
 * Extract requested quantity from customer message
 */
export function extractOrderQuantity(message: string): number {
  const qty = extractQuantity(message);
  if (qty && qty > 0) return qty;

  // Check for standalone numbers followed by product: "5 hoodie"
  const digitMatch = message.match(/\b(\d+)\s*(?:pcs?|ta|টি|টা)?\s*[a-zA-Z\u0980-\u09FF]+/i);
  if (digitMatch) {
    const val = parseInt(digitMatch[1], 10);
    if (val > 0 && val < 500) return val;
  }

  return 1;
}

/**
 * Format a list of available catalog products
 */
export function formatCatalogListReply(
  catalog: CatalogProduct[],
  language: "bn" | "en" = "bn",
): string {
  if (catalog.length === 0) {
    return language === "bn"
      ? "আমাদের স্টকে এই মুহূর্তে কোনো প্রোডাক্ট উপলব্ধ নেই। অনুগ্রহ করে কিছুক্ষণ পর আবার চেষ্টা করুন।"
      : "No products currently available in our catalog.";
  }

  const items = catalog.map((p) => {
    if (language === "bn") {
      const priceBn = toBengaliNumber(p.price);
      const stockBn = toBengaliNumber(p.stock);
      const stockStatus = p.stock > 0 ? `স্টক: ${stockBn}টি` : "স্টক আউট";
      return `• ${p.name} (মূল্য: ৳${priceBn}) - ${stockStatus}`;
    } else {
      const stockStatus = p.stock > 0 ? `Stock: ${p.stock}` : "Out of Stock";
      return `• ${p.name} (Price: ৳${p.price}) - ${stockStatus}`;
    }
  });

  if (language === "bn") {
    return `আমাদের স্টকে এই মুহূর্তে বেশ কিছু চমৎকার কালেকশন রয়েছে। নিচে তালিকাটি দেওয়া হলো:\n\n${items.join("\n")}\n\nএগুলোর মধ্যে কোনো প্রোডাক্টটি আপনার পছন্দ হয়েছে বা অর্ডার করতে চান, তা জানাতে পারেন!`;
  } else {
    return `Here are the wonderful items currently available in our store:\n\n${items.join("\n")}\n\nWhich of these would you like to explore or order?`;
  }
}

/**
 * Format reply when a customer asks for a product the store DOES NOT carry (e.g. Maxi)
 */
export function formatProductUnavailableReply(
  requestedItem: string,
  catalog: CatalogProduct[],
  language: "bn" | "en" = "bn",
): string {
  const availableItems = catalog.filter((p) => p.stock > 0).slice(0, 5);
  const itemsText = availableItems
    .map((p) => (language === "bn" ? `• ${p.name} (৳${toBengaliNumber(p.price)})` : `• ${p.name} (৳${p.price})`))
    .join("\n");

  if (language === "bn") {
    return `দুঃখিত, আমাদের কালেকশনে এই মুহূর্তে "${requestedItem}" অ্যাভেইলেবল নেই।\n\nতবে আমাদের স্টকে বেশ কিছু চমৎকার প্রোডাক্ট রয়েছে:\n${itemsText}\n\nএগুলোর মধ্য থেকে কোনোটি কি আপনার পছন্দ হয়েছে বা দেখতে চান?`;
  } else {
    return `Sorry, we currently do not carry "${requestedItem}" in our store.\n\nHowever, we have these great collections available in stock:\n${itemsText}\n\nWould you like to check out any of these?`;
  }
}

/**
 * Format reply when customer requests more items than available stock
 */
export function formatStockExceededReply(
  product: CatalogProduct,
  requestedQty: number,
  language: "bn" | "en" = "bn",
): string {
  if (language === "bn") {
    const stockBn = toBengaliNumber(product.stock);
    const priceBn = toBengaliNumber(product.price);
    return `${product.name} আমাদের স্টকে রয়েছে (মূল্য: ৳${priceBn})। তবে আমাদের স্টকে এই মুহূর্তে মাত্র ${stockBn}টি অবশিষ্ট রয়েছে! আপনি কি স্টকে থাকা এই ${stockBn}টি নিতে চান, নাকি কম পরিমাণে নিতে চান?`;
  } else {
    return `${product.name} is available in our store (Price: ৳${product.price}). However, we currently have only ${product.stock} piece(s) left in stock! Would you like to take the available ${product.stock} piece(s), or a smaller quantity?`;
  }
}

/**
 * Format reply when requested product has 0 stock
 */
export function formatOutOfStockReply(
  product: CatalogProduct,
  catalog: CatalogProduct[],
  language: "bn" | "en" = "bn",
): string {
  const alternatives = catalog.filter((p) => p.name !== product.name && p.stock > 0).slice(0, 4);
  const altText = alternatives
    .map((p) => (language === "bn" ? `• ${p.name} (৳${toBengaliNumber(p.price)})` : `• ${p.name} (৳${p.price})`))
    .join("\n");

  if (language === "bn") {
    return `দুঃখিত, "${product.name}" এই মুহূর্তে সম্পূর্ণ স্টক আউট (Stock Out)।\n\nতবে আমাদের স্টকে অন্যান্য চমৎকার প্রোডাক্ট উপলব্ধ রয়েছে:\n${altText}\n\nআপনি কি এগুলোর মধ্য থেকে কিছু দেখতে চান?`;
  } else {
    return `Sorry, "${product.name}" is currently completely out of stock.\n\nHowever, we have these other great items in stock:\n${altText}\n\nWould you like to explore any of these?`;
  }
}

/**
 * Check if the customer query is asking about store policies, shipping/delivery, payment, return, or contact
 * In these cases, deterministic inventory checks MUST NOT intercept, so Gemini RAG can answer from policy docs.
 */
export function isPolicyOrFaqInquiry(message: string): boolean {
  if (!message) return false;
  return /(?:delivery|shipping|ডেলিভারি|শিপিং|চার্জ|charge|ভাড়া|courier|কুরিয়ার|steadfast|pathao|redx|payment|পেমেন্ট|bKash|বিকাশ|nagad|নগদ|rocket|রকেট|cod|cash on delivery|ক্যাশ অন ডেলিভারি|advance|অগ্রিম|return|রিটার্ন|refund|রিফান্ড|exchange|বদল|change|location|ঠিকানা|address|office|অফিস|দোকান|shop|showroom|শোরুম|phone|number|নম্বর|contact|যোগাযোগ|human|manush|agent|admin|এডমিন|সাপোর্ট|support|হেল্প|help)/i.test(
    message.trim(),
  );
}

/**
 * Check if the customer query is asking about product specifications (color, size, fabric, material, warranty)
 * These should be answered by Gemini RAG using the product descriptions in business knowledge.
 */
export function isProductSpecificationInquiry(message: string): boolean {
  if (!message) return false;
  return /(?:color|colour|কালার|রং|রঙ|size|সাইজ|মাপ|fabric|ফেব্রিক|কাপড়|কাপড়|material|ম্যাটেরিয়াল|quality|কোয়ালিটি|মান|warranty|ওয়ারেন্টি|গ্যারান্টি|guarantee)/i.test(
    message.trim(),
  );
}

/**
 * Extract candidate product or item name requested by the customer
 */
export function extractRequestedProductName(message: string): string {
  if (!message) return "";
  const clean = message
    .replace(/\b(?:\d+|ta|টা|টি|pcs|pieces|items?|i|want|to|buy|need|order|kinte|chai|chacchi|lagbe|ache|koto|dam|price|pawa|jabe|available|apnader|store|kache|ki|কী|কি\?|কী\?|hobe|হবে|হবে\?|পাব|পাওয়া|যাবে|আছে|আছে\?|কত|দাম)\b/gi, " ")
    .replace(/[^\w\u0980-\u09FF\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  return clean;
}

export interface DeterministicResult {
  handled: boolean;
  reply?: string;
  reason?: "catalog_listing" | "product_unavailable" | "stock_exceeded" | "out_of_stock";
  product?: CatalogProduct;
}

/**
 * High-level deterministic inventory processor
 * Evaluates incoming customer message against live catalog and returns an immediate, reliable reply
 * for standard catalog inquiries, unavailable products, and stock limit constraints.
 */
export async function processDeterministicInventoryQuery(options: {
  customerMessage: string;
  userId?: string;
  pageId?: string;
  conversationHistory?: Array<{ senderType: string; text: string }>;
}): Promise<DeterministicResult> {
  const { customerMessage, userId, pageId } = options;
  if (!customerMessage || !customerMessage.trim()) {
    return { handled: false };
  }

  // 1. If customer asks about policy/FAQ (delivery charges, payment methods, returns, showroom address),
  // let Gemini RAG handle it with store policy documents.
  if (isPolicyOrFaqInquiry(customerMessage)) {
    return { handled: false };
  }

  // 2. If customer asks about specific product specifications (color, size, fabric, etc.),
  // let Gemini RAG handle it with rich product descriptions.
  if (isProductSpecificationInquiry(customerMessage)) {
    return { handled: false };
  }

  // 3. Fetch active catalog products from live Google Sheet or synced business knowledge
  const catalog = await getStoreCatalog({ userId, pageId });
  if (!catalog || catalog.length === 0) {
    return { handled: false };
  }

  const lang = detectCustomerLanguage(customerMessage);

  // 4. Catalog Listing Inquiry ("Ki ki available ache", "Available products", "kiki ache", "সব কালেকশন দেখতে চাই")
  if (isCatalogInquiry(customerMessage)) {
    return {
      handled: true,
      reply: formatCatalogListReply(catalog, lang),
      reason: "catalog_listing",
    };
  }

  // 5. Purchase Intent & Quantity Constraints ("5 hoodie order korte chacchi", "I want to buy 30 wallets", "১০টা পাঞ্জাবি লাগবে")
  if (isPurchaseIntent(customerMessage)) {
    const matchedProduct = resolveProductInCatalog(catalog, customerMessage);
    if (matchedProduct) {
      const qty = extractOrderQuantity(customerMessage);
      if (matchedProduct.stock === 0) {
        return {
          handled: true,
          reply: formatOutOfStockReply(matchedProduct, catalog, lang),
          reason: "out_of_stock",
          product: matchedProduct,
        };
      }
      if (qty > matchedProduct.stock) {
        return {
          handled: true,
          reply: formatStockExceededReply(matchedProduct, qty, lang),
          reason: "stock_exceeded",
          product: matchedProduct,
        };
      }
      // If qty <= stock, do NOT intercept: allow Gemini to proceed with address/phone confirmation!
    }
  }

  // 6. Product Availability Inquiry ("Maxi ache?", "Saree ache?", "Shoes ache?")
  if (isProductAvailabilityInquiry(customerMessage)) {
    const matchedProduct = resolveProductInCatalog(catalog, customerMessage);
    if (!matchedProduct) {
      const requestedItem = extractRequestedProductName(customerMessage);
      if (
        requestedItem &&
        requestedItem.length >= 2 &&
        !/^(?:product|item|kisu|kichu|jinish|পণ্য|জিনিস|মাল)$/i.test(requestedItem)
      ) {
        return {
          handled: true,
          reply: formatProductUnavailableReply(requestedItem, catalog, lang),
          reason: "product_unavailable",
        };
      }
    } else if (matchedProduct.stock === 0) {
      return {
        handled: true,
        reply: formatOutOfStockReply(matchedProduct, catalog, lang),
        reason: "out_of_stock",
        product: matchedProduct,
      };
    }
  }

  return { handled: false };
}

