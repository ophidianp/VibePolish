"use client";

import { useState } from "react";
import { generateWithFallback } from "@/app/lib/ai/orchestrator";
import { createBrowserProvider, onBrowserProviderProgress } from "@/app/lib/ai/providers/browser";
import { createRemoteProvider } from "@/app/lib/ai/providers/remote";

type Model = "Universal" | "ChatGPT" | "Claude" | "Gemini" | "Llama" | "Mistral" | "DeepSeek" | "Copilot";

function stripBloat(value: string) {
  return value.replace(/^\s*(?:hi(?:\s+ai)?|hello|hey)(?:[!,.:\s]+|$)/i, "").replace(/^\s*(?:please\s+(?:write|create|make)\s+(?:a|an)?|can\s+you\s+(?:help\s+me\s+with|create|write))\s*/i, "").replace(/\s*(?:thanks!?|thank\s+you!?|you(?:'re|\s+are)\s+the\s+best!?|hope\s+you\s+are\s+well!?)[\s.]*$/i, "").replace(/[ \t]{2,}/g, " ").trim();
}

function formatStructure(value: string) {
  return value.replace(/\r\n/g, "\n").replace(/^\s*[-–—]\s+/gm, "- ").replace(/(?<!^)\s+[-–—]\s+/g, "\n- ").replace(/[ \t]*\n[ \t]*/g, "\n").replace(/\n{3,}/g, "\n\n").replace(/\.\s+([a-z])/g, (_, letter: string) => `. ${letter.toUpperCase()}`).trim();
}

function injectXml(value: string) {
  return value.replace(/\[(context|code|data)\]([\s\S]*?)\[\/\1\]/gi, (_, tag: string, content: string) => `<${tag.toLowerCase()}>${content.trim()}</${tag.toLowerCase()}>`).replace(/\[(context|code|data)\]\s*([\s\S]*?)(?=\n\n|$)/gi, (_, tag: string, content: string) => `<${tag.toLowerCase()}>${content.trim()}</${tag.toLowerCase()}>`);
}

function rewritePrompt(value: string, model: Model, pass: number) {
  const cleaned = injectXml(formatStructure(stripBloat(value)));
  if (!cleaned) return "";
  const source = cleaned
    .replace(/^(?:ok\s+so\s+)?what\s+.+?\s+is\s+doing\s+is\s+/i, "")
    .replace(/\bi\s+want\s+(?:a\s+)?full\s+rewrite\s+with\s+all\s+the\s+same\s+points\b/i, "perform a complete rewrite while preserving every requirement")
    .replace(/\bi\s+want\s+different\s+results\s+every\s+single\s+time\b/i, "produce a fresh, non-repetitive result on every run")
    .replace(/\s+/g, " ")
    .trim();
  const sentences = source
    .split(/(?<=[.!?])\s+|,\s+(?=(?:and|but|because|so|then|also|i want|can you|please|with)\b)/i)
    .map((sentence) => sentence.trim())
    .filter(Boolean);
  const objective = sentences.shift() ?? source;
  const context: string[] = [];
  const requirements: string[] = [];
  const details: string[] = [];
  sentences.forEach((sentence) => {
    if (/(context|background|given|based on|using|here is|<context>|<data>|<code>)/i.test(sentence)) context.push(sentence);
    else if (/(must|should|need to|include|avoid|don't|do not|required|format|limit|only)/i.test(sentence)) requirements.push(sentence);
    else details.push(sentence);
  });
  const profile = {
    Universal: { objective: "Objective", output: "Deliverable" },
    ChatGPT: { objective: "Task", output: "Response format" },
    Claude: { objective: "Task", output: "Response format" },
    Gemini: { objective: "Goal", output: "Deliverable" },
    Llama: { objective: "Instruction", output: "Answer format" },
    Mistral: { objective: "Instruction", output: "Expected output" },
    DeepSeek: { objective: "Task", output: "Output requirements" },
    Copilot: { objective: "Task", output: "Expected result" },
  }[model];
  const styles = [
    ["##", "##", "##"],
    ["###", "###", "###"],
    ["[", "[", "["],
    ["##", "###", "##"],
  ][pass % 4];
  const close = styles[0] === "[" ? "]" : "";
  const heading = (label: string, index: number) => `${styles[index] === "[" ? "[" : `${styles[index]} `}${label}${close}`;
  const section = (label: string, content: string) => content ? `${heading(label, label === profile.objective ? 0 : label === "Context" ? 1 : 2)}\n${content}` : "";
  const modelGuidance = model === "Claude" ? "Use XML boundaries when useful." : model === "Gemini" ? "Keep the response scannable and concise." : model === "Copilot" ? "Make the response implementation-ready." : "State assumptions instead of guessing.";
  const parts = [
    section(profile.objective, objective),
    section("Context", context.join("\n")),
    section("Additional details", details.join("\n")),
    section("Requirements", requirements.map((item) => `- ${item}`).join("\n")),
    section(profile.output, `Answer the objective directly. ${modelGuidance}`),
  ].filter(Boolean);
  return parts.join("\n\n").replace(/\b(?:so i want|because its using|and then)\b/gi, "").replace(/ {2,}/g, " ").trim();
}

export default function EditorPage() {
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [thinking, setThinking] = useState("");
  const [copied, setCopied] = useState(false);
  const [model, setModel] = useState<Model>("Universal");
  const [rewritePass, setRewritePass] = useState(0);
  const [isRewriting, setIsRewriting] = useState(false);
  const [rewriteStatus, setRewriteStatus] = useState("");
  const cleanup = async () => {
    if (!input.trim()) return;
    setIsRewriting(true);
    setThinking("");
    setRewriteStatus("Downloading the browser AI model (first use only)...");
    onBrowserProviderProgress(setRewriteStatus);
    try {
      // Try the private, in-browser model first; if it's unavailable or
      // errors out, fall through to the server's Ollama/Gemini/OpenAI chain.
      // Neither backend knows about the other — the orchestrator is what
      // makes this a fallback chain instead of hardcoded branches.
      const result = await generateWithFallback([createBrowserProvider(), createRemoteProvider()], {
        content: input,
        context: { targetModel: model },
      });
      setOutput(result.text);
      setThinking(result.thinking ?? "");
      setRewriteStatus(result.provider === "browser" ? "Rewritten privately in your browser" : "Rewritten by a server AI provider");
    } catch (error) {
      setOutput(rewritePrompt(input, model, rewritePass));
      setRewriteStatus(
        error instanceof Error ? `${error.message} — structured fallback used` : "AI providers unavailable — structured fallback used",
      );
    } finally {
      onBrowserProviderProgress(undefined);
      setRewritePass((pass) => pass + 1);
      setIsRewriting(false);
    }
  };
  const copy = async () => {
    if (!output) return;
    await navigator.clipboard.writeText(output);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="mx-auto w-full max-w-6xl px-5 py-12 sm:px-8">
      <div className="mb-9"><p className="font-mono text-xs font-bold uppercase tracking-[0.2em] text-teal-400">Prompt editor</p><h1 className="mt-3 text-3xl font-bold tracking-tight text-zinc-50">Clear the noise. Keep the intent.</h1><p className="mt-2 text-sm font-medium text-zinc-500">Clean and structure your prompt locally for the model you plan to use.</p></div>
      <div className="grid gap-4 lg:grid-cols-2">
        <section><div className="mb-2 flex items-center justify-between"><label htmlFor="raw-prompt" className="text-sm font-bold text-zinc-300">Raw thoughts</label><span className="text-xs text-zinc-600">{input.length.toLocaleString()} chars · ~{Math.ceil(input.length / 4).toLocaleString()} tokens</span></div><textarea id="raw-prompt" value={input} onChange={(event) => setInput(event.target.value)} placeholder="Paste your messy, conversational brain-dump prompt here..." className="h-96 w-full resize-none rounded-xl border border-white/[0.1] bg-[#0b1b1d]/90 p-4 text-sm font-medium leading-6 text-zinc-200 outline-none placeholder:text-zinc-600 focus:border-teal-400/60 focus:ring-2 focus:ring-teal-400/10" /></section>
        <section>
          <div className="mb-2 flex items-center justify-between"><label htmlFor="polished-prompt" className="text-sm font-bold text-zinc-300">Polished prompt</label><button type="button" onClick={() => void copy()} disabled={!output} className="text-xs font-bold text-teal-400 transition-colors hover:text-teal-300 disabled:cursor-not-allowed disabled:text-zinc-700">{copied ? "✓ Copied!" : "Copy to clipboard"}</button></div>
          {isRewriting && !thinking ? (
            <div className="mb-2 flex items-center gap-2 rounded-lg border border-white/[0.08] bg-[#0b1b1d]/60 px-3 py-2 text-xs font-semibold text-zinc-400">
              <span className="size-1.5 animate-pulse rounded-full bg-teal-400 shadow-[0_0_6px_#2dd4bf]" />
              Thinking...
            </div>
          ) : thinking ? (
            <details className="group mb-2 rounded-lg border border-white/[0.08] bg-[#0b1b1d]/60 px-3 py-2 text-xs text-zinc-400">
              <summary className="flex cursor-pointer select-none items-center gap-1.5 font-semibold text-zinc-400 marker:content-none">
                <span className="inline-block text-teal-400 transition-transform duration-150 group-open:rotate-90">›</span>
                Thought process
              </summary>
              <p className="mt-2 max-h-40 overflow-y-auto whitespace-pre-wrap text-zinc-500">{thinking}</p>
            </details>
          ) : null}
          <textarea id="polished-prompt" value={output} readOnly placeholder="Your polished prompt will appear here..." className="h-96 w-full resize-none rounded-xl border border-white/[0.1] bg-[#0b1b1d]/90 p-4 text-sm font-medium leading-6 text-zinc-200 outline-none placeholder:text-zinc-700" />
        </section>
      </div>
      <div className="mt-5 flex flex-wrap items-center gap-2 border-t border-white/[0.07] pt-5"><span className="mr-2 text-xs font-bold uppercase tracking-wider text-zinc-600">Rewrite with local AI</span><button type="button" onClick={() => void cleanup()} disabled={isRewriting || !input.trim()} className="rounded-lg bg-teal-600 px-4 py-2 text-sm font-bold text-white transition-all hover:bg-teal-500 active:scale-95 disabled:cursor-wait disabled:opacity-60">{isRewriting ? "Rewriting..." : "Clean up prompt"}</button><label className="ml-auto flex items-center gap-2 text-xs font-bold text-zinc-500">Model<select value={model} onChange={(event) => setModel(event.target.value as Model)} className="rounded-lg border border-white/[0.1] bg-[#0b1b1d] px-2 py-2 text-zinc-300 outline-none focus:border-teal-500"><option>Universal</option><option>ChatGPT</option><option>Claude</option><option>Gemini</option><option>Llama</option><option>Mistral</option><option>DeepSeek</option><option>Copilot</option></select></label><button type="button" onClick={() => { setInput(""); setOutput(""); setThinking(""); setRewriteStatus(""); }} className="px-3 py-2 text-sm font-bold text-zinc-600 transition-colors hover:text-zinc-300">Clear</button></div>
      <p className="mt-5 text-xs font-medium text-zinc-600">{rewriteStatus || "Runs a small AI model in your browser with no API key or Ollama. The first use downloads the model."}</p>
    </div>
  );
}
