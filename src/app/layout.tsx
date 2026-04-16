import type { Metadata } from "next";

import "./globals.css";

import { OperatorShell } from "@/components/operator-shell";

export const metadata: Metadata = {
  title: "MemoryOS Operator Console",
  description: "Internal operations console for MemoryOS.",
  robots: {
    index: false,
    follow: false,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased dark">
      <body className="min-h-full bg-slate-950 text-slate-100">
        <OperatorShell>{children}</OperatorShell>
      </body>
    </html>
  );
}
