import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';
import { Nav } from '@/components/Nav';

const geistSans = Geist({ variable: '--font-geist-sans', subsets: ['latin'] });
const geistMono = Geist_Mono({ variable: '--font-geist-mono', subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'RAG Eval Studio',
  description:
    'Evaluate RAG answers with RAGAS-style metrics: faithfulness, answer relevancy, context precision/recall and groundedness, via an LLM-as-a-judge. Vercel AI SDK, Strands Agents and Langfuse.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
        <Nav />
        <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6">{children}</main>
        <footer className="border-t border-slate-200 py-4 text-center text-xs text-slate-500 dark:border-slate-800">
          Vercel AI SDK · Strands Agents · Langfuse
        </footer>
      </body>
    </html>
  );
}
