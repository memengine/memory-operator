"use client";

import { useParams } from "next/navigation";
import { Mail, RefreshCcw } from "lucide-react";
import useSWR from "swr";

import { MiniQuotaBar } from "@/components/mini-quota-bar";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { getTenantDetail } from "@/lib/admin-api";

function planBadgeClassName(plan: "free" | "starter" | "growth" | "enterprise") {
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

function quotaModeClassName(mode: "FULL" | "PASSTHROUGH" | "DEGRADED_RETRIEVE" | "BLOCKED") {
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

function formatTimestamp(value: string | null) {
  if (!value) {
    return "Unavailable";
  }
  return new Date(value).toLocaleString();
}

function formatDuration(startedAt: string | null, completedAt: string | null) {
  if (!startedAt || !completedAt) {
    return "In progress";
  }
  const diffMs = new Date(completedAt).getTime() - new Date(startedAt).getTime();
  const seconds = Math.max(1, Math.round(diffMs / 1000));
  return `${seconds}s`;
}

export default function TenantDetailPage() {
  const params = useParams<{ id: string }>();
  const tenantId = Array.isArray(params.id) ? params.id[0] : params.id;
  const { data, error, isLoading, mutate } = useSWR(
    tenantId ? `tenant-detail-${tenantId}` : null,
    () => getTenantDetail(tenantId),
    {
      refreshInterval: 60_000,
      revalidateOnFocus: false,
    },
  );

  const quotaPct = 1 - (data?.usage.budget_remaining_pct ?? 1);
  const qualityBars = data
    ? Object.entries(data.quality_summary.by_layer)
    : [];
  const maxLayerCount = Math.max(1, ...qualityBars.map(([, count]) => count));

  return (
    <div className="min-h-screen bg-slate-950 px-6 py-8 text-slate-100 lg:px-10">
      <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.35em] text-sky-300">
            Tenant Detail
          </p>
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <h1 className="text-4xl font-semibold tracking-tight text-white">
              {data?.tenant.company_name ?? "Loading tenant..."}
            </h1>
            {data ? (
              <>
                <Badge className={planBadgeClassName(data.tenant.plan_tier)}>
                  {data.tenant.plan_tier}
                </Badge>
                <Badge className={quotaModeClassName(data.usage.mode)}>
                  {data.usage.mode}
                </Badge>
              </>
            ) : null}
          </div>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-400">
            Review usage posture, recent extraction jobs, and the weekly quality profile for this tenant.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <a
            href={`mailto:?subject=MemoryOS%20operator%20follow-up%20for%20${encodeURIComponent(
              data?.tenant.company_name ?? tenantId,
            )}`}
            className="inline-flex items-center gap-2 rounded-2xl border border-slate-800 bg-slate-900/80 px-4 py-3 text-sm text-slate-200 transition hover:bg-slate-800"
          >
            <Mail className="size-4" />
            Contact Tenant
          </a>
          <button
            type="button"
            onClick={() => mutate()}
            className="inline-flex items-center gap-2 rounded-2xl border border-slate-800 bg-slate-900/80 px-4 py-3 text-sm text-slate-300 transition hover:bg-slate-800"
          >
            <RefreshCcw className="size-4" />
            Refresh
          </button>
        </div>
      </div>

      {error ? (
        <div className="mb-6 rounded-3xl border border-red-500/30 bg-red-500/10 px-5 py-4 text-sm text-red-200">
          Failed to load tenant detail.
        </div>
      ) : null}

      {isLoading && !data ? (
        <div className="h-96 animate-pulse rounded-3xl border border-slate-800 bg-slate-900/70" />
      ) : data ? (
        <div className="space-y-6">
          <section className="rounded-3xl border border-slate-800 bg-slate-900/70 p-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.35em] text-sky-300">
                  Usage summary
                </p>
                <p className="mt-3 text-sm text-slate-400">
                  Monthly quota posture with live counter totals and cost estimate.
                </p>
              </div>
              <MiniQuotaBar quotaPct={quotaPct} />
            </div>
            <div className="mt-6 grid gap-4 md:grid-cols-4">
              <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4">
                <p className="text-sm text-slate-400">Calls used</p>
                <p className="mt-2 text-3xl font-semibold text-white">
                  {data.usage.calls_used.toLocaleString()}
                </p>
                <p className="mt-2 text-xs text-slate-500">
                  Limit {data.usage.calls_limit?.toLocaleString() ?? "Unlimited"}
                </p>
              </div>
              <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4">
                <p className="text-sm text-slate-400">Tokens used</p>
                <p className="mt-2 text-3xl font-semibold text-white">
                  {data.usage.tokens_used.toLocaleString()}
                </p>
                <p className="mt-2 text-xs text-slate-500">
                  Limit {data.usage.tokens_limit?.toLocaleString() ?? "Unlimited"}
                </p>
              </div>
              <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4">
                <p className="text-sm text-slate-400">Cost estimate this month</p>
                <p className="mt-2 text-3xl font-semibold text-white">
                  ${data.cost_estimate_mtd.toFixed(4)}
                </p>
                <p className="mt-2 text-xs text-slate-500">
                  Estimate only
                </p>
              </div>
              <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4">
                <p className="text-sm text-slate-400">Reset date</p>
                <p className="mt-2 text-xl font-semibold text-white">
                  {formatTimestamp(data.usage.reset_at)}
                </p>
                <p className="mt-2 text-xs text-slate-500">
                  Tenant created {formatTimestamp(data.tenant.created_at)}
                </p>
              </div>
            </div>
          </section>

          <section className="rounded-3xl border border-slate-800 bg-slate-900/70 p-6">
            <div className="mb-5">
              <p className="text-xs font-semibold uppercase tracking-[0.35em] text-sky-300">
                Recent jobs
              </p>
              <p className="mt-3 text-sm text-slate-400">
                Last 20 extraction jobs for this tenant. Dead jobs are highlighted for fast triage.
              </p>
            </div>
            <div className="overflow-hidden rounded-2xl border border-slate-800">
              <Table>
                <TableHeader className="bg-slate-950/30">
                  <TableRow className="border-slate-800 hover:bg-transparent">
                    <TableHead className="px-4 text-slate-400">Status</TableHead>
                    <TableHead className="text-slate-400">User</TableHead>
                    <TableHead className="text-slate-400">Created</TableHead>
                    <TableHead className="text-slate-400">Duration</TableHead>
                    <TableHead className="text-slate-400">Attempts</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.recent_jobs.map((job) => (
                    <TableRow
                      key={job.id}
                      className={`border-slate-800 ${
                        job.status === "dead" ? "bg-red-500/10 hover:bg-red-500/15" : "hover:bg-slate-800/40"
                      }`}
                    >
                      <TableCell className="px-4 py-4">
                        <Badge
                          className={
                            job.status === "dead"
                              ? "border-red-400/30 bg-red-500/15 text-red-100"
                              : "border-emerald-400/30 bg-emerald-500/15 text-emerald-100"
                          }
                        >
                          {job.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-slate-200">{job.proxy_user_id}</TableCell>
                      <TableCell className="text-slate-300">{formatTimestamp(job.created_at)}</TableCell>
                      <TableCell className="text-slate-300">
                        {formatDuration(job.processing_started_at, job.completed_at)}
                      </TableCell>
                      <TableCell className="text-slate-300">{job.attempts}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </section>

          <section className="rounded-3xl border border-slate-800 bg-slate-900/70 p-6">
            <div className="mb-5">
              <p className="text-xs font-semibold uppercase tracking-[0.35em] text-sky-300">
                Quality summary
              </p>
              <p className="mt-3 text-sm text-slate-400">
                Weekly block profile by quality layer. Block rate is {(data.quality_summary.block_rate * 100).toFixed(1)}%.
              </p>
            </div>
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              {qualityBars.map(([layer, count]) => (
                <div
                  key={layer}
                  className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4"
                >
                  <div className="flex items-center justify-between">
                    <p className="font-semibold text-white">{layer}</p>
                    <span className="text-sm text-slate-400">{count}</span>
                  </div>
                  <div className="mt-4 h-24 overflow-hidden rounded-xl bg-slate-900">
                    <div
                      className="mt-auto h-full rounded-xl bg-sky-500/80 transition-all"
                      style={{ height: `${Math.max((count / maxLayerCount) * 100, count > 0 ? 14 : 0)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>
      ) : null}
    </div>
  );
}
