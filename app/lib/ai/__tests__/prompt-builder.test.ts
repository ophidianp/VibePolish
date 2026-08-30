import assert from "node:assert/strict";
import { test } from "node:test";
import { buildSystemPrompt, buildUserPrompt, DEFAULT_SYSTEM_PROMPT } from "../prompt-builder.ts";

test("buildSystemPrompt includes the default instructions and structured-output contract by default", () => {
  const prompt = buildSystemPrompt();
  assert.ok(prompt.includes(DEFAULT_SYSTEM_PROMPT));
  assert.match(prompt, /strict JSON/i);
});

test("buildSystemPrompt folds in target model, tone, and style rules", () => {
  const prompt = buildSystemPrompt({
    targetModel: "Claude",
    tone: "formal",
    styleRules: ["Use second person.", "Avoid jargon."],
  });
  assert.match(prompt, /Target model: Claude\./);
  assert.match(prompt, /Tone: formal\./);
  assert.match(prompt, /Use second person\./);
  assert.match(prompt, /Avoid jargon\./);
});

test("buildSystemPrompt can drop the structured-output contract", () => {
  const prompt = buildSystemPrompt(undefined, { structuredOutput: false });
  assert.doesNotMatch(prompt, /strict JSON/i);
});

test("buildSystemPrompt honors a fully custom system prompt", () => {
  const prompt = buildSystemPrompt(undefined, { systemPrompt: "Custom instructions." });
  assert.match(prompt, /^Custom instructions\./);
  assert.ok(!prompt.includes(DEFAULT_SYSTEM_PROMPT));
});

test("buildUserPrompt includes the content to rewrite", () => {
  const prompt = buildUserPrompt("make me a landing page");
  assert.match(prompt, /Rewrite this prompt:\nmake me a landing page/);
});

test("buildUserPrompt keeps selected text separate from the content to rewrite", () => {
  const prompt = buildUserPrompt("rewrite this", { selectedText: "background info" });
  assert.match(prompt, /do not rewrite this/i);
  assert.match(prompt, /background info/);
  assert.match(prompt, /Rewrite this prompt:\nrewrite this/);
});
