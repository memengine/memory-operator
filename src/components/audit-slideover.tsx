"use client";

import { X } from "lucide-react";

import { AuditLogEntry } from "@/lib/admin-api";

type AuditSlideoverProps = {
  entry: AuditLogEntry | null;
  onClose: () => void;
};

export function AuditSlideover({ entry, onClose }: AuditSlideoverProps) {
  if (!entry) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-40 flex justify-end bg-slate-950/60 backdrop-blur-sm">
      <button
        type="button"
        className="flex-1"
        aria-label="Close audit changes panel"
        onClick={onClose}
      />
      <aside className="relative h-full w-full max-w-3xl overflow-y-auto border-l border-slate-800 bg-slate-950 p-6 text-slate-100 shadow-2xl">
        <button
          type="button"
          className="absolute right-4 top-4 rounded-full border border-slate-700 p-2 text-slate-300 transition hover:bg-slate-800"
          onClick={onClose}
        >
          <X className="size-4" />
        </button>

        <div className="pr-12">
          <p className="text-xs font-semibold uppercase tracking-[0.35em] text-sky-300">
            Audit change
          </p>
          <h2 className="mt-4 text-3xl font-semibold text-white">
            {entry.action}
            {entry.memory_id ? ` · ${entry.memory_id.slice(0, 8)}` : ""}
          </h2>
          <p className="mt-3 text-sm text-slate-400">
            Inspect the change summaries returned by the internal audit endpoint.
          </p>
        </div>

        <div className="mt-8 grid gap-4 lg:grid-cols-2">
          <section className="rounded-3xl border border-slate-800 bg-slate-900/70 p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">
              Before
            </p>
            <pre className="mt-4 overflow-x-auto whitespace-pre-wrap break-words rounded-2xl bg-slate-950/60 p-4 font-mono text-xs leading-6 text-slate-300">
              {entry.old_value_summary ?? "No previous value"}
            </pre>
          </section>

          <section className="rounded-3xl border border-slate-800 bg-slate-900/70 p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">
              After
            </p>
            <pre className="mt-4 overflow-x-auto whitespace-pre-wrap break-words rounded-2xl bg-slate-950/60 p-4 font-mono text-xs leading-6 text-slate-300">
              {entry.new_value_summary ?? "No new value"}
            </pre>
          </section>
        </div>
      </aside>
    </div>
  );
}
