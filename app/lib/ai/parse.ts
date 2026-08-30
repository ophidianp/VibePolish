import { splitThinking } from "./thinking.ts";
import type { RewriteResult } from "./types";

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

/**
 * Normalizes a provider's raw text response into a RewriteResult.
 *
 * Providers are asked for strict JSON (see prompt-builder.ts), but small
 * local models and hosted models alike sometimes wrap it in markdown fences,
 * add stray commentary, ramble through their reasoning first, or ignore the
 * instruction entirely. This extracts any reasoning first (see thinking.ts),
 * then tries JSON, then falls back to treating whatever text remains as the
 * rewrite itself — so a provider that "almost" followed instructions still
 * produces a usable result instead of a hard failure.
 */
export function parseStructuredResult(raw: string): RewriteResult {
  const { thinking, rest } = splitThinking(raw);

  const cleaned = rest
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/```\s*$/i, "")
    .trim();

  if (!cleaned) {
    return {
      text: "",
      thinking,
      errors: [thinking ? "Provider only produced reasoning, never a finished rewrite." : "Provider returned an empty response."],
    };
  }

  try {
    const parsed: unknown = JSON.parse(cleaned);
    if (parsed && typeof parsed === "object" && "text" in parsed && typeof (parsed as { text: unknown }).text === "string") {
      const candidate = parsed as { text: string; tone?: unknown; confidence?: unknown; errors?: unknown };
      const text = candidate.text.trim();
      return {
        text,
        thinking,
        tone: typeof candidate.tone === "string" ? candidate.tone : undefined,
        confidence: typeof candidate.confidence === "number" ? clamp(candidate.confidence, 0, 1) : undefined,
        errors: Array.isArray(candidate.errors)
          ? candidate.errors.filter((item): item is string => typeof item === "string")
          : undefined,
      };
    }
  } catch {
    // Not valid JSON — fall through to the plain-text fallback below.
  }

  // The provider ignored the JSON contract. Treat its raw output as the
  // rewrite itself rather than discarding a perfectly usable answer.
  return {
    text: cleaned,
    thinking,
    errors: ["Provider response was not valid structured JSON; used raw text as the rewrite."],
  };
}
