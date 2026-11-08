// src/lib/gemini.ts

export interface GeminiMessage {
  role: "user" | "model";
  parts: Array<{ text: string }>;
}

export interface GenerateReplyOptions {
  customerMessage: string;
  businessKnowledge: string;
  businessName?: string;
  botTone?: "friendly" | "professional" | "casual";
  customInstructions?: string;
  fallbackMessage?: string;
  conversationHistory?: Array<{
    senderType: "customer" | "ai" | "human";
    text: string;
  }>;
}

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || "";
const DEFAULT_MODEL = "gemini-flash-lite-latest";
const FALLBACK_MODELS = ["gemini-3.5-flash-lite", "gemini-flash-latest"];

/**
 * Generate an AI response to a customer message using Gemini 2.5 Flash,
 * grounded strictly in the provided business documents and knowledge.
 */
export async function generateCustomerReply(
  options: GenerateReplyOptions,
): Promise<{ reply: string; modelUsed: string }> {
  const apiKey = process.env.GEMINI_API_KEY || GEMINI_API_KEY;

  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not configured in environment variables.");
  }

  const {
    customerMessage,
    businessKnowledge,
    businessName = "ChatTime Business",
    botTone = "friendly",
    customInstructions = "",
    fallbackMessage = "I don't have that specific information right now. Please allow our team member to get back to you shortly, or contact our customer support.",
    conversationHistory = [],
  } = options;

  const toneGuidance = {
    friendly: "Warm, welcoming, polite, helpful, and approachable.",
    professional: "Polite, formal, concise, and highly professional.",
    casual: "Friendly, casual, conversational, and energetic.",
  }[botTone] || "Warm, polite, and helpful.";

  const systemInstruction = `You are an automated customer support assistant for "${businessName}" on Facebook Messenger.
Your goal is to assist customers promptly, politely, and accurately by analyzing the provided Business Knowledge and Documents.

TONE & PERSONALITY:
- ${toneGuidance}

CORE RULES:
1. STRICT FACTUAL ACCURACY: Base your answers ONLY on the information provided in the "BUSINESS KNOWLEDGE & DOCUMENTS" section below. Do NOT make up prices, products, discounts, return terms, addresses, or phone numbers that are not documented.
2. MISSING INFORMATION: If the customer's question cannot be answered from the provided business documents, do NOT guess. Politely reply with:
"${fallbackMessage}"
(Or adapt this politely into the customer's language, offering a human agent follow-up).
3. LANGUAGE MATCHING: Respond in the same language the customer uses!
   - If the customer writes in Bengali (বাংলা) or Banglish, answer naturally in Bengali or Banglish.
   - If the customer writes in English, answer in English.
   - If another language is used, reply in that language.
4. GREETINGS & SMALL TALK: For basic greetings (e.g., "Hi", "Hello", "Assalamu Alaikum", "কেমন আছেন"), respond warmly, introduce yourself as the AI assistant for ${businessName}, and ask how you can help them today.
5. CONCISENESS: Customers are reading on Facebook Messenger on mobile devices. Keep responses clear, easy to read, and well-spaced. Use bullet points when listing items or instructions. Avoid unnecessary walls of text.

${customInstructions ? `SPECIAL BUSINESS INSTRUCTIONS:\n${customInstructions}\n` : ""}

BUSINESS KNOWLEDGE & DOCUMENTS:
=======================================
${businessKnowledge ? businessKnowledge : "No specific business documents uploaded yet. Rely on standard polite customer greeting and advise that a team member will assist."}
=======================================`;

  // Build conversation history for multi-turn context
  const contents: GeminiMessage[] = [];

  // Add recent history (up to last 6 messages)
  const recentHistory = conversationHistory.slice(-6);
  for (const hist of recentHistory) {
    contents.push({
      role: hist.senderType === "customer" ? "user" : "model",
      parts: [{ text: hist.text }],
    });
  }

  // Add current customer message
  contents.push({
    role: "user",
    parts: [{ text: customerMessage }],
  });

  const requestBody = {
    system_instruction: {
      parts: [{ text: systemInstruction }],
    },
    contents,
    generationConfig: {
      temperature: 0.3, // Lower temperature for high fidelity to documents
      maxOutputTokens: 1024,
      topP: 0.95,
    },
  };

  // Try primary model first, fallback to secondary if needed
  const models = [DEFAULT_MODEL, ...FALLBACK_MODELS];
  let lastError: any = null;

  for (const model of models) {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.warn(`Gemini API call to ${model} failed with status ${response.status}:`, errorText);
        lastError = new Error(`Gemini ${model} error (${response.status}): ${errorText}`);
        continue;
      }

      const data = await response.json();
      const candidate = data.candidates?.[0];
      const replyText = candidate?.content?.parts?.[0]?.text;

      if (replyText && replyText.trim()) {
        return {
          reply: replyText.trim(),
          modelUsed: model,
        };
      }
    } catch (err) {
      console.warn(`Fetch error with model ${model}:`, err);
      lastError = err;
    }
  }

  throw lastError || new Error("Failed to generate response from Gemini API.");
}

/**
 * Summarize and extract key business facts from uploaded document text
 */
export async function summarizeBusinessDocument(
  text: string,
  fileName: string,
): Promise<{ summary: string; keyTopics: string[] }> {
  const apiKey = process.env.GEMINI_API_KEY || GEMINI_API_KEY;
  if (!apiKey) {
    return {
      summary: `Document: ${fileName} (${text.length} characters)`,
      keyTopics: ["general"],
    };
  }

  try {
    const prompt = `Analyze this business document ("${fileName}") and provide:
1. A concise 2-sentence summary of what this document covers.
2. A JSON list of 3-5 key topics/tags (e.g. ["pricing", "refund policy", "shipping"]).

Document text:
"""
${text.slice(0, 10000)}
"""

Format your response as JSON:
{
  "summary": "...",
  "keyTopics": ["...", "..."]
}`;

    const url = `https://generativelanguage.googleapis.com/v1beta/models/${DEFAULT_MODEL}:generateContent?key=${apiKey}`;
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        generationConfig: {
          responseMimeType: "application/json",
          temperature: 0.2,
        },
      }),
    });

    if (response.ok) {
      const data = await response.json();
      const rawJson = data.candidates?.[0]?.content?.parts?.[0]?.text;
      if (rawJson) {
        const parsed = JSON.parse(rawJson);
        return {
          summary: parsed.summary || `Business document: ${fileName}`,
          keyTopics: Array.isArray(parsed.keyTopics) ? parsed.keyTopics : [],
        };
      }
    }
  } catch (error) {
    console.error("Error summarizing document with Gemini:", error);
  }

  return {
    summary: `Business document "${fileName}" containing ${text.length} characters.`,
    keyTopics: ["business-knowledge"],
  };
}
