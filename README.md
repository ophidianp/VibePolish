# Vibe Polish

Vibe Polish is a small prompt-polishing app for turning scattered thoughts into cleaner, more usable prompts for AI models.

It helps you:

- strip fluff, filler, and repeated context
- reshape messy notes into a clear prompt structure
- keep model-specific guidance in the right tone and format
- rewrite locally in the browser when possible

## Features

- browser-first rewrite flow with local model support
- optional server-side fallback providers
- structured prompt output and model-aware guidance
- fast local iteration without needing a complex setup

## Local development

```bash
npm install
npm run dev
```

Open http://localhost:3000 to use the editor.

## Testing

```bash
npm test
```

## Notes

The app supports local browser inference through Transformers.js and optional Ollama/Gemini/OpenAI backends depending on your environment.

## License

All Rights Reserved (ARR). Copyright (c) 2026 Pavan Nemani.
This project is not open source; see [LICENSE](LICENSE) for what you may and may not do.
