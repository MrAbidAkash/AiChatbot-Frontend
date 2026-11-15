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
 * Parse numeric price from strings like "1,850", "1850.00", "৳ ১,৮৫০", "1850 TK"
 */
export function parseNumericPrice(priceStr: string): number {
  if (!priceStr) return 0;
  const bengaliMap: Record<string, string> = {
    "০": "0", "১": "1", "২": "2", "৩": "3", "৪": "4",
    "৫": "5", "৬": "6", "৭": "7", "৮": "8", "৯": "9",
  };
  const normalized = String(priceStr).replace(/[০-৯]/g, (d) => bengaliMap[d] || d);
  const clean = normalized.replace(/[^\d.]/g, "");
  const num = parseFloat(clean);
  return isNaN(num) ? 0 : num;
}

/**
 * Infer category, season, and tags from product name
 */
export function inferProductAttributes(productName: string): {
  category: "menswear" | "womenswear" | "accessories" | "general";
  season: "winter" | "summer" | "all-season";
  isEid: boolean;
  tags: string[];
} {
  const lower = productName.toLowerCase();
  const isWinter = /hoodie|jacket|sweater|fleece|হুডি|জ্যাকেট|সোয়েটার|উইন্টার/i.test(lower);
  const isSummer = /t-shirt|tshirt|drop shoulder|half sleeve|টি-শার্ট|টি শার্ট/i.test(lower);
  const isMenswear = /men|panjabi|kabli|পাঞ্জাবি|কাবলি|ছেলে|gents/i.test(lower);
  const isWomenswear = /kurti|saree|sari|salwar|kamiz|কুর্তি|শাড়ি|লেডিস|women/i.test(lower);
  const isAccessory = /wallet|belt|bag|মানিব্যাগ|ওয়ালেট|বেল্ট/i.test(lower);
  const isEid = /panjabi|kabli|kurti|saree|পাঞ্জাবি|কাবলি|কুর্তি/i.test(lower);

  const tags: string[] = [];
  if (isWinter) tags.push("winter", "শীত");
  if (isSummer) tags.push("summer", "গরম");
  if (isMenswear) tags.push("menswear", "ছেলেদের");
  if (isWomenswear) tags.push("womenswear", "মেয়েদের");
  if (isAccessory) tags.push("accessories", "এক্সেসরিজ");
  if (isEid) tags.push("eid", "ঈদ");

  return {
    category: isMenswear ? "menswear" : isWomenswear ? "womenswear" : isAccessory ? "accessories" : "general",
    season: isWinter ? "winter" : isSummer ? "summer" : "all-season",
    isEid,
    tags,
  };
}

/**
 * Find smart cross-sell / complementary products for upselling
 * e.g., Panjabi -> Pajama, Wallet
 * Kurti -> Wallet, Silk accessories
 * T-Shirt -> Hoodie, Wallet
 */
export function getComplementaryProducts(
  productName: string,
  catalog: CatalogProduct[],
): CatalogProduct[] {
  const currentAttr = inferProductAttributes(productName);
  const lowerCurrent = productName.toLowerCase();

  return catalog
    .filter((p) => p.name.toLowerCase() !== lowerCurrent && p.stock > 0)
    .sort((a, b) => {
      const aAttr = inferProductAttributes(a.name);
      const bAttr = inferProductAttributes(b.name);

      let aScore = 0;
      let bScore = 0;

      // Panjabi pairs well with Kabli Pajama or Leather Wallet
      if (lowerCurrent.includes("panjabi") || lowerCurrent.includes("পাঞ্জাবি")) {
        if (a.name.toLowerCase().includes("pajama") || a.name.toLowerCase().includes("kabli")) aScore += 5;
        if (a.name.toLowerCase().includes("wallet")) aScore += 4;
        if (b.name.toLowerCase().includes("pajama") || b.name.toLowerCase().includes("kabli")) bScore += 5;
        if (b.name.toLowerCase().includes("wallet")) bScore += 4;
      }
      // T-shirt pairs well with Hoodie or Wallet
      else if (lowerCurrent.includes("t-shirt") || lowerCurrent.includes("tshirt")) {
        if (aAttr.season === "winter" || a.name.toLowerCase().includes("hoodie")) aScore += 5;
        if (aAttr.category === "accessories") aScore += 4;
        if (bAttr.season === "winter" || b.name.toLowerCase().includes("hoodie")) bScore += 5;
        if (bAttr.category === "accessories") bScore += 4;
      }
      // General cross-selling: accessories like wallet pair with everything
      if (aAttr.category === "accessories") aScore += 2;
      if (bAttr.category === "accessories") bScore += 2;

      return bScore - aScore;
    })
    .slice(0, 2);
}

/**
 * Extract budget limit in BDT from customer message
 * e.g. "১০০০ টাকার মধ্যে", "1000 takar moddhe", "under 1500", "budget 800"
 */
export function extractBudgetLimit(message: string): number | null {
  if (!message) return null;
  const bengaliMap: Record<string, string> = {
    "০": "0", "১": "1", "২": "2", "৩": "3", "৪": "4",
    "৫": "5", "৬": "6", "৭": "7", "৮": "8", "৯": "9",
  };
  const normalized = message.replace(/[০-৯]/g, (d) => bengaliMap[d] || d);

  // Pattern 1: "1000 takar moddhe", "1000 er niche", "1000 টাকার মধ্যে"
  const pat1 = normalized.match(/(\d+)\s*(?:টাকা|টাকার|tk|taka|bdt)?\s*(?:এর\s*)?(?:মধ্যে|ভিতরে|নিচে|moddhe|vitore|under|below|er\s*niche)/i);
  if (pat1) {
    const val = parseInt(pat1[1], 10);
    if (val >= 100 && val <= 100000) return val;
  }

  // Pattern 2: "under 1000", "below 1500", "budget 800"
  const pat2 = normalized.match(/(?:under|below|budget|বাজেট|কমপক্ষে)\s*[:=]?\s*(\d+)/i);
  if (pat2) {
    const val = parseInt(pat2[1], 10);
    if (val >= 100 && val <= 100000) return val;
  }

  return null;
}

/**
 * Detect season, occasion, or gender collection queries
 */
export function detectSeasonOrOccasionQuery(message: string): {
  type: "season" | "occasion" | "gender";
  key: "winter" | "summer" | "eid" | "menswear" | "womenswear";
  titleBn: string;
  titleEn: string;
} | null {
  if (!message) return null;

  // Winter query
  if (/(?:winter|শীত|শীতের|thanda|ঠাণ্ডা|winter\s*collection|হুডি\s*কালেকশন)/i.test(message)) {
    return {
      type: "season",
      key: "winter",
      titleBn: "শীতের স্পেশাল কালেকশন (Winter Collection)",
      titleEn: "Winter Collection",
    };
  }

  // Summer query
  if (/(?:summer|গরম|গরমের|summer\s*collection|t-shirt\s*collection)/i.test(message)) {
    return {
      type: "season",
      key: "summer",
      titleBn: "সামার স্পেশাল কমফোর্ট কালেকশন (Summer Collection)",
      titleEn: "Summer Comfort Collection",
    };
  }

  // Eid / Festive query
  if (/(?:eid|ঈদ|ঈদের|festive|উৎসব)/i.test(message)) {
    return {
      type: "occasion",
      key: "eid",
      titleBn: "ঈদ স্পেশাল এক্সক্লুসিভ কালেকশন (Eid Collection)",
      titleEn: "Eid Special Collection",
    };
  }

  // Menswear query
  if (/(?:ছেলেদের|mens?|gents|purush|পুরুষদের)/i.test(message)) {
    return {
      type: "gender",
      key: "menswear",
      titleBn: "ছেলেদের ট্রেন্ডি কালেকশন (Men's Collection)",
      titleEn: "Men's Collection",
    };
  }

  // Womenswear query
  if (/(?:মেয়েদের|মেয়েদের|womens?|ladies|মহিলাদের)/i.test(message)) {
    return {
      type: "gender",
      key: "womenswear",
      titleBn: "মেয়েদের প্রিমিয়াম কালেকশন (Women's Collection)",
      titleEn: "Women's Collection",
    };
  }

  return null;
}

/**
 * Format filtered catalog list with custom heading
 */
export function formatFilteredCatalogReply(
  products: CatalogProduct[],
  title: string,
  lang: "bn" | "en" = "bn",
): string {
  if (products.length === 0) {
    return lang === "bn"
      ? `দুঃখিত, এই ক্যাটাগরিতে এই মুহূর্তে কোনো প্রোডাক্ট স্টকে নেই। তবে আমাদের অন্যান্য চমৎকার কালেকশন দেখতে পারেন!`
      : `Sorry, no products currently in stock matching this filter. Feel free to explore our other collections!`;
  }

  const items = products.map((p) => {
    if (lang === "bn") {
      const priceBn = toBengaliNumber(p.price);
      const stockBn = toBengaliNumber(p.stock);
      return `• ${p.name} (মূল্য: ৳${priceBn}) - স্টক: ${stockBn}টি`;
    } else {
      return `• ${p.name} (Price: ৳${p.price}) - Stock: ${p.stock}`;
    }
  });

  if (lang === "bn") {
    return `${title}:\n\n${items.join("\n")}\n\nকোন প্রোডাক্টটি আপনার পছন্দ হয়েছে বা সাইজ/কালার দেখতে চান, তা জানাতে পারেন!`;
  } else {
    return `${title}:\n\n${items.join("\n")}\n\nWhich of these would you like to explore or order?`;
  }
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
 * Common Bengali, Banglish, and English stopwords used in e-commerce inquiries and orders
 */
export const INVENTORY_STOPWORDS = new Set([
  // Bengali stop / filler / action words
  "আছে", "আসে", "আচে", "হবে", "পাব", "পাওয়া", "যাবে", "পাওয়া", "কত", "দাম", "দামটি", "মূল্য", "টাকা",
  "কি", "কী", "কোন", "কোনো", "কোথাও", "টা", "টি", "টিপিস", "পিস", "গুলো", "গুলা", "চাই", "চান",
  "লাগবে", "দরকার", "নিতে", "নেব", "নেবো", "কিনতে", "কিনব", "অর্ডার", "বুক", "বুকিং", "কনফার্ম", "দিন", "দেন",
  "কোরেন", "করেন", "করবেন", "পাঠান", "পাঠিয়ে", "আপনার", "আপনাদের", "স্টোরে", "দোকানে", "কাছে",
  "ভাই", "আপু", "স্যার", "প্লিজ", "একটু", "বলো", "বলুন", "দেখান", "রয়েছে", "দেবেন", "দিবেন", "না",
  // Banglish stop / filler / action words
  "ache", "ase", "ace", "hobe", "pawa", "jabe", "pabo", "koto", "dam",
  "mullo", "taka", "tk", "bdt", "ki", "kiki", "kon", "kono", "ta", "ti", "pcs",
  "piece", "pieces", "gulo", "gula", "chai", "chacchi", "cai", "lagbe", "dorkar", "nite",
  "nibo", "kinte", "kinbo", "order", "book", "confirm", "din", "den", "koren", "korun",
  "pathan", "pathiye", "apnader", "store", "kache", "bhai", "apu", "sir", "please", "plz",
  "ektu", "bolo", "bolun", "dekhan", "available", "avail", "stock", "kore", "koro", "korba",
  // English common words
  "i", "want", "to", "buy", "need", "have", "has", "is", "are", "any", "do", "you",
  "the", "a", "an", "in", "for", "of", "and", "or", "can", "get", "give", "me"
]);

/**
 * Tokenize and strip punctuation, numbers, and stopwords from text
 */
export function extractCleanTokens(message: string): string[] {
  if (!message) return [];
  const cleaned = message
    .toLowerCase()
    .replace(/[^\w\u0980-\u09FF\s]/g, " ")
    .trim();

  const words = cleaned.split(/\s+/).filter(Boolean);
  return words.filter((w) => {
    if (/^\d+$/.test(w)) return false; // purely numbers
    if (INVENTORY_STOPWORDS.has(w)) return false;
    return w.length >= 2;
  });
}

/**
 * Common Banglish phonetic and morphological normalizations
 */
export function normalizePhoneticBanglish(word: string): string[] {
  const forms = new Set<string>([word]);
  const lower = word.toLowerCase();

  // Banglish vowel substitutions: paijama <-> pajama <-> payjama
  if (lower.includes("ai")) {
    forms.add(lower.replace(/ai/g, "a"));
    forms.add(lower.replace(/ai/g, "ay"));
  }
  if (lower.includes("ay")) {
    forms.add(lower.replace(/ay/g, "a"));
    forms.add(lower.replace(/ay/g, "ai"));
  }
  if (lower.includes("ee")) {
    forms.add(lower.replace(/ee/g, "i"));
  }
  if (lower.includes("oo")) {
    forms.add(lower.replace(/oo/g, "u"));
  }
  if (lower.includes("sh")) {
    forms.add(lower.replace(/sh/g, "s"));
  }
  if (lower.startsWith("s") && !lower.startsWith("sh")) {
    forms.add("sh" + lower.slice(1));
  }
  if (lower.includes("z")) {
    forms.add(lower.replace(/z/g, "j"));
  }

  // Banglish suffix stripping
  if (lower.endsWith("ta") && lower.length > 4) forms.add(lower.slice(0, -2));
  if (lower.endsWith("ti") && lower.length > 4) forms.add(lower.slice(0, -2));
  if (lower.endsWith("gulo") && lower.length > 6) forms.add(lower.slice(0, -4));
  if (lower.endsWith("gula") && lower.length > 6) forms.add(lower.slice(0, -4));
  if (lower.endsWith("s") && lower.length > 3) forms.add(lower.slice(0, -1));

  // Bengali suffix stripping
  if (lower.endsWith("টা") && lower.length > 3) forms.add(lower.slice(0, -2));
  if (lower.endsWith("টি") && lower.length > 3) forms.add(lower.slice(0, -2));
  if (lower.endsWith("গুলো") && lower.length > 5) forms.add(lower.slice(0, -5));
  if (lower.endsWith("গুলা") && lower.length > 5) forms.add(lower.slice(0, -5));
  if (lower.endsWith("র") && lower.length > 3) forms.add(lower.slice(0, -1));

  return Array.from(forms);
}

/**
 * Fast Levenshtein distance for fuzzy matching
 */
export function levenshteinDistance(a: string, b: string): number {
  if (a === b) return 0;
  if (!a) return b.length;
  if (!b) return a.length;

  const al = a.length;
  const bl = b.length;
  const dp: number[] = Array.from({ length: bl + 1 }, (_, i) => i);

  for (let i = 1; i <= al; i++) {
    let prev = dp[0];
    dp[0] = i;
    const ac = a.charCodeAt(i - 1);
    for (let j = 1; j <= bl; j++) {
      const temp = dp[j];
      const cost = ac === b.charCodeAt(j - 1) ? 0 : 1;
      dp[j] = Math.min(dp[j] + 1, dp[j - 1] + 1, prev + cost);
      prev = temp;
    }
  }
  return dp[bl];
}

/**
 * Resolve a product in catalog using tokenization, lemmatization, phonetic variations, fuzzy matching, and bilingual synonyms
 */
export function resolveProductInCatalog(
  catalog: CatalogProduct[],
  userQuery: string,
): CatalogProduct | null {
  if (!catalog || catalog.length === 0 || !userQuery) return null;

  const cleanTokens = extractCleanTokens(userQuery);
  if (cleanTokens.length === 0) return null;

  const cleanQueryStr = cleanTokens.join(" ");

  // 1. Direct exact or substring match with full cleaned query
  for (const item of catalog) {
    const itemName = item.name.toLowerCase();
    if (itemName === cleanQueryStr || itemName.includes(cleanQueryStr)) {
      return item;
    }
  }

  // 2. Expand tokens with phonetic variations, lemmatization, and bilingual synonyms
  const expandedWords = new Set<string>();
  for (const token of cleanTokens) {
    expandedWords.add(token);
    lemmatizeWord(token).forEach((f) => expandedWords.add(f.toLowerCase()));
    normalizePhoneticBanglish(token).forEach((f) => expandedWords.add(f.toLowerCase()));

    // Bilingual Synonyms check
    for (const [key, syns] of Object.entries(BILINGUAL_SYNONYMS)) {
      const match = syns.some((s) => {
        const sLower = s.toLowerCase();
        return (
          sLower === token ||
          (token.length >= 3 && sLower.includes(token)) ||
          (sLower.length >= 3 && token.includes(sLower))
        );
      });
      if (match || key.toLowerCase() === token) {
        syns.forEach((s) => expandedWords.add(s.toLowerCase()));
        expandedWords.add(key.toLowerCase());
      }
    }
  }

  const queryTokens = Array.from(expandedWords).filter((w) => w.length >= 2);

  let bestMatch: CatalogProduct | null = null;
  let bestScore = 0;

  for (const item of catalog) {
    const itemName = item.name.toLowerCase();
    const itemWords = itemName
      .replace(/[^\w\u0980-\u09FF\s]/g, " ")
      .split(/\s+/)
      .filter(Boolean);
    let score = 0;

    for (const qw of queryTokens) {
      // Direct word match
      if (itemWords.includes(qw)) {
        score += 15;
      } else if (qw.length >= 4 && itemName.includes(qw)) {
        const wordBoundaryRegex = new RegExp(`(^|\\s)${qw}`, "i");
        if (wordBoundaryRegex.test(itemName) || qw.length >= 5) {
          score += 8;
        }
      } else {
        // Fuzzy distance match against item tokens
        for (const iw of itemWords) {
          if (qw.length >= 4 && iw.length >= 4) {
            const dist = levenshteinDistance(qw, iw);
            if (dist <= 1) {
              score += 10;
              break;
            } else if (dist === 2 && qw.length >= 5 && iw.length >= 5) {
              score += 6;
              break;
            }
          }
        }
      }
    }

    if (score > bestScore) {
      bestScore = score;
      bestMatch = item;
    }
  }

  return bestScore >= 6 ? bestMatch : null;
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
  const clean = message.trim();
  // 1. Direct verbs for buying, ordering, confirming, sending, taking
  const hasActionWord =
    /(?:order|অর্ডার|confirm|কনফার্ম|বুক|book|নিতে চাই|কিনতে চাই|চাই|chai|lagbe|লাগবে|need|পাঠিয়ে দিন|পাঠিয়ে দেন|পাঠান|দিন|din|den|কোরেন|করেন|koren|korun|নিতে|কিনতে|কিনব|নিব)\b/i.test(
      clean,
    );
  if (hasActionWord) return true;

  // 2. Pattern: Quantity + Product (e.g. "10 ta kurti", "2 ta panjabi", "30 wallets", "10টি কুর্তি")
  const hasQtyAndProduct = /\b\d+\s*(?:ta|টি|টা|pcs|pieces)?\s*[a-zA-Z\u0980-\u09FF]+/i.test(clean);
  if (hasQtyAndProduct) return true;

  return false;
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
    const cleanPrice = String(p.price || "N/A").replace(/^[৳TkBDT\s]+/i, "").trim();
    if (language === "bn") {
      const priceBn = toBengaliNumber(cleanPrice);
      const stockBn = toBengaliNumber(p.stock);
      const stockStatus = p.stock > 0 ? `স্টক: ${stockBn}টি` : "স্টক আউট";
      return `• ${p.name} (মূল্য: ৳${priceBn}) - ${stockStatus}`;
    } else {
      const stockStatus = p.stock > 0 ? `Stock: ${p.stock}` : "Out of Stock";
      return `• ${p.name} (Price: ৳${cleanPrice}) - ${stockStatus}`;
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
  const cleanItem = requestedItem.trim();
  // Filter available items and ensure none match the requested item
  const availableItems = catalog
    .filter((p) => p.stock > 0 && !p.name.toLowerCase().includes(cleanItem.toLowerCase()))
    .slice(0, 5);

  const itemsText = availableItems
    .map((p) => {
      const cleanPrice = String(p.price || "N/A").replace(/^[৳TkBDT\s]+/i, "").trim();
      return language === "bn" ? `• ${p.name} (৳${toBengaliNumber(cleanPrice)})` : `• ${p.name} (৳${cleanPrice})`;
    })
    .join("\n");

  if (language === "bn") {
    return `দুঃখিত, আমাদের কালেকশনে এই মুহূর্তে "${cleanItem}" অ্যাভেইলেবল নেই।\n\nতবে আমাদের স্টকে বেশ কিছু চমৎকার প্রোডাক্ট রয়েছে:\n${itemsText}\n\nএগুলোর মধ্য থেকে কোনোটি কি আপনার পছন্দ হয়েছে বা দেখতে চান?`;
  } else {
    return `Sorry, we currently do not carry "${cleanItem}" in our store.\n\nHowever, we have these great collections available in stock:\n${itemsText}\n\nWould you like to check out any of these?`;
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
  const cleanPrice = String(product.price || "N/A").replace(/^[৳TkBDT\s]+/i, "").trim();
  if (language === "bn") {
    const stockBn = toBengaliNumber(product.stock);
    const priceBn = toBengaliNumber(cleanPrice);
    return `${product.name} আমাদের স্টকে রয়েছে (মূল্য: ৳${priceBn})। তবে আমাদের স্টকে এই মুহূর্তে মাত্র ${stockBn}টি অবশিষ্ট রয়েছে! আপনি কি স্টকে থাকা এই ${stockBn}টি নিতে চান, নাকি কম পরিমাণে নিতে চান?`;
  } else {
    return `${product.name} is available in our store (Price: ৳${cleanPrice}). However, we currently have only ${product.stock} piece(s) left in stock! Would you like to take the available ${product.stock} piece(s), or a smaller quantity?`;
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
    .map((p) => {
      const cleanPrice = String(p.price || "N/A").replace(/^[৳TkBDT\s]+/i, "").trim();
      return language === "bn" ? `• ${p.name} (৳${toBengaliNumber(cleanPrice)})` : `• ${p.name} (৳${cleanPrice})`;
    })
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
  const tokens = extractCleanTokens(message);
  return tokens.join(" ").trim();
}

export interface DeterministicResult {
  handled: boolean;
  reply?: string;
  reason?:
    | "catalog_listing"
    | "product_unavailable"
    | "stock_exceeded"
    | "out_of_stock"
    | "budget_filter"
    | "category_filter";
  product?: CatalogProduct;
}

/**
 * High-level deterministic inventory processor
 * Evaluates incoming customer message against live catalog and returns an immediate, reliable reply
 * for standard catalog inquiries, unavailable products, stock limit constraints, budget filters, and seasonal collections.
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

  // 4. Budget Filter Inquiry ("১০০০ টাকার মধ্যে কি কি আছে?", "under 1500", "800 takar moddhe")
  const budgetLimit = extractBudgetLimit(customerMessage);
  if (budgetLimit !== null && budgetLimit > 0) {
    const budgetMatches = catalog
      .filter((p) => {
        const numPrice = parseNumericPrice(p.price);
        return numPrice > 0 && numPrice <= budgetLimit && p.stock > 0;
      })
      .sort((a, b) => parseNumericPrice(b.price) - parseNumericPrice(a.price));

    if (budgetMatches.length > 0) {
      const title =
        lang === "bn"
          ? `৳${toBengaliNumber(budgetLimit)} বাজেটের মধ্যে আমাদের চমৎকার কালেকশন`
          : `Great collections available within ৳${budgetLimit}`;
      return {
        handled: true,
        reply: formatFilteredCatalogReply(budgetMatches, title, lang),
        reason: "budget_filter",
      };
    }
  }

  // 5. Seasonal / Occasion / Category Filter Inquiry ("Winter collection", "শীতের কালেকশন", "Eid collection", "ছেলেদের জন্য")
  const seasonOrCat = detectSeasonOrOccasionQuery(customerMessage);
  if (seasonOrCat !== null) {
    const catMatches = catalog.filter((p) => {
      const attr = inferProductAttributes(p.name);
      if (seasonOrCat.key === "winter") return attr.season === "winter";
      if (seasonOrCat.key === "summer") return attr.season === "summer";
      if (seasonOrCat.key === "eid") return attr.isEid;
      if (seasonOrCat.key === "menswear") return attr.category === "menswear" || attr.category === "accessories";
      if (seasonOrCat.key === "womenswear") return attr.category === "womenswear";
      return false;
    });

    if (catMatches.length > 0) {
      const title = lang === "bn" ? seasonOrCat.titleBn : seasonOrCat.titleEn;
      return {
        handled: true,
        reply: formatFilteredCatalogReply(catMatches, title, lang),
        reason: "category_filter",
      };
    }
  }

  // 6. Catalog Listing Inquiry ("Ki ki available ache", "Available products", "kiki ache", "সব কালেকশন দেখতে চাই")
  if (isCatalogInquiry(customerMessage)) {
    return {
      handled: true,
      reply: formatCatalogListReply(catalog, lang),
      reason: "catalog_listing",
    };
  }

  // 7. Purchase Intent & Quantity Constraints ("5 hoodie order korte chacchi", "I want to buy 30 wallets", "১০টা পাঞ্জাবি লাগবে")
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
      // If qty <= stock, do NOT intercept: allow Gemini to proceed with address/phone confirmation and upselling!
    }
  }

  // 8. Product Availability Inquiry ("Maxi ache?", "Saree ache?", "Shoes ache?", "Paijama আছে?")
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
    } else {
      // Product is IN STOCK!
      const cleanPrice = String(matchedProduct.price || "N/A").replace(/^[৳TkBDT\s]+/i, "").trim();
      const isSetProduct = /(?:set|সেট|with|\+)/i.test(matchedProduct.name);
      const cleanTokens = extractCleanTokens(customerMessage);
      const isComponentInquiry =
        isSetProduct && !cleanTokens.some((t) => matchedProduct.name.toLowerCase().startsWith(t));

      if (lang === "bn") {
        const priceBn = toBengaliNumber(cleanPrice);
        const stockBn = toBengaliNumber(matchedProduct.stock);
        const reply = isComponentInquiry
          ? `জি! আমাদের স্টকে ${matchedProduct.name} অ্যাভেইলেবল রয়েছে (মূল্য: ৳${priceBn}, বর্তমান স্টক: ${stockBn}টি)। এটি কাবলি এবং পায়জামার একটি চমৎকার কমপ্লিট সেট।\n\nআপনি কি এটি দেখতে চান বা অর্ডার করতে চান?`
          : `জি! আমাদের স্টকে ${matchedProduct.name} অ্যাভেইলেবল রয়েছে। এর মূল্য মাত্র ৳${priceBn} (বর্তমান স্টক: ${stockBn}টি)।\n\nআপনি কি এটি অর্ডার করতে চান, নাকি সাইজ/কালার দেখতে চান?`;
        return {
          handled: true,
          reply,
          reason: "catalog_listing",
          product: matchedProduct,
        };
      } else {
        const reply = isComponentInquiry
          ? `Yes! We have ${matchedProduct.name} available in stock (Price: ৳${cleanPrice}, Current Stock: ${matchedProduct.stock} pieces). It comes as a complete set.\n\nWould you like to explore details or place an order?`
          : `Yes! ${matchedProduct.name} is available in our store! Price: ৳${cleanPrice} (Current Stock: ${matchedProduct.stock} pieces).\n\nWould you like to place an order or see available sizes/colors?`;
        return {
          handled: true,
          reply,
          reason: "catalog_listing",
          product: matchedProduct,
        };
      }
    }
  }

  // 9. Standalone Product Name Inquiry (e.g. "Kurti", "Wallet", "Hoodie", "Panjabi", "Saree", "Paijama")
  // When a customer simply types the name of a product or category:
  const directProductMatch = resolveProductInCatalog(catalog, customerMessage);
  if (directProductMatch) {
    const cleanPrice = String(directProductMatch.price || "N/A").replace(/^[৳TkBDT\s]+/i, "").trim();
    if (directProductMatch.stock === 0) {
      return {
        handled: true,
        reply: formatOutOfStockReply(directProductMatch, catalog, lang),
        reason: "out_of_stock",
        product: directProductMatch,
      };
    }

    const isSetProduct = /(?:set|সেট|with|\+)/i.test(directProductMatch.name);
    const cleanTokens = extractCleanTokens(customerMessage);
    const isComponentInquiry =
      isSetProduct && !cleanTokens.some((t) => directProductMatch.name.toLowerCase().startsWith(t));

    if (lang === "bn") {
      const priceBn = toBengaliNumber(cleanPrice);
      const stockBn = toBengaliNumber(directProductMatch.stock);
      const reply = isComponentInquiry
        ? `আমাদের স্টকে ${directProductMatch.name} রয়েছে! এর মূল্য ৳${priceBn} (বর্তমান স্টক: ${stockBn}টি)। এটি কাবলি এবং পায়জামার একটি প্রিমিয়াম সেট কালেকশন।\n\nআপনি কি এটি অর্ডার করতে চান, নাকি বিস্তারিত দেখতে চান?`
        : `${directProductMatch.name} আমাদের স্টকে অ্যাভেইলেবল রয়েছে! এর মূল্য ৳${priceBn} (বর্তমান স্টক: ${stockBn}টি)।\n\nআপনি কি এটি অর্ডার করতে চান, নাকি সাইজ/কালার সম্পর্কে বিস্তারিত জানতে চান?`;
      return {
        handled: true,
        reply,
        reason: "catalog_listing",
        product: directProductMatch,
      };
    } else {
      const reply = isComponentInquiry
        ? `We have ${directProductMatch.name} available in stock! Price: ৳${cleanPrice} (Current Stock: ${directProductMatch.stock} pieces). It comes as a complete set.\n\nWould you like to place an order or see more details?`
        : `${directProductMatch.name} is available in our store! Price: ৳${cleanPrice} (Current Stock: ${directProductMatch.stock} pieces).\n\nWould you like to place an order or know more details?`;
      return {
        handled: true,
        reply,
        reason: "catalog_listing",
        product: directProductMatch,
      };
    }
  }

  return { handled: false };
}

