import { NextResponse } from "next/server";
import { generateWithFallback } from "@/app/lib/ai/orchestrator";
import { createDefaultProviders } from "@/app/lib/ai/registry";

export async function POST(request: Request) {
  const body = (await request.json()) as { prompt?: string; targetModel?: string };
  if (!body.prompt?.trim()) {
    return NextResponse.json({ error: "A prompt is required." }, { status: 400 });
  }

  try {
    const result = await generateWithFallback(createDefaultProviders(), {
      content: body.prompt,
      context: { targetModel: body.targetModel ?? "Universal" },
    });

    return NextResponse.json({
      rewritten: result.text,
      provider: result.provider,
      tone: result.tone,
      confidence: result.confidence,
      errors: result.errors,
      thinking: result.thinking,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "No AI provider responded. Install Ollama and keep it running, or add GEMINI_API_KEY in .env.local.",
      },
      { status: 503 },
    );
  }
}
