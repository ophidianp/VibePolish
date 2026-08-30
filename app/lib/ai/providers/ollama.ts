import { buildSystemPrompt, buildUserPrompt } from "../prompt-builder";
import { parseStructuredResult } from "../parse";
import type { AIProvider, RewriteRequest, RewriteResult } from "../types";

export interface OllamaProviderOptions {
  url?: string;
  model?: string;
}

/**
 * Local Ollama backend. Runs entirely on the user's machine — no API key.
 * Availability is checked with a short-timeout hit to /api/tags so a missing
 * or unstarted `ollama serve` fails fast instead of blocking the fallback
 * chain for the full generation timeout.
 */
export function createOllamaProvider(options: OllamaProviderOptions = {}): AIProvider {
  const url = options.url ?? process.env.OLLAMA_URL ?? "http://127.0.0.1:11434";
  const model = options.model ?? process.env.OLLAMA_MODEL ?? "llama3.2:1b";

  return {
    id: "ollama",

    async isAvailable() {
      try {
        const response = await fetch(`${url}/api/tags`, { signal: AbortSignal.timeout(2_000) });
        return response.ok;
      } catch {
        return false;
      }
    },

    async generate(request: RewriteRequest): Promise<RewriteResult> {
      const response = await fetch(`${url}/api/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: AbortSignal.timeout(30_000),
        body: JSON.stringify({
          model,
          stream: false,
          system: buildSystemPrompt(request.context),
          prompt: buildUserPrompt(request.content, request.context),
          format: "json",
          options: { temperature: 0.8 },
        }),
      });

      if (!response.ok) {
        throw new Error(`Ollama request failed with status ${response.status}.`);
      }

      const result = (await response.json()) as { response?: string };
      if (!result.response?.trim()) {
        throw new Error("Ollama returned an empty response.");
      }

      return parseStructuredResult(result.response);
    },
  };
}
