"use client";

import useSWR from "swr";

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

                <div className="mt-6 rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4 text-sm text-amber-100">
                  Estimates based on gpt-4o-mini pricing ($0.15/1M tokens). Actual billing may differ.
                </div>
              </div>
            </section>
          </div>
        </>
      ) : null}
    </div>
  );
}
