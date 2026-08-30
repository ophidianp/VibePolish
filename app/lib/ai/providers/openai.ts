import { buildSystemPrompt, buildUserPrompt } from "../prompt-builder";
import { parseStructuredResult } from "../parse";
import type { AIProvider, RewriteRequest, RewriteResult } from "../types";

export interface OpenAiProviderOptions {
  apiKey?: string;
  model?: string;
}

/**
 * Hosted OpenAI backend. Optional — not documented in the README's setup
 * instructions, but the original /api/rewrite route already supported it as
 * a last-resort fallback, so it's kept here rather than dropped. Requires
 * OPENAI_API_KEY; the key stays server-side only.
 */
export function createOpenAiProvider(options: OpenAiProviderOptions = {}): AIProvider {
  const apiKey = options.apiKey ?? process.env.OPENAI_API_KEY;
  const model = options.model ?? process.env.OPENAI_MODEL ?? "gpt-4o-mini";

  return {
    id: "openai",

    async isAvailable() {
      return Boolean(apiKey);
    },

    async generate(request: RewriteRequest): Promise<RewriteResult> {
      if (!apiKey) {
        throw new Error("OPENAI_API_KEY is not configured.");
      }

      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        signal: AbortSignal.timeout(30_000),
        body: JSON.stringify({
          model,
          temperature: 0.8,
          response_format: { type: "json_object" },
          messages: [
            { role: "system", content: buildSystemPrompt(request.context) },
            { role: "user", content: buildUserPrompt(request.content, request.context) },
          ],
        }),
      });

      if (!response.ok) {
        throw new Error(`OpenAI request failed with status ${response.status}.`);
      }

      const result = (await response.json()) as {
        choices?: Array<{ message?: { content?: string } }>;
      };
      const raw = result.choices?.[0]?.message?.content?.trim();
      if (!raw) {
        throw new Error("OpenAI returned an empty response.");
      }

      return parseStructuredResult(raw);
    },
  };
}
