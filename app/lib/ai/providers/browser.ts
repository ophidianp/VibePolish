"use client";

import type { TextGenerationPipeline } from "@huggingface/transformers";
import { buildUserPrompt } from "../prompt-builder";
import { splitThinking } from "../thinking";
import type { AIProvider, RewriteRequest, RewriteResult } from "../types";

// Module-scoped so the downloaded pipeline survives across rewrites within
// the same page session instead of re-downloading every click.
let cachedPipeline: TextGenerationPipeline | undefined;
let progressListener: ((status: string) => void) | undefined;

/** Lets the editor UI surface model-download / rewrite progress text. */
export function onBrowserProviderProgress(listener: ((status: string) => void) | undefined) {
  progressListener = listener;
}

function cleanAnswerText(value: unknown, source: string): string {
  if (typeof value !== "string") return "";
  const cleaned = value
    .trim()
    .replace(/^["'`]+|["'`]+$/g, "")
    .trim();
  if (!cleaned || cleaned.length < 24 || /^(?:["'`]+|null|undefined)$/i.test(cleaned)) return "";
  if (cleaned.toLowerCase() === source.trim().toLowerCase()) return "";
  return cleaned;
}

/**
 * Runs entirely in the browser via Transformers.js (Qwen3 0.6B ONNX). No API
 * key, no server round-trip, nothing leaves the device. First call downloads
 * and caches the quantized model; later calls reuse it.
 *
 * Asks for plain text rather than the shared structured-JSON contract — a
 * 0.6B local model reliably following an "Objective/Context/Requirements"
 * rewrite instruction is already a stretch, and strict JSON on top of that
 * tends to break more often than it helps.
 */
export function createBrowserProvider(): AIProvider {
  return {
    id: "browser",

    async isAvailable() {
      return typeof window !== "undefined";
    },

    async generate(request: RewriteRequest): Promise<RewriteResult> {
      let generator = cachedPipeline;
      if (!generator) {
        progressListener?.("Downloading the browser AI model (first use only)...");
        const { pipeline } = await import("@huggingface/transformers");
        const hasWebGpu = "gpu" in navigator;
        generator = (await pipeline("text-generation", "onnx-community/Qwen3-0.6B-ONNX", {
          device: hasWebGpu ? "webgpu" : "wasm",
          dtype: hasWebGpu ? "q4f16" : "q4",
          progress_callback: (progress) => {
            if (progress.status === "progress" && typeof progress.progress === "number") {
              progressListener?.(`Downloading browser AI: ${Math.round(progress.progress)}%`);
            }
          },
        })) as TextGenerationPipeline;
        cachedPipeline = generator;
      }
      progressListener?.("Rewriting in your browser...");

      const targetModel = request.context?.targetModel ?? "Universal";
      const result = await generator(
        [
          {
            role: "system",
            content:
              `Rewrite rough user notes into a complete, polished prompt for ${targetModel}. Preserve every ` +
              "detail, request, constraint, and desired outcome. Do not copy the wording. Infer the real " +
              "intent, remove meta-commentary, and organize it into Objective, Context, Requirements, and " +
              "Output format. Return only the finished prompt.",
          },
          { role: "user", content: buildUserPrompt(request.content, request.context) },
        ],
        {
          max_new_tokens: 640,
          do_sample: false,
          return_full_text: false,
          chat_template_kwargs: { enable_thinking: false },
        },
      );

      const generated =
        Array.isArray(result) && result[0] && "generated_text" in result[0]
          ? typeof result[0].generated_text === "string"
            ? result[0].generated_text
            : Array.isArray(result[0].generated_text)
              ? result[0].generated_text.at(-1)?.content
              : ""
          : "";

      const { thinking, rest } = splitThinking(typeof generated === "string" ? generated : "");
      const text = cleanAnswerText(rest, request.content);
      if (!text) {
        throw new Error(
          thinking
            ? "The browser AI only reasoned about the rewrite and never finished it."
            : "The browser AI returned an unusable rewrite.",
        );
      }

      return { text, thinking };
    },
  };
}
