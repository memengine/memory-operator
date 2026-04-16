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
  rows: CostSummaryTenant[];
  totalCost: number;
};

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
            <th className="px-4 py-3 font-medium">% of Total</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((tenant, index) => {
            const pct = totalCost > 0 ? (tenant.estimated_cost_usd / totalCost) * 100 : 0;
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
