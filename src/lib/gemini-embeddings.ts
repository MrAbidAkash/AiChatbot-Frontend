// src/lib/gemini-embeddings.ts

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || "";
const EMBEDDING_MODEL = "text-embedding-004";

/**
 * Generate a 768-dimensional vector embedding for a single text using Gemini text-embedding-004.
 */
export async function embedTextWithGemini(text: string): Promise<number[] | null> {
  const apiKey = process.env.GEMINI_API_KEY || GEMINI_API_KEY;
  if (!apiKey || !text || !text.trim()) {
    return null;
  }

  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${EMBEDDING_MODEL}:embedContent?key=${apiKey}`;
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: `models/${EMBEDDING_MODEL}`,
        content: {
          parts: [{ text: text.slice(0, 4000) }],
        },
      }),
    });

    if (!response.ok) {
      console.warn(`[Embeddings] Gemini embedContent failed (${response.status}):`, await response.text());
      return null;
    }

    const data = await response.json();
    const values: number[] = data.embedding?.values;
    if (Array.isArray(values) && values.length > 0) {
      return values;
    }
  } catch (error) {
    console.warn("[Embeddings] Error generating text embedding:", error);
  }

  return null;
}

/**
 * Generate vector embeddings for a batch of text chunks (up to 50 at a time) using Gemini text-embedding-004.
 */
export async function batchEmbedTextsWithGemini(texts: string[]): Promise<number[][] | null> {
  const apiKey = process.env.GEMINI_API_KEY || GEMINI_API_KEY;
  if (!apiKey || !texts || texts.length === 0) {
    return null;
  }

  const cleanTexts = texts.map((t) => t.trim().slice(0, 4000)).filter(Boolean);
  if (cleanTexts.length === 0) return [];

  const results: number[][] = [];
  const chunkSize = 50; // Gemini supports up to 100 requests per batchEmbedContents call

  for (let i = 0; i < cleanTexts.length; i += chunkSize) {
    const batch = cleanTexts.slice(i, i + chunkSize);
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${EMBEDDING_MODEL}:batchEmbedContents?key=${apiKey}`;
      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          requests: batch.map((text) => ({
            model: `models/${EMBEDDING_MODEL}`,
            content: { parts: [{ text }] },
          })),
        }),
      });

      if (!response.ok) {
        console.warn(`[Embeddings] Batch embedding request failed (${response.status}):`, await response.text());
        return null;
      }

      const data = await response.json();
      const embeddings = data.embeddings;
      if (Array.isArray(embeddings)) {
        for (const item of embeddings) {
          if (Array.isArray(item.values)) {
            results.push(item.values);
          }
        }
      }
    } catch (err) {
      console.warn("[Embeddings] Error in batchEmbedContents:", err);
      return null;
    }
  }

  return results.length === cleanTexts.length ? results : null;
}

/**
 * Compute the cosine similarity between two numeric vectors.
 * Returns a score between -1.0 and 1.0 (1.0 = identical angle/meaning).
 */
export function cosineSimilarity(a: number[], b: number[]): number {
  if (!a || !b || a.length !== b.length || a.length === 0) {
    return 0;
  }

  let dot = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }

  const denominator = Math.sqrt(normA) * Math.sqrt(normB);
  if (denominator === 0) return 0;
  return dot / denominator;
}

export interface ChunkWithEmbedding {
  chunkIndex?: number;
  text: string;
  docTitle?: string;
  embedding: number[];
}

export interface ScoredChunk {
  text: string;
  docTitle: string;
  score: number;
}

/**
 * Find the top K most semantically relevant chunks for a given query vector.
 */
export function findTopSemanticChunks(
  queryEmbedding: number[],
  chunks: ChunkWithEmbedding[],
  options: {
    topK?: number;
    minScore?: number;
  } = {},
): ScoredChunk[] {
  const { topK = 6, minScore = 0.35 } = options;

  const scored: ScoredChunk[] = [];

  for (const chunk of chunks) {
    if (!chunk.embedding || chunk.embedding.length === 0) continue;
    const score = cosineSimilarity(queryEmbedding, chunk.embedding);
    if (score >= minScore) {
      scored.push({
        text: chunk.text,
        docTitle: chunk.docTitle || "Business Document",
        score,
      });
    }
  }

  // Sort descending by score
  scored.sort((a, b) => b.score - a.score);

  return scored.slice(0, topK);
}

