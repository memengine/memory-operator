"use client";

import { AuditLogEntry } from "@/lib/admin-api";

function formatRelativeTime(value: string) {
  const diffMs = Date.now() - new Date(value).getTime();
  const minutes = Math.max(0, Math.floor(diffMs / 60_000));
  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

function truncate(value: string | null, length: number, fallback = "—") {
  if (!value) return fallback;
  return value.length <= length ? value : `${value.slice(0, length)}...`;
}

function actionClassName(action: string) {
  switch (action) {
    case "memory_created":
      return "border-emerald-400/30 bg-emerald-500/15 text-emerald-100";
    case "memory_deleted":
      return "border-red-400/30 bg-red-500/15 text-red-100";
    case "memory_archived":
      return "border-slate-600 bg-slate-800 text-slate-200";
    case "memory_retrieved":
      return "border-sky-400/30 bg-sky-500/15 text-sky-100";
    case "conflict_resolved":
      return "border-fuchsia-400/30 bg-fuchsia-500/15 text-fuchsia-100";
    case "proxy_user_deleted":
      return "border-red-500/40 bg-red-950/50 text-red-100";
    case "job_discarded":
      return "border-amber-400/30 bg-amber-500/15 text-amber-100";
    default:
      return "border-slate-600 bg-slate-800 text-slate-200";
  }
}

type AuditTableProps = {
  rows: AuditLogEntry[];
  nextCursor: string | null;
  loadingMore: boolean;
  onLoadMore: () => void;
  onViewChanges: (entry: AuditLogEntry) => void;
};

export function AuditTable({
  rows,
  nextCursor,
  loadingMore,
  onLoadMore,
  onViewChanges,
}: AuditTableProps) {
  return (
    <div className="overflow-hidden rounded-3xl border border-slate-800 bg-slate-900/70">
      <table className="w-full text-left">
        <thead className="bg-slate-950/30 text-sm text-slate-400">
          <tr className="border-b border-slate-800">
            <th className="px-4 py-3 font-medium">Time</th>
            <th className="py-3 font-medium">Tenant</th>
            <th className="py-3 font-medium">Action</th>
            <th className="py-3 font-medium">Memory ID</th>
            <th className="py-3 font-medium">IP Address</th>
            <th className="px-4 py-3 font-medium">Changes</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((entry) => (
            <tr key={entry.id} className="border-b border-slate-800/80 text-sm text-slate-200 last:border-b-0">
              <td className="px-4 py-4" title={entry.created_at}>
                <div>
                  <p className="font-medium text-white">{formatRelativeTime(entry.created_at)}</p>
                  <p className="mt-1 text-xs text-slate-500">{new Date(entry.created_at).toLocaleString()}</p>
                </div>
              </td>
              <td className="py-4 text-slate-300">
                {entry.company_name ? truncate(entry.company_name, 20, "Unknown") : (
                  <span className="text-slate-500">Unknown</span>
                )}
              </td>
              <td className="py-4">
                <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-medium ${actionClassName(entry.action)}`}>
                  {entry.action}
                </span>
              </td>
              <td className="py-4 font-mono text-xs text-slate-300">
                {entry.memory_id ? entry.memory_id.slice(0, 8) : "—"}
              </td>
              <td className="py-4 text-slate-400">{entry.ip_address ?? "—"}</td>
              <td className="px-4 py-4">
                {entry.old_value_summary || entry.new_value_summary ? (
                  <button
                    type="button"
                    onClick={() => onViewChanges(entry)}
                    className="rounded-full border border-slate-700 px-3 py-1 text-xs font-medium text-slate-200 transition hover:bg-slate-800"
                  >
                    View
                  </button>
                ) : (
                  "—"
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {nextCursor ? (
        <div className="border-t border-slate-800 px-4 py-4">
          <button
            type="button"
            onClick={onLoadMore}
            disabled={loadingMore}
            className="rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-slate-200 transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loadingMore ? "Loading..." : "Load more"}
          </button>
        </div>
      ) : null}
    </div>
  );
}
