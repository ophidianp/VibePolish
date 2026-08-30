const details = [
  ["01", "Strip Bloat", "Removes the conversational padding around your actual request — greetings, polite wrappers, and sign-offs."],
  ["02", "Format Structure", "Normalizes whitespace, separates logical blocks, turns casual dashes into markdown bullets, and cleans up sentence starts."],
  ["03", "Inject XML Gating", "Finds [context], [code], and [data] sections and wraps them in matching XML tags so models can distinguish instructions from inputs."],
];

export default function AboutPage() {
  return (
    <div className="mx-auto w-full max-w-3xl px-5 py-20 sm:px-8">
      <p className="font-mono text-xs uppercase tracking-[0.2em] text-teal-400">About Vibe Polish</p>
      <h1 className="mt-4 text-4xl font-semibold tracking-tight text-zinc-50">Less prompt theater. More signal.</h1>
      <p className="mt-5 max-w-2xl text-base leading-7 text-zinc-400">Vibe Polish is a tiny, private-by-design editor for turning rough thoughts into cleaner prompts. Everything happens in your browser — nothing is uploaded or stored.</p>
      <div className="mt-14 space-y-3">
        {details.map(([number, title, text]) => (
          <article key={number} className="rounded-2xl border border-white/[0.08] bg-white/[0.025] p-6 sm:flex sm:gap-8">
            <span className="font-mono text-xs text-teal-400">{number}</span>
            <div className="mt-4 sm:mt-0"><h2 className="font-semibold text-zinc-100">{title}</h2><p className="mt-2 text-sm leading-6 text-zinc-500">{text}</p></div>
          </article>
        ))}
      </div>
      <div className="mt-14 rounded-2xl border border-teal-400/15 bg-teal-400/[0.06] p-6">
        <h2 className="font-semibold text-zinc-100">Token estimate</h2>
        <p className="mt-2 text-sm leading-6 text-zinc-400">The editor estimates tokens at roughly one token per four characters. It is intentionally lightweight — useful for a quick sense of prompt size, not a tokenizer replacement.</p>
      </div>
    </div>
  );
}
