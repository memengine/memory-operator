"use client";

import Link from "next/link";
import { X } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import type { PlanTier, QuotaMode, RecentExtractionJob, TenantSummary } from "@/lib/admin-api";

export type TenantQuickViewData = TenantSummary & {
  extraction_success_rate?: number | null;
  conflicts_resolved_mtd?: number | null;
  hot_memories_count?: number | null;
  auto_archived_mtd?: number | null;
  total_extraction_calls_mtd?: number | null;
  recent_jobs?: RecentExtractionJob[];
  recent_extraction_jobs?: RecentExtractionJob[];
};

function planBadgeClassName(plan: PlanTier) {
  switch (plan) {
    case "enterprise":
      return "border-fuchsia-400/30 bg-fuchsia-500/15 text-fuchsia-100";
    case "growth":
      return "border-sky-400/30 bg-sky-500/15 text-sky-100";
    case "starter":
      return "border-emerald-400/30 bg-emerald-500/15 text-emerald-100";
    default:
      return "border-slate-600 bg-slate-800 text-slate-200";
  }
}

function quotaModeClassName(mode: QuotaMode) {
  switch (mode) {
    case "BLOCKED":
      return "border-red-400/30 bg-red-500/15 text-red-100";
    case "PASSTHROUGH":
      return "border-amber-400/30 bg-amber-500/15 text-amber-100";
    case "DEGRADED_RETRIEVE":
      return "border-orange-400/30 bg-orange-500/15 text-orange-100";
    default:
      return "border-emerald-400/30 bg-emerald-500/15 text-emerald-100";
  }
}

function jobStatusClassName(status: string) {
  const normalized = status.toLowerCase();
  if (["complete", "completed", "processed"].includes(normalized)) {
    return "border-emerald-400/30 bg-emerald-500/15 text-emerald-100";
  }
  if (["dead", "failed", "error"].includes(normalized)) {
    return "border-red-400/30 bg-red-500/15 text-red-100";
  }
  if (["processing", "queued"].includes(normalized)) {
    return "border-sky-400/30 bg-sky-500/15 text-sky-100";
  }
  return "border-slate-600 bg-slate-800 text-slate-200";
}

function formatPercent(value: number | null | undefined, totalCalls?: number | null) {
  if (totalCalls === 0 || value === null || value === undefined) {
    return "-";
  }
  return `${(value * 100).toFixed(1)}%`;
}

export function TenantQuickView({
  tenant,
  onClose,
}: {
  tenant: TenantQuickViewData | null;
  onClose: () => void;
}) {
  if (!tenant) {
    return null;
  }

  const recentJobs = (tenant.recent_extraction_jobs ?? tenant.recent_jobs ?? []).slice(0, 5);

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-950/60">
      <button
        type="button"
        className="absolute inset-0 cursor-default"
        aria-label="Close tenant quick view"
        onClick={onClose}
      />
      <aside className="relative z-10 flex h-full w-full max-w-xl flex-col border-l border-slate-800 bg-slate-950 shadow-2xl">
        <div className="flex items-start justify-between gap-4 border-b border-slate-800 p-6">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-sky-300">
              Tenant Quick View
            </p>
            <h2 className="mt-3 text-2xl font-semibold text-white">{tenant.company_name}</h2>
            <p className="mt-1 text-xs text-slate-500">{tenant.tenant_id}</p>
            <div className="mt-4 flex flex-wrap gap-2">
              <Badge className={planBadgeClassName(tenant.plan_tier)}>
                {tenant.plan_tier}
              </Badge>
              <Badge className={quotaModeClassName(tenant.quota_mode)}>
                {tenant.quota_mode}
              </Badge>
            </div>
          </div>
          <button
            type="button"
            className="rounded-xl border border-slate-800 p-2 text-slate-400 transition hover:bg-slate-900 hover:text-white"
            onClick={onClose}
          >
            <X className="size-4" />
          </button>
        </div>

        <div className="flex-1 space-y-5 overflow-y-auto p-6">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4">
              <p className="text-xs uppercase tracking-[0.18em] text-slate-500">
                Extraction Rate
              </p>
              <p className="mt-3 text-2xl font-semibold text-white">
                {formatPercent(
                  tenant.extraction_success_rate,
                  tenant.total_extraction_calls_mtd,
                )}
              </p>
            </div>
            <div className="rounded-2xl border border-purple-500/30 bg-purple-500/10 p-4">
              <p className="text-xs uppercase tracking-[0.18em] text-purple-200">
                Conflicts MTD
              </p>
              <p className="mt-3 text-2xl font-semibold text-white">
                {(tenant.conflicts_resolved_mtd ?? 0).toLocaleString()}
              </p>
            </div>
            <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4">
              <p className="text-xs uppercase tracking-[0.18em] text-amber-100">
                Hot Memories
              </p>
              <p className="mt-3 text-2xl font-semibold text-white">
                {(tenant.hot_memories_count ?? 0).toLocaleString()}
              </p>
            </div>
            <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4">
              <p className="text-xs uppercase tracking-[0.18em] text-slate-500">
                Auto Archived MTD
              </p>
              <p className="mt-3 text-2xl font-semibold text-white">
                {(tenant.auto_archived_mtd ?? 0).toLocaleString()}
              </p>
            </div>
          </div>

          <section className="rounded-3xl border border-slate-800 bg-slate-900/70 p-5">
            <h3 className="text-sm font-semibold text-white">Last 5 extraction jobs</h3>
            {recentJobs.length > 0 ? (
              <div className="mt-4 space-y-3">
                {recentJobs.map((job) => (
                  <div
                    key={job.id}
                    className="flex items-center justify-between gap-3 rounded-2xl border border-slate-800 bg-slate-950/50 p-3"
                  >
                    <div>
                      <p className="font-mono text-xs text-slate-300">{job.id}</p>
                      <p className="mt-1 text-xs text-slate-500">
                        attempts {job.attempts}
                      </p>
                    </div>
                    <Badge className={jobStatusClassName(job.status)}>
                      {job.status}
                    </Badge>
                  </div>
                ))}
              </div>
            ) : (
              <p className="mt-4 rounded-2xl border border-dashed border-slate-700 p-4 text-sm text-slate-400">
                No recent extraction job data was included in the loaded tenant response.
              </p>
            )}
          </section>
        </div>

        <div className="border-t border-slate-800 p-6">
          <Link
            href={`/tenants/${tenant.tenant_id}`}
            className="inline-flex w-full justify-center rounded-2xl bg-sky-500 px-4 py-3 text-sm font-semibold text-white transition hover:bg-sky-400"
          >
            View full detail
          </Link>
        </div>
      </aside>
    </div>
  );
}

