import assert from "node:assert/strict";
import { test } from "node:test";
import { parseStructuredResult } from "../parse.ts";

test("parses well-formed structured JSON", () => {
  const result = parseStructuredResult('{"text": "Rewritten prompt.", "tone": "concise", "confidence": 0.9, "errors": []}');
  assert.equal(result.text, "Rewritten prompt.");
  assert.equal(result.tone, "concise");
  assert.equal(result.confidence, 0.9);
  assert.deepEqual(result.errors, []);
});

test("strips markdown code fences before parsing", () => {
  const result = parseStructuredResult('```json\n{"text": "Fenced."}\n```');
  assert.equal(result.text, "Fenced.");
});

test("clamps out-of-range confidence into [0, 1]", () => {
  const result = parseStructuredResult('{"text": "x", "confidence": 4.2}');
  assert.equal(result.confidence, 1);
});

test("falls back to raw text when the response isn't JSON", () => {
  const result = parseStructuredResult("Just a plain rewritten prompt, no JSON here.");
  assert.equal(result.text, "Just a plain rewritten prompt, no JSON here.");
  assert.ok(result.errors && result.errors.length > 0);
});

test("returns an error result for an empty response", () => {
  const result = parseStructuredResult("   ");
  assert.equal(result.text, "");
  assert.ok(result.errors && result.errors.length > 0);
});

test("ignores non-string fields instead of throwing", () => {
  const result = parseStructuredResult('{"text": "ok", "tone": 5, "errors": "not-an-array"}');
  assert.equal(result.text, "ok");
  assert.equal(result.tone, undefined);
  assert.equal(result.errors, undefined);
});

test("pulls a leading <think> block out before parsing the JSON", () => {
  const result = parseStructuredResult('<think>weighing tone options</think>{"text": "Rewritten."}');
  assert.equal(result.text, "Rewritten.");
  assert.equal(result.thinking, "weighing tone options");
});

test("surfaces thinking even when no usable answer follows it", () => {
  const result = parseStructuredResult("<think>ran out of room mid-reasoning");
  assert.equal(result.text, "");
  assert.equal(result.thinking, "ran out of room mid-reasoning");
  assert.ok(result.errors?.some((message) => /only produced reasoning/i.test(message)));
});
