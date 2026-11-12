// src/lib/steadfast.ts
import { getDb } from "./db";
import { ObjectId } from "mongodb";

export interface SteadfastConfig {
  userId: string;
  apiKey: string;
  secretKey: string;
  baseUrl?: string;
  updatedAt: Date;
}

export interface SteadfastOrderPayload {
  invoice: string;
  recipient_name: string;
  recipient_phone: string;
  recipient_address: string;
  cod_amount: number;
  note?: string;
  item_description?: string;
  total_lot?: number;
  delivery_type?: number; // 0 = Home Delivery, 1 = Hub Pick Up
  area?: string; // e.g. "Jhenaidah Sadar, Jhenaidah"
  exact_area?: string; // e.g. "Search area in this thana"
}

export interface SteadfastParcel {
  _id?: string;
  userId: string;
  invoice: string;
  recipient_name: string;
  recipient_phone: string;
  recipient_address: string;
  area?: string;
  exact_area?: string;
  cod_amount: number;
  note?: string;
  item_description?: string;
  total_lot?: number;
  delivery_type?: number;
  consignment_id: number | string;
  tracking_code: string;
  status: string;
  tracking_url?: string;
  rawResponse?: any;
  createdAt: Date;
  updatedAt: Date;
}

const SETTINGS_COLLECTION = "courier_settings";
const PARCELS_COLLECTION = "steadfast_parcels";
export const STEADFAST_PRIMARY_BASE_URL = "https://portal.steadfast.com.bd/api/v1";
export const STEADFAST_FALLBACK_BASE_URL = "https://portal.packzy.com/api/v1";

/**
 * Fetch a user's Steadfast configuration
 */
export async function getSteadfastConfig(userId: string): Promise<SteadfastConfig | null> {
  const db = getDb();
  const doc = await db.collection(SETTINGS_COLLECTION).findOne({
    userId,
    provider: "steadfast",
  });

  if (!doc) return null;

  return {
    userId: doc.userId,
    apiKey: doc.apiKey || "",
    secretKey: doc.secretKey || "",
    baseUrl: doc.baseUrl || STEADFAST_PRIMARY_BASE_URL,
    updatedAt: doc.updatedAt || new Date(),
  };
}

/**
 * Save or update a user's Steadfast configuration
 */
export async function saveSteadfastConfig(
  userId: string,
  data: { apiKey: string; secretKey: string; baseUrl?: string }
): Promise<void> {
  const db = getDb();
  await db.collection(SETTINGS_COLLECTION).updateOne(
    { userId, provider: "steadfast" },
    {
      $set: {
        userId,
        provider: "steadfast",
        apiKey: data.apiKey.trim(),
        secretKey: data.secretKey.trim(),
        baseUrl: data.baseUrl?.trim() || STEADFAST_PRIMARY_BASE_URL,
        updatedAt: new Date(),
      },
    },
    { upsert: true }
  );
}

/**
 * Helper to execute an authenticated request to Steadfast API with fallback support
 */
async function callSteadfastApi(
  endpoint: string,
  credentials: { apiKey: string; secretKey: string; baseUrl?: string },
  options: {
    method?: "GET" | "POST";
    body?: any;
  } = {}
) {
  const { apiKey, secretKey, baseUrl = STEADFAST_PRIMARY_BASE_URL } = credentials;
  const baseUrls = [
    baseUrl.replace(/\/+$/, ""),
    baseUrl.includes("packzy") ? STEADFAST_PRIMARY_BASE_URL : STEADFAST_FALLBACK_BASE_URL,
  ];

  let lastError: any = null;

  for (const rootUrl of Array.from(new Set(baseUrls))) {
    const fullUrl = `${rootUrl}/${endpoint.replace(/^\/+/, "")}`;
    try {
      const response = await fetch(fullUrl, {
        method: options.method || "GET",
        headers: {
          "Api-Key": apiKey.trim(),
          "Secret-Key": secretKey.trim(),
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: options.body ? JSON.stringify(options.body) : undefined,
      });

      const responseText = await response.text();
      let responseData: any = {};
      try {
        responseData = JSON.parse(responseText);
      } catch {
        responseData = { message: responseText };
      }

      if (!response.ok) {
        const errorMsg =
          responseData?.message ||
          responseData?.errors ||
          responseData?.error ||
          `Steadfast API error: ${response.status} ${response.statusText}`;
        lastError = new Error(typeof errorMsg === "string" ? errorMsg : JSON.stringify(errorMsg));
        continue;
      }

      // Check for Steadfast logical errors (status !== 200 inside JSON)
      if (responseData.status && responseData.status !== 200 && responseData.status !== "200") {
        const msg =
          responseData.message ||
          (responseData.errors ? Object.values(responseData.errors).flat().join(", ") : null) ||
          "Steadfast reported an error processing your request.";
        throw new Error(msg);
      }

      return responseData;
    } catch (err: any) {
      lastError = err;
    }
  }

  throw lastError || new Error("Failed to connect to Steadfast API");
}

/**
 * Check merchant account balance from Steadfast
 */
export async function getSteadfastBalance(credentials: {
  apiKey: string;
  secretKey: string;
  baseUrl?: string;
}): Promise<{ current_balance: number; raw: any }> {
  const data = await callSteadfastApi("get_balance", credentials, { method: "GET" });
  
  const balance =
    data.current_balance !== undefined
      ? Number(data.current_balance)
      : data.balance !== undefined
      ? Number(data.balance)
      : data.data?.current_balance !== undefined
      ? Number(data.data.current_balance)
      : 0;

  return {
    current_balance: isNaN(balance) ? 0 : balance,
    raw: data,
  };
}

/**
 * Create a new parcel/order on Steadfast
 */
export async function createSteadfastOrder(
  credentials: { apiKey: string; secretKey: string; baseUrl?: string },
  payload: SteadfastOrderPayload
): Promise<{
  consignment_id: number | string;
  tracking_code: string;
  status: string;
  raw: any;
}> {
  // Validate recipient phone (must be valid BD 11-digit format)
  let cleanPhone = payload.recipient_phone.replace(/[^\d+]/g, "");
  if (cleanPhone.startsWith("+88")) cleanPhone = cleanPhone.slice(3);
  if (cleanPhone.startsWith("88")) cleanPhone = cleanPhone.slice(2);
  
  if (!/^01\d{9}$/.test(cleanPhone)) {
    throw new Error("Invalid Bangladeshi phone number. Must be 11 digits starting with 01 (e.g. 017XXXXXXXX)");
  }

  const cleanInvoice = payload.invoice.trim();
  if (!cleanInvoice) {
    throw new Error("Invoice ID is required");
  }

  const cod = Number(payload.cod_amount);
  if (isNaN(cod) || cod < 0) {
    throw new Error("COD amount must be a positive number or 0");
  }

  // Combine address with exact_area and area (thana, district) if provided and not already included
  let finalAddress = payload.recipient_address.trim();
  if (payload.exact_area && payload.exact_area.trim()) {
    const ea = payload.exact_area.trim();
    if (!finalAddress.toLowerCase().includes(ea.toLowerCase())) {
      finalAddress = `${finalAddress}, ${ea}`;
    }
  }
  if (payload.area && payload.area.trim()) {
    const a = payload.area.trim();
    const thanaPart = a.split(",")[0].trim().toLowerCase();
    if (!finalAddress.toLowerCase().includes(thanaPart)) {
      finalAddress = `${finalAddress}, ${a}`;
    }
  }
  // Steadfast character limit for recipient_address is 250 characters
  if (finalAddress.length > 250) {
    finalAddress = finalAddress.slice(0, 250);
  }

  const orderBody: Record<string, any> = {
    invoice: cleanInvoice,
    recipient_name: payload.recipient_name.trim(),
    recipient_phone: cleanPhone,
    recipient_address: finalAddress,
    cod_amount: cod,
  };

  if (payload.note && payload.note.trim()) {
    orderBody.note = payload.note.trim();
  }
  if (payload.item_description && payload.item_description.trim()) {
    orderBody.item_description = payload.item_description.trim();
  }
  if (payload.total_lot !== undefined && !isNaN(Number(payload.total_lot))) {
    orderBody.total_lot = Number(payload.total_lot);
  }
  if (payload.delivery_type !== undefined) {
    orderBody.delivery_type = Number(payload.delivery_type);
  }

  const data = await callSteadfastApi("create_order", credentials, {
    method: "POST",
    body: orderBody,
  });

  // Extract consignment details
  const consignment = data.consignment || data.data || data;
  const consignment_id =
    consignment.consignment_id || consignment.id || data.consignment_id || data.id;
  const tracking_code =
    consignment.tracking_code || data.tracking_code || "";
  const status =
    consignment.status || data.delivery_status || "in_review";

  if (!consignment_id && !tracking_code) {
    throw new Error(
      data.message || "Parcel was placed, but no consignment or tracking code was returned."
    );
  }

  return {
    consignment_id: consignment_id || tracking_code,
    tracking_code: tracking_code || String(consignment_id),
    status,
    raw: data,
  };
}

/**
 * Fetch delivery status of a consignment from Steadfast
 */
export async function getSteadfastStatus(
  credentials: { apiKey: string; secretKey: string; baseUrl?: string },
  identifier: { consignment_id?: string | number; tracking_code?: string; invoice?: string }
): Promise<{ status: string; raw: any }> {
  let endpoint = "";
  if (identifier.consignment_id) {
    endpoint = `status_by_cid/${identifier.consignment_id}`;
  } else if (identifier.tracking_code) {
    endpoint = `status_by_tracking_code/${identifier.tracking_code}`;
  } else if (identifier.invoice) {
    endpoint = `status_by_invoice/${identifier.invoice}`;
  } else {
    throw new Error("Must provide consignment_id, tracking_code, or invoice to check status");
  }

  const data = await callSteadfastApi(endpoint, credentials, { method: "GET" });
  const status =
    data.delivery_status ||
    data.status_name ||
    data.status ||
    data.data?.status ||
    "unknown";

  return {
    status: String(status).toLowerCase(),
    raw: data,
  };
}

/**
 * Save parcel record into MongoDB
 */
export async function saveParcelRecord(
  parcel: Omit<SteadfastParcel, "_id" | "createdAt" | "updatedAt">
): Promise<SteadfastParcel> {
  const db = getDb();
  const now = new Date();

  const docToInsert = {
    ...parcel,
    tracking_url: parcel.tracking_code
      ? `https://steadfast.com.bd/t/${parcel.tracking_code}`
      : undefined,
    createdAt: now,
    updatedAt: now,
  };

  const result = await db.collection(PARCELS_COLLECTION).insertOne(docToInsert);

  return {
    ...docToInsert,
    _id: result.insertedId.toString(),
  };
}

/**
 * Retrieve user's parcels with optional filters
 */
export async function getUserParcels(
  userId: string,
  options: {
    search?: string;
    status?: string;
    limit?: number;
    skip?: number;
  } = {}
): Promise<{ parcels: SteadfastParcel[]; total: number }> {
  const db = getDb();
  const filter: any = { userId };

  if (options.status && options.status !== "all") {
    filter.status = options.status;
  }

  if (options.search && options.search.trim()) {
    const q = options.search.trim();
    filter.$or = [
      { invoice: { $regex: q, $options: "i" } },
      { tracking_code: { $regex: q, $options: "i" } },
      { recipient_name: { $regex: q, $options: "i" } },
      { recipient_phone: { $regex: q, $options: "i" } },
      { recipient_address: { $regex: q, $options: "i" } },
    ];
  }

  const total = await db.collection(PARCELS_COLLECTION).countDocuments(filter);
  const rawParcels = await db
    .collection(PARCELS_COLLECTION)
    .find(filter)
    .sort({ createdAt: -1 })
    .skip(options.skip || 0)
    .limit(options.limit || 50)
    .toArray();

  const parcels: SteadfastParcel[] = rawParcels.map((doc) => ({
    _id: doc._id.toString(),
    userId: doc.userId,
    invoice: doc.invoice,
    recipient_name: doc.recipient_name,
    recipient_phone: doc.recipient_phone,
    recipient_address: doc.recipient_address,
    area: doc.area,
    exact_area: doc.exact_area,
    cod_amount: doc.cod_amount,
    note: doc.note,
    item_description: doc.item_description,
    total_lot: doc.total_lot,
    delivery_type: doc.delivery_type,
    consignment_id: doc.consignment_id,
    tracking_code: doc.tracking_code,
    status: doc.status,
    tracking_url: doc.tracking_url || `https://steadfast.com.bd/t/${doc.tracking_code}`,
    rawResponse: doc.rawResponse,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  }));

  return { parcels, total };
}

/**
 * Update parcel status in MongoDB
 */
export async function updateParcelStatus(
  userId: string,
  parcelIdOrCid: string | number,
  status: string,
  rawStatusResponse?: any
): Promise<boolean> {
  const db = getDb();
  
  let query: any = { userId };
  if (ObjectId.isValid(String(parcelIdOrCid)) && String(parcelIdOrCid).length === 24) {
    query._id = new ObjectId(String(parcelIdOrCid));
  } else {
    query.$or = [
      { consignment_id: parcelIdOrCid },
      { consignment_id: Number(parcelIdOrCid) },
      { tracking_code: String(parcelIdOrCid) },
      { invoice: String(parcelIdOrCid) },
    ];
  }

  const updateDoc: any = {
    $set: {
      status,
      updatedAt: new Date(),
    },
  };

  if (rawStatusResponse) {
    updateDoc.$set.lastStatusSync = rawStatusResponse;
  }

  const result = await db.collection(PARCELS_COLLECTION).updateOne(query, updateDoc);
  return result.modifiedCount > 0;
}

