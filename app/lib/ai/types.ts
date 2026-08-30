/**
 * Shared contract for the prompt-engine AI model layer.
 *
 * The editor UI never talks to Ollama, Gemini, or the browser-local model
 * directly — it goes through this interface so a new backend can be added
 * (or the fallback order changed) without touching any UI code.
 */

export type ProviderId = "ollama" | "gemini" | "openai" | "browser" | "remote";

/** Extra signal the caller can supply to steer a rewrite. */
export interface PromptContext {
  /** Name of the model the polished prompt is ultimately headed to (e.g. "Claude", "Gemini"). */
  targetModel?: string;
  /** Desired tone for the rewrite, e.g. "concise", "formal". */
  tone?: string;
  /** Free-form style rules to enforce (headings, voice, formatting, etc). */
  styleRules?: string[];
  /** Text the user had selected/highlighted, offered as extra context, not the thing being rewritten. */
  selectedText?: string;
}

export interface RewriteRequest {
  /** The raw, unpolished prompt content to rewrite. */
  content: string;
  context?: PromptContext;
}

/**
 * Structured result every provider must normalize its raw response into.
 * `text` is the only required field so a plain-text provider response still
 * degrades into a usable result.
 */
export interface RewriteResult {
  text: string;
  tone?: string;
  /** Provider's self-reported confidence in the rewrite, clamped to [0, 1]. */
  confidence?: number;
  /** Non-fatal issues surfaced by the provider or by parsing (e.g. "response was not valid JSON"). */
  errors?: string[];
  /**
   * Reasoning/chain-of-thought the model produced before (or instead of)
   * the actual rewrite. Extracted so the UI can show it separately — never
   * mixed into `text`. See thinking.ts.
   */
  thinking?: string;
}

/**
 * A single AI backend. Server-side providers (Ollama, Gemini, OpenAI) all
 * implement this the same way: check availability cheaply, then generate.
 * The browser-local provider also conforms to this shape client-side, as
 * does the "remote" proxy that lets the client fall through to the whole
 * server-side chain via /api/rewrite (see providers/browser.ts and
 * providers/remote.ts).
 */
export interface AIProvider {
  id: ProviderId;
  /** Cheap check for "is this backend configured and reachable right now". Never throws. */
  isAvailable(): Promise<boolean>;
  /** Perform the rewrite. May throw — callers (see orchestrator.ts) are expected to catch and fall back. */
  generate(request: RewriteRequest): Promise<RewriteResult>;
}
