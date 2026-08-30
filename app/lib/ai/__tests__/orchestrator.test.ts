import assert from "node:assert/strict";
import { test } from "node:test";
import { generateWithFallback, NoProviderAvailableError } from "../orchestrator.ts";
import type { AIProvider } from "../types.ts";

function fakeProvider(overrides: Partial<AIProvider> & { id: AIProvider["id"] }): AIProvider {
  return {
    async isAvailable() {
      return true;
    },
    async generate() {
      return { text: "fallback should not reach here" };
    },
    ...overrides,
  };
}

test("returns the first available provider's result", async () => {
  const first = fakeProvider({ id: "ollama", async generate() { return { text: "from ollama" }; } });
  const second = fakeProvider({ id: "gemini", async generate() { return { text: "from gemini" }; } });

  const result = await generateWithFallback([first, second], { content: "raw prompt" });
  assert.equal(result.text, "from ollama");
  assert.equal(result.provider, "ollama");
});

test("skips a provider that reports itself unavailable", async () => {
  const unavailable = fakeProvider({ id: "gemini", async isAvailable() { return false; } });
  const available = fakeProvider({ id: "openai", async generate() { return { text: "from openai" }; } });

  const result = await generateWithFallback([unavailable, available], { content: "raw prompt" });
  assert.equal(result.provider, "openai");
});

test("falls through to the next provider when one throws", async () => {
  const failing = fakeProvider({
    id: "ollama",
    async generate() {
      throw new Error("connection refused");
    },
  });
  const backup = fakeProvider({ id: "gemini", async generate() { return { text: "from gemini" }; } });

  const result = await generateWithFallback([failing, backup], { content: "raw prompt" });
  assert.equal(result.provider, "gemini");
});

test("falls through when a provider returns empty text", async () => {
  const empty = fakeProvider({ id: "ollama", async generate() { return { text: "" }; } });
  const backup = fakeProvider({ id: "gemini", async generate() { return { text: "usable" }; } });

  const result = await generateWithFallback([empty, backup], { content: "raw prompt" });
  assert.equal(result.provider, "gemini");
});

test("throws NoProviderAvailableError with per-provider reasons when every provider fails", async () => {
  const first = fakeProvider({ id: "ollama", async isAvailable() { return false; } });
  const second = fakeProvider({
    id: "gemini",
    async generate() {
      throw new Error("bad api key");
    },
  });

  await assert.rejects(
    () => generateWithFallback([first, second], { content: "raw prompt" }),
    (error: unknown) => {
      assert.ok(error instanceof NoProviderAvailableError);
      assert.match(error.message, /ollama/);
      assert.match(error.message, /gemini/);
      assert.match(error.message, /bad api key/);
      return true;
    },
  );
});
