import type { PromptContext } from "./types";

/**
 * Base instructions shared by every provider. Kept in one place so the
 * rewrite behavior can't drift between Ollama, Gemini, and OpenAI.
 */
export const DEFAULT_SYSTEM_PROMPT =
  "You are a prompt editor. Rewrite rough brain-dumps into genuinely clearer, more specific prompts. " +
  "Preserve every request, constraint, detail, and desired outcome. Infer a sensible objective from the " +
  "whole input; never merely paste the input under a heading. Remove conversational filler. Organize the " +
  "result with these headings: Objective, Context, Requirements, and Output format.";

/**
 * Instructs the model to answer with the RewriteResult JSON shape. Kept
 * separate from DEFAULT_SYSTEM_PROMPT so callers that want plain-text output
 * (or a custom schema) can opt out by passing their own systemPrompt.
 */
const STRUCTURED_OUTPUT_INSTRUCTIONS =
  'Respond with strict JSON only, matching this exact shape: ' +
  '{"text": string, "tone": string, "confidence": number between 0 and 1, "errors": string[]}. ' +
  '"text" is the finished, rewritten prompt — never reasoning, planning, or commentary about how you ' +
  "wrote it. If you need to think before answering, put that thinking in its own <think>...</think> " +
  "block before the JSON; the JSON itself must contain only the finished result. " +
  '"errors" should be an empty array unless something about the input made a faithful rewrite ' +
  "impossible. Do not wrap the JSON in markdown fences or add any commentary outside the JSON object.";

export interface PromptBuilderOptions {
  /** Overrides DEFAULT_SYSTEM_PROMPT entirely, for callers with a different rewrite goal. */
  systemPrompt?: string;
  /** Ask the provider for plain text instead of the structured JSON shape. */
  structuredOutput?: boolean;
}

/**
 * Builds the system prompt: base instructions + tone/style/target-model
 * rules from context + (optionally) the structured-output contract.
 */
export function buildSystemPrompt(context?: PromptContext, options?: PromptBuilderOptions): string {
  const parts = [options?.systemPrompt ?? DEFAULT_SYSTEM_PROMPT];

  if (context?.targetModel) {
    parts.push(`Target model: ${context.targetModel}.`);
  }
  if (context?.tone) {
    parts.push(`Tone: ${context.tone}.`);
  }
  if (context?.styleRules?.length) {
    parts.push(`Additional style rules:\n${context.styleRules.map((rule) => `- ${rule}`).join("\n")}`);
  }
  if (options?.structuredOutput !== false) {
    parts.push(STRUCTURED_OUTPUT_INSTRUCTIONS);
  }

  return parts.join("\n\n");
}

/**
 * Builds the user-turn content: the content to rewrite, plus any selected
 * text offered as extra context (kept clearly separate from the content
 * itself so the model doesn't rewrite the context by mistake).
 */
export function buildUserPrompt(content: string, context?: PromptContext): string {
  const sections: string[] = [];

  if (context?.selectedText?.trim()) {
    sections.push(`Additional context (do not rewrite this, use it only as background):\n${context.selectedText.trim()}`);
  }

  sections.push(`Rewrite this prompt:\n${content}`);

  return sections.join("\n\n");
}
