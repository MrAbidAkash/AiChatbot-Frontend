import { MongoClient, Db } from "mongodb";
import { PaymentRecord } from "./bkash";

let client: MongoClient;
let db: Db;

async function connectToDatabase() {
  if (client && db) {
    return { client, db };
  }

  const uri = process.env.MONGODB_URI!;
  client = new MongoClient(uri);

  await client.connect();

  // Extract database name from URI or use default
  let dbName = "aichatbot"; // default fallback

  try {
    // Extract database name from URI (last part after /)
    const uri = process.env.MONGODB_URI!;
    const parsedUrl = new URL(uri);
    const pathname = parsedUrl.pathname;
    if (pathname && pathname !== "/") {
      dbName = pathname.replace(/^\//, ""); // Remove leading slash
    }
  } catch {
    console.warn("Failed to parse MongoDB URI, using default database name");
  }

  db = client.db(dbName);

  return { client, db };
}

export async function savePaymentRecord(
  paymentData: Omit<
    PaymentRecord,
    | "_id"
    | "trxID"
    | "currency"
    | "merchantInvoiceNo"
    | "createdAt"
    | "updatedAt"
  >,
): Promise<PaymentRecord> {
  const { db } = await connectToDatabase();

  const record = {
    ...paymentData,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const result = await db.collection("payments").insertOne(record);

  return {
    ...record,
    _id: result.insertedId.toString(),
  } as PaymentRecord;
}

export async function updatePaymentRecord(
  paymentID: string,
  updateData: Partial<PaymentRecord>,
): Promise<PaymentRecord | null> {
  const { db } = await connectToDatabase();

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { _id, ...updateFields } = updateData;

  const result = await db.collection("payments").findOneAndUpdate(
    { paymentID },
    {
      $set: {
        ...updateFields,
        updatedAt: new Date(),
      },
    },
    { returnDocument: "after" },
  );

  if (!result || !result.value) {
    return null;
  }

  const updatedRecord = result.value;

  return {
    ...updatedRecord,
    _id: updatedRecord._id.toString(),
  } as PaymentRecord;
}

export async function findPaymentRecord(
  paymentID: string,
): Promise<PaymentRecord | null> {
  const { db } = await connectToDatabase();

  const record = await db.collection("payments").findOne({ paymentID });

  if (!record) {
    return null;
  }

  return {
    ...record,
    _id: record._id.toString(),
  } as PaymentRecord;
}

export async function findPaymentRecordByCustomerInfo(
  email: string,
): Promise<PaymentRecord | null> {
  const { db } = await connectToDatabase();

  const record = await db.collection("payments").findOne({
    "customerInfo.email": email,
  });

  if (!record) {
    return null;
  }

  return {
    ...record,
    _id: record._id.toString(),
  } as PaymentRecord;
}
