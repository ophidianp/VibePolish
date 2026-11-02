import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import InteractionSounds from "./components/interaction-sounds";
import SiteHeader from "./components/site-header";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Vibe Polish — Better prompts, less noise",
  description: "De-bloat, structure, and optimize your raw thoughts for LLMs.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable}`}>
      <body><InteractionSounds /><SiteHeader /><main className="page-enter flex-1">{children}</main><footer className="py-6 text-center text-xs text-zinc-500">&copy; Pavan Nemani &middot; All Rights Reserved (ARR)</footer></body>
    </html>
  );
}
