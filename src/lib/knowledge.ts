// src/lib/knowledge.ts
import { getDb } from "./db";
import { ObjectId } from "mongodb";
import { summarizeBusinessDocument } from "./gemini";

export interface BusinessDocument {
  _id?: ObjectId | string;
  userId?: string;
  pageId?: string; // Optional: specific to a Facebook Page or all pages
  title: string;
  fileName: string;
  fileType: "pdf" | "txt" | "docx" | "csv" | "faq" | "manual";
  size: string;
  content: string; // Plain text content used by AI
  summary?: string;
  keyTopics?: string[];
  chunks?: string[];
  status: "ready" | "training" | "trained" | "error";
  uploadedAt: Date;
  updatedAt: Date;
}

const COLLECTION_NAME = "business_knowledge";

/**
 * Split text into manageable chunks of ~500-1000 characters
 */
export function chunkText(text: string, chunkSize = 800, overlap = 100): string[] {
  if (!text) return [];
  const clean = text.replace(/\s+/g, " ").trim();
  if (clean.length <= chunkSize) return [clean];

  const chunks: string[] = [];
  let i = 0;
  while (i < clean.length) {
    const end = Math.min(i + chunkSize, clean.length);
    chunks.push(clean.slice(i, end));
    i += chunkSize - overlap;
  }
  return chunks;
}

/**
 * Save a business document to MongoDB
 */
export async function saveDocument(doc: {
  userId?: string;
  pageId?: string;
  title: string;
  fileName: string;
  fileType: "pdf" | "txt" | "docx" | "csv" | "faq" | "manual";
  size?: string;
  content: string;
}): Promise<BusinessDocument> {
  const db = getDb();
  const collection = db.collection<BusinessDocument>(COLLECTION_NAME);

  const chunks = chunkText(doc.content);

  // Generate AI summary
  let summary = "";
  let keyTopics: string[] = [];
  try {
    const aiSummary = await summarizeBusinessDocument(doc.content, doc.fileName);
    summary = aiSummary.summary;
    keyTopics = aiSummary.keyTopics;
  } catch {
    summary = `${doc.title} (${doc.content.length} characters)`;
  }

  const newDoc: BusinessDocument = {
    userId: doc.userId || "default",
    pageId: doc.pageId || undefined,
    title: doc.title,
    fileName: doc.fileName,
    fileType: doc.fileType,
    size: doc.size || `${(doc.content.length / 1024).toFixed(1)} KB`,
    content: doc.content,
    summary,
    keyTopics,
    chunks,
    status: "trained",
    uploadedAt: new Date(),
    updatedAt: new Date(),
  };

  const result = await collection.insertOne(newDoc as any);
  newDoc._id = result.insertedId;
  return newDoc;
}

/**
 * Get all documents for a user or page
 */
export async function getDocuments(filter: {
  userId?: string;
  pageId?: string;
}): Promise<BusinessDocument[]> {
  const db = getDb();
  const collection = db.collection<BusinessDocument>(COLLECTION_NAME);

  const query: any = {};
  if (filter.userId && filter.userId !== "all") {
    // Also include documents with no userId or "default"
    query.$or = [{ userId: filter.userId }, { userId: "default" }, { userId: { $exists: false } }];
  }
  if (filter.pageId) {
    query.$or = [...(query.$or || []), { pageId: filter.pageId }, { pageId: { $exists: false } }];
  }

  const docs = await collection.find(query).sort({ uploadedAt: -1 }).toArray();
  return docs.map((d) => ({
    ...d,
    _id: d._id.toString(),
  }));
}

/**
 * Delete a document by ID
 */
export async function deleteDocument(docId: string): Promise<boolean> {
  const db = getDb();
  const collection = db.collection<BusinessDocument>(COLLECTION_NAME);

  let filter: any;
  try {
    filter = { _id: new ObjectId(docId) };
  } catch {
    filter = { _id: docId };
  }

  const res = await collection.deleteOne(filter);
  return res.deletedCount > 0;
}

/**
 * Retrieve relevant business knowledge for a customer's query
 */
export async function getRelevantKnowledge(
  query: string,
  options: { userId?: string; pageId?: string } = {},
): Promise<string> {
  const docs = await getDocuments(options);
  if (!docs || docs.length === 0) {
    return "";
  }

  // If the total knowledge across all documents is under ~15,000 words,
  // we can provide full context directly into Gemini Flash for maximum accuracy!
  const totalLength = docs.reduce((acc, d) => acc + (d.content?.length || 0), 0);

  if (totalLength <= 60000) {
    return docs
      .map(
        (d, idx) =>
          `[DOCUMENT #${idx + 1}: ${d.title} (${d.fileName})]\n${d.content}\n`,
      )
      .join("\n---\n\n");
  }

  // For larger sets, perform smart keyword/chunk scoring
  const keywords = query
    .toLowerCase()
    .split(/\s+/)
    .filter((w) => w.length > 2);

  const scoredChunks: Array<{ chunk: string; score: number; docTitle: string }> = [];

  for (const doc of docs) {
    const chunks = doc.chunks && doc.chunks.length > 0 ? doc.chunks : [doc.content];
    for (const chunk of chunks) {
      const lower = chunk.toLowerCase();
      let score = 0;
      for (const kw of keywords) {
        if (lower.includes(kw)) score += 1;
      }
      scoredChunks.push({
        chunk,
        score,
        docTitle: doc.title,
      });
    }
  }

  // Sort by score descending and pick top 15 chunks
  scoredChunks.sort((a, b) => b.score - a.score);
  const topChunks = scoredChunks.slice(0, 15);

  return topChunks
    .map(
      (c, idx) =>
        `[KNOWLEDGE CHUNK #${idx + 1} from "${c.docTitle}"]\n${c.chunk}`,
    )
    .join("\n\n---\n\n");
}

