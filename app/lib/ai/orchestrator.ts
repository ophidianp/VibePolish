import type { AIProvider, RewriteRequest, RewriteResult } from "./types";

export interface OrchestratorResult extends RewriteResult {
  /** Which provider actually produced the result, e.g. for status messages in the UI. */
  provider: AIProvider["id"];
}

export class NoProviderAvailableError extends Error {
  readonly attempts: string[];

  constructor(attempts: string[]) {
    super(`No AI provider responded. Tried: ${attempts.join("; ") || "no providers configured"}.`);
    this.name = "NoProviderAvailableError";
    this.attempts = attempts;
  }
}

/**
 * Tries each provider in order, skipping ones that report themselves
 * unavailable and falling through to the next one on any error or empty
 * result. This is the single place that implements "fallback if a provider
 * is unavailable or returns an error" — providers themselves stay simple.
 */
export async function generateWithFallback(
  providers: AIProvider[],
  request: RewriteRequest,
): Promise<OrchestratorResult> {
  const attempts: string[] = [];

  for (const provider of providers) {
    try {
      const available = await provider.isAvailable();
      if (!available) {
        attempts.push(`${provider.id} (not configured or unreachable)`);
        continue;
      }

      const result = await provider.generate(request);
      if (!result.text) {
        attempts.push(`${provider.id} (returned no usable text)`);
        continue;
      }

      return { ...result, provider: provider.id };
    } catch (error) {
      attempts.push(`${provider.id} (${error instanceof Error ? error.message : "unknown error"})`);
    }
  }

  throw new NoProviderAvailableError(attempts);
}
