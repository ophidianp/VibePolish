/**
 * Some models (small local ones especially) think out loud before — or
 * instead of — answering. This pulls that reasoning out so it can be shown
 * separately in the UI instead of leaking into the actual rewrite.
 */
export interface ThinkingSplit {
  /** Reasoning text, if any was found or inferred. Never shown in the output box. */
  thinking?: string;
  /** Whatever is left after removing the reasoning — the candidate answer. */
  rest: string;
}

const THINK_TAG = /<think>([\s\S]*?)<\/think>/gi;
const UNCLOSED_THINK_TAG = /<think>([\s\S]*)$/i;

// A response that opens with one of these and never reaches a recognizable
// answer format is almost always pure reasoning that ran out of room before
// producing a real result (common with small local models), not a usable
// rewrite. Order-independent, checked against the start of the text only.
const REASONING_OPENER = /^(?:okay|ok|alright|so|first|now|let'?s|i need to|i'll|i will|thinking:)\b/i;
const ANSWER_MARKER =
  /^\s{0,3}(?:#{1,6}\s*|\[)?(?:objective|task|context|requirements|output format|deliverable)\]?\s*(?::|$)/im;
const ANSWER_SHAPE = /^\s*\{|<[a-z][\s\S]*>/i;

/**
 * Splits raw model output into { thinking, rest }. Handles, in order:
 *  1. Explicit <think>...</think> blocks (possibly several).
 *  2. An unclosed <think> tag (model got cut off mid-reasoning) — everything
 *     after it is reasoning, nothing usable remains.
 *  3. No tags at all, but the text reads like an untagged reasoning ramble
 *     with no answer-shaped content anywhere — treated as pure thinking.
 */
export function splitThinking(raw: string): ThinkingSplit {
  const trimmed = raw.trim();
  if (!trimmed) return { rest: "" };

  if (THINK_TAG.test(trimmed)) {
    THINK_TAG.lastIndex = 0;
    const thoughts: string[] = [];
    const rest = trimmed
      .replace(THINK_TAG, (_match, inner: string) => {
        thoughts.push(inner.trim());
        return "";
      })
      .trim();
    return { thinking: thoughts.filter(Boolean).join("\n\n") || undefined, rest };
  }

  const unclosed = trimmed.match(UNCLOSED_THINK_TAG);
  if (unclosed) {
    return { thinking: unclosed[1].trim() || undefined, rest: "" };
  }

  if (REASONING_OPENER.test(trimmed) && !ANSWER_MARKER.test(trimmed) && !ANSWER_SHAPE.test(trimmed)) {
    return { thinking: trimmed, rest: "" };
  }

  return { rest: trimmed };
}
