import Link from "next/link";

const actions = [
  { number: "01", title: "Strip the bloat", text: "Cuts greetings, polite wrappers, and sign-offs so your intent gets straight to the model." },
  { number: "02", title: "Find the shape", text: "Turns scattered thoughts into readable blocks, bullets, and properly capitalized sentences." },
  { number: "03", title: "Gate the context", text: "Wraps [context], [code], and [data] placeholders in XML for clearer model boundaries." },
];

export default function Home() {
  return (
    <div className="relative isolate overflow-hidden">
      <div className="pointer-events-none absolute left-1/2 top-0 -z-10 h-[520px] w-[720px] -translate-x-1/2 rounded-full bg-teal-600/10 blur-[130px]" />
      <section className="mx-auto flex min-h-[calc(100vh-72px)] w-full max-w-6xl flex-col items-center justify-center px-5 py-20 text-center sm:px-8">
        <div className="mb-7 inline-flex items-center gap-2 rounded-full border border-teal-400/20 bg-teal-400/[0.08] px-3.5 py-1.5 text-xs font-medium text-teal-300">
          <span className="size-1.5 rounded-full bg-teal-400 shadow-[0_0_10px_#2dd4bf]" />
          A calmer way to prompt
        </div>
        <h1 className="max-w-3xl text-5xl font-semibold tracking-[-0.04em] text-zinc-50 sm:text-7xl">
          Make your prompts{" "}
          <span className="bg-gradient-to-r from-teal-300 to-emerald-300 bg-clip-text text-transparent">feel like you.</span>
        </h1>
        <p className="mt-7 max-w-xl text-base leading-7 text-zinc-400 sm:text-lg">
          De-bloat, structure, and optimize your raw thoughts for LLMs. Vibe Polish turns a conversational brain-dump into a prompt with a point.
        </p>
        <Link href="/editor" className="mt-10 inline-flex items-center gap-2 rounded-xl bg-teal-600 px-5 py-3.5 text-sm font-semibold text-white shadow-xl shadow-teal-950/40 transition-all hover:bg-teal-500 hover:shadow-teal-900/50">
          Get started
          <span aria-hidden="true">→</span>
        </Link>
        <div className="mt-24 grid w-full max-w-4xl gap-4 text-left sm:grid-cols-3">
          {actions.map((action) => (
            <div key={action.number} className="rounded-2xl border border-white/[0.08] bg-white/[0.025] p-5">
              <span className="font-mono text-xs text-teal-400">{action.number}</span>
              <h2 className="mt-8 text-sm font-semibold text-zinc-100">{action.title}</h2>
              <p className="mt-2 text-sm leading-6 text-zinc-500">{action.text}</p>
            </div>
          ))}
        </div>
        <div className="mt-16 grid w-full max-w-4xl grid-cols-3 border-y border-white/[0.08] py-6 text-center">
          <div><strong className="text-2xl font-bold text-zinc-100">100%</strong><p className="mt-1 text-xs text-zinc-500">in your browser</p></div>
          <div><strong className="text-2xl font-bold text-zinc-100">3</strong><p className="mt-1 text-xs text-zinc-500">focused transformations</p></div>
          <div><strong className="text-2xl font-bold text-zinc-100">0</strong><p className="mt-1 text-xs text-zinc-500">prompts sent anywhere</p></div>
        </div>
      </section>
    </div>
  );
}
