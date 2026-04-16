"use client";

import { DollarSign, Shield, TrendingUp, Zap } from "lucide-react";

import { CostSummaryResponse } from "@/lib/admin-api";

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

function metricTone(className: string) {
  return `rounded-3xl border p-5 ${className}`;
}

type CostMetricsRowProps = {
  summary: CostSummaryResponse;
};

export function CostMetricsRow({ summary }: CostMetricsRowProps) {
  const monthToDateTone =
    summary.total_estimated_cost_usd > 500
      ? "border-red-500/30 bg-red-500/10"
      : summary.total_estimated_cost_usd >= 100
        ? "border-amber-500/30 bg-amber-500/10"
        : "border-emerald-500/30 bg-emerald-500/10";

  const projectedTone =
    summary.total_estimated_cost_usd > 0 &&
    summary.projected_month_cost_usd > summary.total_estimated_cost_usd * 2
      ? "border-amber-500/30 bg-amber-500/10"
      : "border-slate-800 bg-slate-900/70";

  return (
    <div className="grid gap-4 xl:grid-cols-4">
      <div className={metricTone(monthToDateTone)}>
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-sm text-slate-300">Month-to-Date Cost</p>
            <p className="mt-4 text-4xl font-semibold text-white">
              {formatCurrency(summary.total_estimated_cost_usd, 2)}
            </p>
            <p className="mt-3 text-sm text-slate-400">
              {formatInteger(summary.total_tokens_mtd)} tokens
            </p>
          </div>
          <div className="rounded-2xl bg-white/5 p-3 text-slate-100">
            <DollarSign className="size-5" />
          </div>
        </div>
      </div>

      <div className={metricTone("border-slate-800 bg-slate-900/70")}>
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-sm text-slate-300">Average Cost per Call</p>
            <p className="mt-4 text-4xl font-semibold text-white">
              {formatCurrency(summary.avg_cost_per_call ?? 0, 6)}
            </p>
            <p className="mt-3 text-sm text-slate-400">per add() call</p>
          </div>
          <div className="rounded-2xl bg-white/5 p-3 text-slate-100">
            <Zap className="size-5" />
          </div>
        </div>
      </div>

      <div className={metricTone(projectedTone)}>
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-sm text-slate-300">Projected Month Total</p>
            <p className="mt-4 text-4xl font-semibold text-white">
              {formatCurrency(summary.projected_month_cost_usd, 2)}
            </p>
            <p className="mt-3 text-sm text-slate-400">based on current usage rate</p>
          </div>
          <div className="rounded-2xl bg-white/5 p-3 text-slate-100">
            <TrendingUp className="size-5" />
          </div>
        </div>
      </div>

      <div className={metricTone("border-emerald-500/30 bg-emerald-500/10")}>
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-sm text-slate-300">Gate Savings</p>
            <p className="mt-4 text-4xl font-semibold text-white">
              {formatCurrency(summary.estimated_savings_from_gate_usd, 2)}
            </p>
            <p className="mt-3 text-sm text-slate-400">
              {formatInteger(summary.total_gate_blocks_mtd)} calls blocked
            </p>
          </div>
          <div className="rounded-2xl bg-white/5 p-3 text-slate-100">
            <Shield className="size-5" />
          </div>
        </div>
      </div>
    </div>
  );
}
