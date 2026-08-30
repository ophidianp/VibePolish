import { buildSystemPrompt, buildUserPrompt } from "../prompt-builder";
import { parseStructuredResult } from "../parse";
import type { AIProvider, RewriteRequest, RewriteResult } from "../types";

export interface GeminiProviderOptions {
  apiKey?: string;
  model?: string;
}

/**
 * Hosted Gemini backend. Requires GEMINI_API_KEY. The key is read from the
 * environment on the server only — this module is never imported from a
 * client component, so the key never reaches the browser.
 */
export function createGeminiProvider(options: GeminiProviderOptions = {}): AIProvider {
  const apiKey = options.apiKey ?? process.env.GEMINI_API_KEY;
  const model = options.model ?? process.env.GEMINI_MODEL ?? "gemini-2.0-flash";

  return {
    id: "gemini",

    async isAvailable() {
      return Boolean(apiKey);
    },

    async generate(request: RewriteRequest): Promise<RewriteResult> {
      if (!apiKey) {
        throw new Error("GEMINI_API_KEY is not configured.");
      }

      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          signal: AbortSignal.timeout(30_000),
          body: JSON.stringify({
            systemInstruction: { parts: [{ text: buildSystemPrompt(request.context) }] },
            contents: [{ parts: [{ text: buildUserPrompt(request.content, request.context) }] }],
            generationConfig: { temperature: 0.8, responseMimeType: "application/json" },
          }),
        },
      );

      if (!response.ok) {
        throw new Error(`Gemini request failed with status ${response.status}.`);
      }

      const result = (await response.json()) as {
        candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
      };
      const raw = result.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
      if (!raw) {
        throw new Error("Gemini returned an empty response.");
      }

      return parseStructuredResult(raw);
    },
  };
}
