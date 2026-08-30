import assert from "node:assert/strict";
import { test } from "node:test";
import { splitThinking } from "../thinking.ts";

test("extracts a well-formed <think> block and leaves the rest untouched", () => {
  const { thinking, rest } = splitThinking('<think>weighing a couple of options</think>{"text": "done"}');
  assert.equal(thinking, "weighing a couple of options");
  assert.equal(rest, '{"text": "done"}');
});

test("joins multiple <think> blocks", () => {
  const { thinking, rest } = splitThinking("<think>first part</think>middle<think>second part</think>end");
  assert.equal(thinking, "first part\n\nsecond part");
  assert.equal(rest, "middleend");
});

test("treats an unclosed <think> tag as reasoning with nothing left over", () => {
  const { thinking, rest } = splitThinking("<think>ran out of room while reasoning");
  assert.equal(thinking, "ran out of room while reasoning");
  assert.equal(rest, "");
});

test("detects an untagged reasoning ramble with no answer-shaped content", () => {
  const ramble =
    "Okay, let's start by understanding the user's original message. The user wants a messy prompt. " +
    "So, considering the structure, I need to figure out the objective before writing anything.";
  const { thinking, rest } = splitThinking(ramble);
  assert.equal(thinking, ramble);
  assert.equal(rest, "");
});

test("leaves normal answer text alone", () => {
  const answer = "Objective: build a landing page.\n\nContext: for a side project.";
  const { thinking, rest } = splitThinking(answer);
  assert.equal(thinking, undefined);
  assert.equal(rest, answer);
});

test("leaves plain JSON answers alone even without think tags", () => {
  const answer = '{"text": "Objective: ship the feature.", "tone": "direct"}';
  const { thinking, rest } = splitThinking(answer);
  assert.equal(thinking, undefined);
  assert.equal(rest, answer);
});

test("returns an empty rest for empty input", () => {
  const { thinking, rest } = splitThinking("   ");
  assert.equal(thinking, undefined);
  assert.equal(rest, "");
});
