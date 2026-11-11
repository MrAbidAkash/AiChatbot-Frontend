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
  fileType: "pdf" | "txt" | "docx" | "csv" | "faq" | "manual" | "sheet" | "doc" | "drive";
  size: string;
  content: string; // Plain text content used by AI
  summary?: string;
  keyTopics?: string[];
  chunks?: string[];
  metadata?: Record<string, any>;
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
 * If replaceExisting is true (or for singleton rules like "Store Delivery & Policy Rules"),
 * it updates the existing document and deletes any stale duplicates.
 */
export async function saveDocument(doc: {
  userId?: string;
  pageId?: string;
  title: string;
  fileName: string;
  fileType: "pdf" | "txt" | "docx" | "csv" | "faq" | "manual" | "sheet" | "doc" | "drive";
  size?: string;
  content: string;
  metadata?: Record<string, any>;
  replaceExisting?: boolean;
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

  const shouldReplace = doc.replaceExisting || doc.title === "Store Delivery & Policy Rules";

  if (shouldReplace) {
    const filterQuery: any = {
      title: doc.title,
    };
    if (doc.userId && doc.userId !== "all") {
      filterQuery.userId = doc.userId;
    }
    if (doc.pageId) {
      filterQuery.pageId = doc.pageId;
    } else {
      filterQuery.$or = [{ pageId: null }, { pageId: { $exists: false } }];
    }

    const existingDocs = await collection
      .find(filterQuery)
      .sort({ updatedAt: -1, uploadedAt: -1 })
      .toArray();

    if (existingDocs.length > 0) {
      const primaryDoc = existingDocs[0];
      const primaryId = primaryDoc._id;

      // Clean up any duplicates that might have been created previously
      if (existingDocs.length > 1) {
        const extraIds = existingDocs.slice(1).map((d) => d._id);
        await collection.deleteMany({ _id: { $in: extraIds } });
      }

      const updateData = {
        fileName: doc.fileName,
        fileType: doc.fileType,
        size: doc.size || `${(doc.content.length / 1024).toFixed(1)} KB`,
        content: doc.content,
        summary,
        keyTopics,
        chunks,
        metadata: doc.metadata || primaryDoc.metadata,
        status: "trained" as const,
        updatedAt: new Date(),
      };

      await collection.updateOne(
        { _id: primaryId },
        { $set: updateData }
      );

      return {
        ...primaryDoc,
        ...updateData,
        _id: primaryId.toString(),
      };
    }
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
    metadata: doc.metadata,
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
 * Automatically cleans up and deduplicates singleton rules like "Store Delivery & Policy Rules"
 */
export async function getDocuments(filter: {
  userId?: string;
  pageId?: string;
  strictPage?: boolean;
} = {}): Promise<BusinessDocument[]> {
  const db = getDb();
  const collection = db.collection<BusinessDocument>(COLLECTION_NAME);

  const query: any = {};
  if (filter.pageId) {
    if (filter.pageId === "global") {
      const pageConditions: any[] = [{ pageId: null }, { pageId: { $exists: false } }];
      if (filter.userId && filter.userId !== "all") {
        query.$and = [
          { $or: [{ userId: filter.userId }, { userId: "default" }, { userId: { $exists: false } }] },
          { $or: pageConditions },
        ];
      } else {
        query.$or = pageConditions;
      }
    } else if (filter.strictPage) {
      query.pageId = filter.pageId;
    } else {
      // For a specific page, return docs explicitly assigned to this page,
      // OR global docs (with matching userId or default)
      if (filter.userId && filter.userId !== "all") {
        query.$or = [
          { pageId: filter.pageId },
          {
            $and: [
              { $or: [{ userId: filter.userId }, { userId: "default" }, { userId: { $exists: false } }] },
              { $or: [{ pageId: null }, { pageId: { $exists: false } }] },
            ],
          },
        ];
      } else {
        query.$or = [
          { pageId: filter.pageId },
          { pageId: null },
          { pageId: { $exists: false } },
        ];
      }
    }
  } else if (filter.userId && filter.userId !== "all") {
    query.$or = [{ userId: filter.userId }, { userId: "default" }, { userId: { $exists: false } }];
  }

  const docs = await collection.find(query).sort({ updatedAt: -1, uploadedAt: -1 }).toArray();

  // If querying for a specific page, check if page-specific policy exists
  const hasPageSpecificPolicy =
    filter.pageId && filter.pageId !== "global"
      ? docs.some(
          (d) => d.title === "Store Delivery & Policy Rules" && d.pageId === filter.pageId
        )
      : false;

  // Deduplicate singleton rules like "Store Delivery & Policy Rules" per user/page
  const seenPolicyKeys = new Set<string>();
  const duplicateIdsToDelete: any[] = [];
  const uniqueDocs: typeof docs = [];

  for (const doc of docs) {
    if (doc.title === "Store Delivery & Policy Rules") {
      // If a page-specific policy exists, don't include global policy for this page's context
      if (hasPageSpecificPolicy && !doc.pageId && filter.pageId && filter.pageId !== "global") {
        continue;
      }

      const policyKey = `${doc.userId || "default"}_${doc.pageId || "default"}`;
      if (seenPolicyKeys.has(policyKey)) {
        duplicateIdsToDelete.push(doc._id);
        continue;
      }
      seenPolicyKeys.add(policyKey);
    }
    uniqueDocs.push(doc);
  }

  // Auto clean-up stale duplicates from database
  if (duplicateIdsToDelete.length > 0) {
    try {
      await collection.deleteMany({ _id: { $in: duplicateIdsToDelete } });
    } catch (e) {
      console.error("Failed to clean up duplicate policy documents:", e);
    }
  }

  return uniqueDocs.map((d) => ({
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
    console.warn(`[Knowledge] No documents found in database for user/page.`);
    return "";
  }

  console.log(`[Knowledge] Retrieved ${docs.length} document(s) for query "${query}". Total chars: ${docs.reduce((acc, d) => acc + (d.content?.length || 0), 0)}`);

  // If the total knowledge across all documents is under ~15,000 words,
  // we provide full context directly into Gemini Flash for maximum accuracy!
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

