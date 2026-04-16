"use client";

import { usePathname } from "next/navigation";

import { OperatorSidebar } from "@/components/operator-sidebar";

export function OperatorShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  if (pathname === "/login") {
    return <>{children}</>;
  }

  return (
    <div className="flex min-h-screen bg-slate-950 text-slate-100">
      <OperatorSidebar />
      <main className="min-w-0 flex-1 overflow-y-auto bg-slate-950">{children}</main>
    </div>
  );
}
