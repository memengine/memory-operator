"use client";

import { CostSummaryTenant } from "@/lib/admin-api";

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

type TopTenantsTableProps = {
  rows: Array<
    CostSummaryTenant & {
      extraction_success_rate?: number | null;
      conflicts_resolved_mtd?: number | null;
    }
  >;
  totalCost: number;
};

function formatPercent(value: number | null | undefined) {
  if (value === null || value === undefined) {
    return "-";
  }
  return `${(value * 100).toFixed(1)}%`;
}

export function TopTenantsTable({ rows, totalCost }: TopTenantsTableProps) {
  if (totalCost <= 0 || rows.length === 0) {
    return (
      <div className="rounded-3xl border border-slate-800 bg-slate-900/70 px-5 py-12 text-center text-sm text-slate-400">
        No cost data for this month yet.
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-3xl border border-slate-800 bg-slate-900/70">
      <table className="w-full text-left">
        <thead className="bg-slate-950/30 text-sm text-slate-400">
          <tr className="border-b border-slate-800">
            <th className="px-4 py-3 font-medium">#</th>
            <th className="py-3 font-medium">Company</th>
            <th className="py-3 font-medium">Tokens Used</th>
            <th className="py-3 font-medium">Est. Cost</th>
            <th className="py-3 font-medium">Success Rate</th>
            <th className="py-3 font-medium">Conflicts</th>
            <th className="px-4 py-3 font-medium">% of Total</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((tenant, index) => {
            const pct = totalCost > 0 ? (tenant.estimated_cost_usd / totalCost) * 100 : 0;
            const successRate = tenant.extraction_success_rate;
            const conflicts = tenant.conflicts_resolved_mtd ?? 0;
            return (
              <tr
                key={tenant.tenant_id}
                className="border-b border-slate-800/80 text-sm text-slate-200 last:border-b-0"
              >
                <td className="px-4 py-4 text-slate-400">{index + 1}</td>
                <td className="py-4">
                  <div>
                    <p className="font-medium text-white">{tenant.company_name}</p>
                    <p className="mt-1 text-xs text-slate-500">{tenant.tenant_id}</p>
                  </div>
                </td>
                <td className="py-4 tabular-nums">{formatInteger(tenant.tokens)}</td>
                <td className="py-4 tabular-nums">{formatCurrency(tenant.estimated_cost_usd, 2)}</td>
                <td
                  className={`py-4 tabular-nums ${
                    successRate !== null &&
                    successRate !== undefined &&
                    successRate < 0.5
                      ? "text-red-300"
                      : "text-slate-200"
                  }`}
                  title={
                    successRate !== null &&
                    successRate !== undefined &&
                    successRate < 0.5
                      ? "Tenant may have integration issues"
                      : undefined
                  }
                >
                  {formatPercent(successRate)}
                </td>
                <td className="py-4">
                  {conflicts > 100 ? (
                    <span className="rounded-full border border-purple-400/30 bg-purple-500/15 px-2.5 py-1 text-xs font-medium text-purple-100">
                      {formatInteger(conflicts)}
                    </span>
                  ) : (
                    <span className="tabular-nums text-slate-300">
                      {formatInteger(conflicts)}
                    </span>
                  )}
                </td>
                <td className="px-4 py-4">
                  <div className="flex items-center gap-3">
                    <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-800">
                      <div
                        className="h-full rounded-full bg-emerald-400"
                        style={{ width: `${Math.max(4, Math.min(100, pct))}%` }}
                      />
                    </div>
                    <span className="w-14 text-right text-xs tabular-nums text-slate-400">
                      {pct.toFixed(1)}%
                    </span>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
