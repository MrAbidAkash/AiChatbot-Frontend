// src/lib/gemini.ts

export interface GeminiMessage {
  role: "user" | "model";
  parts: Array<{ text: string }>;
}

export interface GenerateReplyOptions {
  customerMessage: string;
  businessKnowledge: string;
  businessName?: string;
  botTone?: "friendly" | "professional" | "formal" | "casual";
  customInstructions?: string;
  fallbackMessage?: string;
  conversationHistory?: Array<{
    senderType: "customer" | "ai" | "human";
    text: string;
  }>;
}

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || "";
const DEFAULT_MODEL = "gemini-1.5-flash";
const FALLBACK_MODELS = [
  "gemini-2.0-flash",
  "gemini-1.5-flash-latest",
  "gemini-1.5-pro",
];

/**
 * Generate an AI response to a customer message using Gemini 1.5 / 2.0 Flash,
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
    businessName = "ChatTime AI (Solvence Labs)",
    botTone = "friendly",
    customInstructions = "",
    fallbackMessage = "I don't have that specific information right now. Please allow our team member to get back to you shortly, or contact our customer support.",
    conversationHistory = [],
  } = options;

  const toneGuidanceMap: Record<string, string> = {
    friendly:
      'Warm, welcoming, sweet, and highly polite boutique store tone. In Bengali or Banglish, warmly address the customer as "আপু" or "ভাইয়া" (or "আপু/ভাইয়া") naturally (e.g., "জি আপু/ভাইয়া", "ধন্যবাদ ভাইয়া/আপু", "আপু/ভাইয়া কীভাবে সাহায্য করতে পারি?"). Be extremely hospitable and friendly.',
    formal:
      'Highly respectful, polite, and dignified formal tone (শ্রদ্ধাশীল). In Bengali or Banglish, strictly use respectful pronouns ("আপনি", "আপনার") and address the customer as "স্যার" or "ম্যাম" (Sir/Madam). Do NOT use casual terms like "আপু/ভাইয়া". Crisp, polite, and professional.',
    casual:
      'Friendly, modern, relaxed, and cheerful peer tone (বন্ধুভাবাপন্ন). Warm, enthusiastic, and approachable like chatting with a helpful companion.',
    professional:
      'Articulate, polite, concise, business-focused, and respectful. Clear, objective, and solution-oriented.',
  };

  const toneGuidance =
    toneGuidanceMap[botTone] ||
    "Warm, polite, respectful, and helpful customer service.";

  const systemInstruction = `You are a professional customer support and sales representative for "${businessName}" on Facebook Messenger.
Your role is to assist customers politely, accurately, and naturally based on the provided Business Knowledge and Documents.

TONE & PERSONALITY:
- ${toneGuidance}
- Speak like an articulate, thoughtful human professional. Never sound like a robotic search engine, a raw database dump, or a stiff Wikipedia entry.

CRITICAL RULES:

1. LANGUAGE MATCHING (STRICT):
   - Always reply in the EXACT language used by the customer in their message!
   - If the customer asks in English (e.g., "Who is abidur Rahman", "What are your services?"), you MUST respond entirely in fluent, natural English. Do NOT reply in Bengali if the customer wrote in English!
   - If the customer asks in Bengali (বাংলা) (e.g., "ডেলিভারি চার্জ কত?", "আবিদুর রহমান কে?"), reply in natural, polished Bengali.
   - If the customer writes in Banglish (e.g., "Delivery charge koto?"), reply in polite, natural Banglish or Bengali.

2. CLEAN MESSENGER FORMATTING (NO UGLY MARKDOWN):
   - Facebook Messenger renders on mobile screens. Do NOT clutter responses with raw markdown asterisks (avoid **bold labels:** like "**বর্তমান পেশা:**"), headers (###), or nested sub-bullets.
   - Use clean, well-spaced paragraphs and natural sentences.
   - If listing multiple items, use clean bullet points (•) with simple text, never nested sub-bullets or raw markdown asterisks.
   - Never use awkward phonetic parentheticals like "এসএএএস (SaaS)" or "এআরপি (ERP)". Write naturally (e.g., "SaaS platform" or "ERP software").

3. DIRECT & COMPLETE RESPONSES:
   - Answer the customer's question directly in the very first sentence.
   - Always finish your sentences completely! Never truncate or end abruptly mid-thought.
   - End your response with a courteous, helpful follow-up or call to action (e.g., "Would you like to know more about any specific project or service?", "How can I help you with this today?").

4. FACTUAL GROUNDING:
   - Base your answers ONLY on the provided "BUSINESS KNOWLEDGE & DOCUMENTS" below. Do not invent products, prices, or claims not found in the documents.
   - If the customer asks something that is NOT covered in the documents, do not guess or fabricate information. Politely explain:
   "${fallbackMessage}"

5. SPECIAL BUSINESS & SALES INSTRUCTIONS (STRICTEST PRIORITY):
   - If the business owner has specified a custom instruction below (e.g. how to respond when a customer asks for a discount, or what to do when an item is out of stock, or specific promotion scripts), you MUST strictly follow that exact instruction whenever the customer's query triggers it!

${
  customInstructions && customInstructions.trim()
    ? `=======================================
SPECIAL BUSINESS & SALES INSTRUCTIONS:
${customInstructions.trim()}
=======================================`
    : ""
}

BUSINESS KNOWLEDGE & DOCUMENTS:
=======================================
${businessKnowledge ? businessKnowledge : "No specific business documents uploaded yet. Rely on standard polite customer greeting and advise that a team member will assist."}
=======================================`;

  // Build conversation history for multi-turn context (ensuring alternating user/model turns)
  const contents: GeminiMessage[] = [];
  let lastRole: "user" | "model" | null = null;

  // Add previous history (excluding duplicate of current customerMessage)
  const previousHistory = conversationHistory
    .filter(
      (h, idx) =>
        !(
          idx === conversationHistory.length - 1 &&
          h.senderType === "customer" &&
          h.text.trim() === customerMessage.trim()
        ),
    )
    .slice(-6);

  for (const hist of previousHistory) {
    const role: "user" | "model" = hist.senderType === "customer" ? "user" : "model";
    if (role === lastRole && contents.length > 0) {
      contents[contents.length - 1].parts[0].text += `\n${hist.text}`;
    } else {
      contents.push({
        role,
        parts: [{ text: hist.text }],
      });
      lastRole = role;
    }
  }

  // Add current customer message
  if (lastRole === "user" && contents.length > 0) {
    contents[contents.length - 1].parts[0].text = customerMessage;
  } else {
    contents.push({
      role: "user",
      parts: [{ text: customerMessage }],
    });
  }

  const requestBody = {
    system_instruction: {
      parts: [{ text: systemInstruction }],
    },
    contents,
    generationConfig: {
      temperature: 0.4,
      maxOutputTokens: 2048,
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

/**
 * Extract all readable text from a PDF buffer using Gemini Multimodal AI.
 * Completely immune to Next.js server worker / pdfjs-dist bundle errors,
 * and handles scanned pages, tables, Bengali, English, and complex layouts.
 */
export async function extractPdfTextWithGemini(
  pdfBuffer: Buffer,
  fileName = "document.pdf",
): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY || GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not configured in environment variables.");
  }

  const base64Data = pdfBuffer.toString("base64");
  const models = [DEFAULT_MODEL, ...FALLBACK_MODELS];
  let lastError: any = null;

  for (const model of models) {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  inline_data: {
                    mime_type: "application/pdf",
                    data: base64Data,
                  },
                },
                {
                  text: "You are an accurate document transcription system. Extract and return ALL text, headings, policies, pricing, contact details, and bullet points from this document verbatim. Return ONLY the transcribed text in full, preserving sections and formatting. Do not add commentary.",
                },
              ],
            },
          ],
          generationConfig: {
            temperature: 0.1,
            maxOutputTokens: 8192,
          },
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.warn(`Gemini PDF extraction on ${model} failed (${response.status}):`, errorText);
        lastError = new Error(`Gemini ${model} failed: ${errorText}`);
        continue;
      }

      const data = await response.json();
      const extracted = data.candidates?.[0]?.content?.parts?.[0]?.text;
      if (extracted && extracted.trim()) {
        return extracted.trim();
      }
    } catch (err) {
      console.warn(`Error extracting PDF with ${model}:`, err);
      lastError = err;
    }
  }

  throw lastError || new Error(`Failed to extract text from PDF "${fileName}".`);
}

