import { createGeminiProvider } from "./providers/gemini";
import { createOllamaProvider } from "./providers/ollama";
import { createOpenAiProvider } from "./providers/openai";
import type { AIProvider } from "./types";

/**
 * Default server-side fallback order: local Ollama first (free, private,
 * matches the README's recommended setup), then hosted Gemini, then hosted
 * OpenAI as a last resort. The browser-local model isn't included here —
 * it runs client-side in the editor and never touches this server module.
 */
export function createDefaultProviders(): AIProvider[] {
  return [createOllamaProvider(), createGeminiProvider(), createOpenAiProvider()];
}
