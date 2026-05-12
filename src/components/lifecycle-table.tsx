"use client";

import { Badge } from "@/components/ui/badge";

export type LifecycleReportRow = {
  tenant_id: string;
  company_name: string;
  last_run_at: string | null;
  decayed_count: number;
  archived_count: number;
  promoted_to_hot: number;
  rescored_count: number;
  next_run_at: string | null;
};

function formatDateTime(value: string | null) {
  if (!value) {
    return "Never run";
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "Unknown";
  }
  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function isStaleRun(value: string | null) {
  if (!value) {
    return false;
  }
  const timestamp = new Date(value).getTime();
  if (Number.isNaN(timestamp)) {
    return false;
  }
  return Date.now() - timestamp > 14 * 24 * 60 * 60 * 1000;
}

export function LifecycleTable({ rows }: { rows: LifecycleReportRow[] }) {
  const sortedRows = [...rows].sort((left, right) => right.archived_count - left.archived_count);

  return (
    <div className="overflow-hidden rounded-3xl border border-slate-800 bg-slate-900/70">
      <table className="w-full text-left text-sm">
        <thead className="bg-slate-950/30 text-slate-400">
          <tr className="border-b border-slate-800">
            <th className="px-4 py-3 font-medium">Company</th>
            <th className="py-3 font-medium">Last Run</th>
            <th className="py-3 font-medium">Decayed</th>
            <th className="py-3 font-medium">Archived</th>
            <th className="py-3 font-medium">Hot Promoted</th>
            <th className="py-3 font-medium">Rescored</th>
            <th className="px-4 py-3 font-medium">Next Run</th>
          </tr>
        </thead>
        <tbody>
          {sortedRows.map((row) => {
            const stale = isStaleRun(row.last_run_at);
            return (
              <tr
                key={row.tenant_id}
                className="border-b border-slate-800/80 text-slate-200 last:border-b-0"
              >
                <td className="px-4 py-4">
                  <p className="font-medium text-white">{row.company_name}</p>
                  <p className="mt-1 text-xs text-slate-500">{row.tenant_id}</p>
                </td>
                <td className="py-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={row.last_run_at ? "text-slate-300" : "text-amber-300"}>
                      {formatDateTime(row.last_run_at)}
                    </span>
                    {!row.last_run_at ? (
                      <Badge className="border-amber-400/30 bg-amber-500/15 text-amber-100">
                        Never run
                      </Badge>
                    ) : null}
                    {stale ? (
                      <Badge className="border-amber-400/30 bg-amber-500/15 text-amber-100">
                        Stale
                      </Badge>
                    ) : null}
                  </div>
                </td>
                <td className="py-4 tabular-nums">{row.decayed_count.toLocaleString()}</td>
                <td className="py-4 tabular-nums">{row.archived_count.toLocaleString()}</td>
                <td className="py-4 tabular-nums">{row.promoted_to_hot.toLocaleString()}</td>
                <td className="py-4 tabular-nums">{row.rescored_count.toLocaleString()}</td>
                <td className="px-4 py-4 text-slate-300">{formatDateTime(row.next_run_at)}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

