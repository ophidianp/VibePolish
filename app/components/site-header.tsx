"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

export default function SiteHeader() {
  const [dark, setDark] = useState(true);

  useEffect(() => {
    const saved = window.localStorage.getItem("vibe-polish-theme");
    const isDark = saved !== "light";
    document.documentElement.classList.toggle("light", !isDark);
    const syncIcon = window.setTimeout(() => setDark(isDark), 0);
    return () => window.clearTimeout(syncIcon);
  }, []);

  const toggleTheme = () => {
    const nextDark = !dark;
    setDark(nextDark);
    document.documentElement.classList.toggle("light", !nextDark);
    window.localStorage.setItem("vibe-polish-theme", nextDark ? "dark" : "light");
  };

  return (
    <header className="sticky top-0 z-20 border-b border-white/[0.08] bg-[#071416]/80 backdrop-blur-xl">
      <div className="mx-auto flex h-18 w-full max-w-6xl items-center justify-between px-5 sm:px-8">
        <Link href="/" className="group flex items-center gap-3">
          <span className="flex size-8 items-center justify-center rounded-lg bg-teal-600 text-white shadow-lg shadow-teal-950/40 transition-transform group-hover:rotate-6" aria-hidden="true">
            <svg viewBox="0 0 24 24" className="size-4" fill="currentColor"><path d="m12 2 1.8 6.2L20 10l-6.2 1.8L12 18l-1.8-6.2L4 10l6.2-1.8L12 2Zm7 13 .8 2.2L22 18l-2.2.8L19 21l-.8-2.2L16 18l2.2-.8L19 15Z" /></svg>
          </span>
          <span className="text-[15px] font-bold tracking-tight text-zinc-100 transition-colors group-hover:text-white">Vibe Polish</span>
        </Link>
        <nav className="flex items-center gap-1 text-sm font-semibold" aria-label="Main navigation">
          <Link href="/editor" className="rounded-lg px-3 py-2 text-zinc-400 transition-all hover:bg-white/[0.07] hover:text-teal-300">Editor</Link>
          <Link href="/about" className="rounded-lg px-3 py-2 text-zinc-400 transition-all hover:bg-white/[0.07] hover:text-teal-300">About</Link>
          <button type="button" onClick={toggleTheme} aria-label={dark ? "Switch to light mode" : "Switch to dark mode"} className="ml-2 rounded-lg border border-white/[0.1] p-2 text-zinc-400 transition-all hover:border-teal-500/40 hover:text-teal-300">
            {dark ? "☼" : "☾"}
          </button>
        </nav>
      </div>
    </header>
  );
}
