import type { Metadata } from 'next';
import './globals.css';
import { Navbar } from '@/components/common/Navbar';

export const metadata: Metadata = {
  title: 'Compiler Pipeline Visualizer | Software Architecture',
  description:
    'Interactive educational compiler pipeline visualizer: Lexical Analysis, Syntax Tree Parsing, Semantic Analysis & Scoped Symbol Table.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className="bg-zinc-950 text-zinc-100 min-h-screen flex flex-col font-sans antialiased selection:bg-indigo-500/30 selection:text-indigo-200">
        <Navbar />
        <main className="flex-1 max-w-[1700px] w-full mx-auto px-3 sm:px-5 lg:px-6 py-4 flex flex-col">
          {children}
        </main>
      </body>
    </html>
  );
}
