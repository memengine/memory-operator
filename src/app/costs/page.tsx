"use client";

import { AlertTriangle, CheckCircle, MessageCircle, Zap } from "lucide-react";
import useSWR from "swr";

import { ConflictBreakdownChart } from "@/components/conflict-breakdown-chart";
import { CostMetricsRow } from "@/components/cost-metrics-row";
import { TopTenantsTable } from "@/components/top-tenants-table";
import { getCostSummary } from "@/lib/admin-api";

function formatCurrency(value: number, digits = 2) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(value);
}

function formatInteger(value: number) {
  return new Intl.NumberFormat("en-US").format(value);
}

function formatPercent(value: number | null | undefined) {
  if (value === null || value === undefined) {
    return "-";
  }
  return `${(value * 100).toFixed(1)}%`;
}

type CostSummaryWithExtraction = {
  avg_extraction_tokens?: number | null;
  total_extraction_calls_mtd?: number | null;
  extraction_success_rate?: number | null;
  nothing_to_extract_rate?: number | null;
  top_5_by_nothing_to_extract?: Array<{
    tenant_id: string;
    company_name: string;
    rate: number;
    add_calls: number;
  }>;
  conflicts_resolved_mtd?: number | null;
  memories_auto_archived_mtd?: number | null;
  total_conflicts_resolved_mtd?: number | null;
  cross_user_conflicts_pending_total?: number | null;
  auto_resolution_rate_avg?: number | null;
  clarifications_triggered_mtd?: number | null;
  clarifications_resolved_mtd?: number | null;
  clarification_resolution_rate?: number | null;
  conflict_types_breakdown?: Record<string, number>;
};

function extractionRateTone(value: number | null | undefined) {
  if (value === null || value === undefined) {
    return "border-slate-800 bg-slate-900/70";
  }
  if (value > 0.7) {
    return "border-emerald-500/30 bg-emerald-500/10";
  }
  if (value >= 0.5) {
    return "border-amber-500/30 bg-amber-500/10";
  }
  return "border-red-500/30 bg-red-500/10";
}

function noExtractRateTone(value: number | null | undefined) {
  if (value === null || value === undefined || value < 0.3) {
    return "border-slate-800 bg-slate-900/70";
  }
  if (value <= 0.5) {
    return "border-amber-500/30 bg-amber-500/10";
  }
  return "border-red-500/30 bg-red-500/10";
}

function tokenEfficiencyLabel(value: number) {
  if (value <= 0) {
    return "No extraction data yet";
  }
  if (value < 800) {
    return "Efficient";
  }
  if (value <= 1500) {
    return "Normal";
  }
  return "High - review conversations";
}

function tokenEfficiencyTone(value: number) {
  if (value > 1500) {
    return "border-amber-500/30 bg-amber-500/10";
  }
  if (value > 0 && value < 800) {
    return "border-emerald-500/30 bg-emerald-500/10";
  }
  return "border-slate-800 bg-slate-900/70";
}

function clarificationRateTone(value: number | null | undefined) {
  if (value !== null && value !== undefined && value > 0.7) {
    return "border-emerald-500/30 bg-emerald-500/10";
  }
  if (value !== null && value !== undefined && value >= 0.4) {
    return "border-amber-500/30 bg-amber-500/10";
  }
  return "border-red-500/30 bg-red-500/10";
}

function ExtractionStatBox({
  label,
  value,
  subtext,
  tone = "border-slate-800 bg-slate-900/70",
}: {
  label: string;
  value: string;
  subtext: string;
  tone?: string;
}) {
  return (
    <div className={`rounded-2xl border p-4 ${tone}`}>
      <p className="text-xs font-medium uppercase tracking-[0.18em] text-slate-400">
        {label}
      </p>
      <p className="mt-3 text-2xl font-semibold text-white">{value}</p>
      <p className="mt-2 text-xs leading-5 text-slate-400">{subtext}</p>
    </div>
  );
}

function ConflictStatBox({
  label,
  value,
  subtext,
  icon: Icon,
  tone,
}: {
  label: string;
  value: string;
  subtext: string;
  icon: typeof Zap;
  tone: string;
}) {
  return (
    <div className={`rounded-3xl border p-5 ${tone}`}>
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.18em] text-slate-400">
            {label}
          </p>
          <p className="mt-4 text-3xl font-semibold text-white">{value}</p>
        </div>
        <div className="rounded-2xl bg-slate-950/40 p-3 text-slate-100">
          <Icon className="size-5" />
        </div>
      </div>
      <p className="mt-3 text-sm leading-6 text-slate-400">{subtext}</p>
    </div>
  );
}

export default function CostsPage() {
  const { data, error, isLoading, mutate } = useSWR("cost-summary", getCostSummary, {
    refreshInterval: 300_000,
    revalidateOnFocus: false,
  });

  const ratio =
    data && data.total_estimated_cost_usd > 0
      ? data.projected_month_cost_usd / data.total_estimated_cost_usd
      : 0;

  return (
    <div className="min-h-screen bg-slate-950 px-6 py-8 text-slate-100 lg:px-10">
      <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.35em] text-sky-300">
            Cost Monitor
          </p>
          <h1 className="mt-4 text-4xl font-semibold tracking-tight text-white">
            Spend and efficiency outlook
          </h1>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-400">
            Review month-to-date usage cost, projected spend, and which tenants are driving the current burn.
          </p>
        </div>
        <button
          type="button"
          onClick={() => mutate()}
          className="inline-flex items-center rounded-2xl border border-slate-800 bg-slate-900/80 px-4 py-3 text-sm text-slate-300 transition hover:bg-slate-800"
        >
          Refresh
        </button>
      </div>

      {error ? (
        <div className="mb-6 rounded-3xl border border-red-500/30 bg-red-500/10 px-5 py-4 text-sm text-red-200">
          Failed to load cost summary.
        </div>
      ) : null}

      {isLoading && !data ? (
        <>
          <div className="grid gap-4 xl:grid-cols-4">
            {Array.from({ length: 4 }).map((_, index) => (
              <div
                key={index}
                className="h-44 animate-pulse rounded-3xl border border-slate-800 bg-slate-900/70"
              />
            ))}
          </div>
          <div className="mt-6 grid gap-6 lg:grid-cols-5">
            <div className="h-80 animate-pulse rounded-3xl border border-slate-800 bg-slate-900/70 lg:col-span-3" />
            <div className="h-80 animate-pulse rounded-3xl border border-slate-800 bg-slate-900/70 lg:col-span-2" />
          </div>
        </>
      ) : data ? (
        <>
          <CostMetricsRow summary={data} />

          {(() => {
            const extraction = data as typeof data & CostSummaryWithExtraction;
            const avgTokens = extraction.avg_extraction_tokens ?? 0;
            return (
              <section className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-5">
                <ExtractionStatBox
                  label="Avg Tokens per Extraction"
                  value={
                    avgTokens > 0
                      ? `${formatInteger(Math.round(avgTokens))} tokens`
                      : "-"
                  }
                  subtext={tokenEfficiencyLabel(avgTokens)}
                  tone={tokenEfficiencyTone(avgTokens)}
                />
                <ExtractionStatBox
                  label="Extraction Success Rate"
                  value={formatPercent(extraction.extraction_success_rate)}
                  subtext="of add() calls produced memories"
                  tone={extractionRateTone(extraction.extraction_success_rate)}
                />
                <ExtractionStatBox
                  label="Nothing to Extract Rate"
                  value={formatPercent(extraction.nothing_to_extract_rate)}
                  subtext="conversations with no storable facts"
                  tone={noExtractRateTone(extraction.nothing_to_extract_rate)}
                />
                <ExtractionStatBox
                  label="Conflicts Resolved (MTD)"
                  value={formatInteger(extraction.conflicts_resolved_mtd ?? 0)}
                  subtext="memory conflicts auto-resolved this month"
                  tone="border-purple-500/30 bg-purple-500/10"
                />
                <ExtractionStatBox
                  label="Auto-Archived (MTD)"
                  value={formatInteger(extraction.memories_auto_archived_mtd ?? 0)}
                  subtext="low-value memories cleaned up this month"
                />
              </section>
            );
          })()}

          <div className="mt-6 grid gap-6 lg:grid-cols-5">
            <section className="lg:col-span-3">
              <div className="mb-4">
                <h2 className="text-lg font-semibold text-white">Top Tenants by Cost</h2>
                <p className="mt-1 text-sm text-slate-400">
                  Current month estimate based on extraction token usage.
                </p>
              </div>
              <TopTenantsTable
                rows={data.top_5_tenants_by_cost}
                totalCost={data.total_estimated_cost_usd}
              />
            </section>

            <section className="lg:col-span-2">
              <div className="mb-4">
                <h2 className="text-lg font-semibold text-white">Cost Breakdown</h2>
                <p className="mt-1 text-sm text-slate-400">
                  Quick operational context without waiting on a daily breakdown feed.
                </p>
              </div>
              <div className="rounded-3xl border border-slate-800 bg-slate-900/70 p-5">
                <dl className="space-y-4 text-sm">
                  <div className="flex items-start justify-between gap-4">
                    <dt className="text-slate-400">Extraction tokens</dt>
                    <dd className="font-medium text-white">
                      {formatInteger(data.total_tokens_mtd)}
                    </dd>
                  </div>
                  <div className="flex items-start justify-between gap-4">
                    <dt className="text-slate-400">Gate blocks saved</dt>
                    <dd className="font-medium text-white">
                      {formatInteger(data.total_gate_blocks_mtd)} calls
                    </dd>
                  </div>
                  <div className="flex items-start justify-between gap-4">
                    <dt className="text-slate-400">Effective cost/call</dt>
                    <dd className="font-medium text-white">
                      {data.avg_cost_per_call === null
                        ? "N/A"
                        : formatCurrency(data.avg_cost_per_call, 6)}
                    </dd>
                  </div>
                  <div className="flex items-start justify-between gap-4">
                    <dt className="text-slate-400">Projected vs MTD</dt>
                    <dd className="font-medium text-white">
                      {ratio > 0 ? `${ratio.toFixed(1)}× current rate` : "N/A"}
                    </dd>
                  </div>
                </dl>

                <div className="mt-6 rounded-2xl border border-slate-800 bg-slate-950/50 p-4 text-xs leading-5 text-slate-400">
                  Cost calculated at $0.15/1M tokens (gpt-4o-mini rate). Actual billing may vary by provider.
                </div>
              </div>
            </section>
          </div>

          {(() => {
            const extraction = data as typeof data & CostSummaryWithExtraction;
            const highNoExtractTenants =
              extraction.top_5_by_nothing_to_extract?.filter((tenant) => tenant.rate > 0.4) ??
              [];
            if (highNoExtractTenants.length === 0) {
              return null;
            }

            return (
              <section className="mt-8">
                <div className="mb-4">
                  <h2 className="text-lg font-semibold text-white">
                    Tenants with high nothing-to-extract rate
                  </h2>
                  <p className="mt-1 text-sm text-slate-400">
                    These tenants may have integration issues or low-value
                    conversation quality feeding the AI.
                  </p>
                </div>
                <div className="overflow-hidden rounded-3xl border border-slate-800 bg-slate-900/70">
                  <table className="w-full text-left">
                    <thead className="bg-slate-950/30 text-sm text-slate-400">
                      <tr className="border-b border-slate-800">
                        <th className="px-4 py-3 font-medium">Company</th>
                        <th className="py-3 font-medium">Nothing-to-Extract Rate</th>
                        <th className="px-4 py-3 font-medium">Add Calls</th>
                      </tr>
                    </thead>
                    <tbody>
                      {highNoExtractTenants.map((tenant) => (
                        <tr
                          key={tenant.tenant_id}
                          className="border-b border-slate-800/80 text-sm text-slate-200 last:border-b-0"
                        >
                          <td className="px-4 py-4">
                            <p className="font-medium text-white">{tenant.company_name}</p>
                            <p className="mt-1 text-xs text-slate-500">{tenant.tenant_id}</p>
                          </td>
                          <td className="py-4">
                            <span
                              className={`rounded-full border px-2.5 py-1 text-xs font-medium ${
                                tenant.rate > 0.5
                                  ? "border-red-400/30 bg-red-500/15 text-red-100"
                                  : "border-amber-400/30 bg-amber-500/15 text-amber-100"
                              }`}
                              title="High rate may indicate users are having very short or off-topic conversations with the AI"
                            >
                              {formatPercent(tenant.rate)}
                            </span>
                          </td>
                          <td className="px-4 py-4 tabular-nums">
                            {formatInteger(tenant.add_calls)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>
            );
          })()}

          {(() => {
            const extraction = data as typeof data & CostSummaryWithExtraction;
            const autoResolved =
              extraction.total_conflicts_resolved_mtd ??
              extraction.conflicts_resolved_mtd ??
              0;
            const pendingCrossUser =
              extraction.cross_user_conflicts_pending_total ?? 0;
            const clarificationsTriggered =
              extraction.clarifications_triggered_mtd ?? 0;
            const clarificationsResolved =
              extraction.clarifications_resolved_mtd ?? 0;
            const clarificationRate =
              extraction.clarification_resolution_rate ?? null;

            return (
              <section className="mt-8">
                <div className="mb-4">
                  <h2 className="text-lg font-semibold text-white">
                    Conflict Resolution This Month
                  </h2>
                  <p className="mt-1 text-sm text-slate-400">
                    Track what MemoryOS resolved automatically and what still
                    needs tenant review.
                  </p>
                </div>
                <div className="mb-6 grid gap-4 lg:grid-cols-2">
                  <ConflictStatBox
                    label="Auto-Resolved Conflicts"
                    value={formatInteger(autoResolved)}
                    subtext="single-user conflicts resolved automatically"
                    icon={Zap}
                    tone="border-emerald-500/30 bg-emerald-500/10"
                  />
                  <ConflictStatBox
                    label="Pending Cross-User Conflicts"
                    value={formatInteger(pendingCrossUser)}
                    subtext="require tenant review across all tenants"
                    icon={AlertTriangle}
                    tone={
                      pendingCrossUser > 0
                        ? "border-amber-500/30 bg-amber-500/10"
                        : "border-slate-800 bg-slate-900/70"
                    }
                  />
                </div>
                <ConflictBreakdownChart
                  breakdown={extraction.conflict_types_breakdown}
                />
                {clarificationsTriggered > 0 ? (
                  <div className="mt-6 rounded-3xl border border-slate-800 bg-slate-900/70 p-5">
                    <div className="mb-4">
                      <h3 className="text-base font-semibold text-white">
                        Clarification Effectiveness
                      </h3>
                      <p className="mt-1 text-sm text-slate-400">
                        Measures whether injected questions are naturally
                        resolving ambiguous memory conflicts.
                      </p>
                    </div>
                    <div className="grid gap-4 lg:grid-cols-2">
                      <ConflictStatBox
                        label="Clarifications Injected"
                        value={formatInteger(clarificationsTriggered)}
                        subtext="questions added to AI responses"
                        icon={MessageCircle}
                        tone="border-sky-500/30 bg-sky-500/10"
                      />
                      <ConflictStatBox
                        label="Conflicts Resolved via Clarification"
                        value={formatInteger(clarificationsResolved)}
                        subtext={`${formatPercent(clarificationRate)} success rate`}
                        icon={CheckCircle}
                        tone={clarificationRateTone(clarificationRate)}
                      />
                    </div>
                    {clarificationRate !== null && clarificationRate > 0.7 ? (
                      <p className="mt-4 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm leading-6 text-emerald-100">
                        Clarification injection is working well. Users are
                        naturally resolving conflicts in conversation.
                      </p>
                    ) : clarificationRate !== null && clarificationRate < 0.4 ? (
                      <p className="mt-4 rounded-2xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm leading-6 text-amber-100">
                        Low clarification resolution rate may indicate questions
                        are not natural enough or users are avoiding the topic.
                      </p>
                    ) : null}
                  </div>
                ) : null}
              </section>
            );
          })()}
        </>
      ) : null}
    </div>
  );
}
