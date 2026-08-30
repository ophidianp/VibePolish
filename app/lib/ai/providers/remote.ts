"use client";

import type { AIProvider, RewriteRequest, RewriteResult } from "../types";

/**
 * Client-side stand-in for the entire server-side chain. Calling this hits
 * POST /api/rewrite, which itself tries Ollama, then Gemini, then OpenAI
 * (see registry.ts + orchestrator.ts) and returns whichever one succeeded.
 *
 * Exposing that whole chain as a single AIProvider lets the editor put it
 * in the same fallback list as the browser-local provider without knowing
 * or caring which hosted backend is actually configured.
 */
export function createRemoteProvider(): AIProvider {
  return {
    id: "remote",

    async isAvailable() {
      return true;
    },

    async generate(request: RewriteRequest): Promise<RewriteResult> {
      const response = await fetch("/api/rewrite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: request.content, targetModel: request.context?.targetModel }),
      });

      const data = (await response.json()) as {
        rewritten?: string;
        provider?: string;
        tone?: string;
        confidence?: number;
        errors?: string[];
        thinking?: string;
        error?: string;
      };

      if (!response.ok || !data.rewritten) {
        throw new Error(data.error ?? "The server-side AI providers did not respond.");
      }

      return { text: data.rewritten, tone: data.tone, confidence: data.confidence, errors: data.errors, thinking: data.thinking };
    },
  };
}
