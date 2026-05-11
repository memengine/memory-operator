"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Activity,
  AlertOctagon,
  Coins,
  FileClock,
  Layers3,
  ListChecks,
  Recycle,
} from "lucide-react";

const navItems = [
  { href: "/", label: "System Health", icon: Activity },
  { href: "/tenants", label: "All Tenants", icon: Layers3 },
  { href: "/dead-letter", label: "Dead Letter", icon: AlertOctagon },
  { href: "/costs", label: "Cost Monitor", icon: Coins },
  { href: "/backfill", label: "Backfill", icon: FileClock },
  { href: "/lifecycle", label: "Lifecycle", icon: Recycle },
  { href: "/audit", label: "Audit Log", icon: ListChecks },
];

export function OperatorSidebar() {
  const pathname = usePathname();

  return (
    <aside className="flex h-full w-72 flex-col border-r border-slate-800 bg-slate-900 text-slate-100">
      <div className="border-b border-slate-800 px-6 py-6">
        <p className="text-xs font-semibold uppercase tracking-[0.35em] text-sky-300">
          Operator Console
        </p>
        <p className="mt-3 max-w-[16rem] text-sm leading-6 text-slate-400">
          Internal operations surface for MemoryOS platform health and incident response.
        </p>
      </div>
      <nav className="flex-1 px-3 py-5">
        <div className="space-y-1">
          {navItems.map(({ href, label, icon: Icon }) => {
            const active =
              href === "/"
                ? pathname === href
                : pathname === href || pathname.startsWith(`${href}/`);
            return (
              <Link
                key={href}
                href={href}
                className={[
                  "flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-colors",
                  active
                    ? "bg-sky-500/20 text-sky-100 ring-1 ring-sky-400/40"
                    : "text-slate-300 hover:bg-slate-800 hover:text-white",
                ].join(" ")}
              >
                <Icon className="size-4" />
                <span>{label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
      <div className="border-t border-slate-800 px-6 py-5 text-xs text-slate-500">
        Shared internal tool. No public access.
      </div>
    </aside>
  );
}
