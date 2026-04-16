"use client";

import { useMemo, useState } from "react";
import { Download } from "lucide-react";
import useSWR from "swr";

import { AuditFilters, AuditFilterValue } from "@/components/audit-filters";
import { AuditSlideover } from "@/components/audit-slideover";
import { AuditTable } from "@/components/audit-table";
import { AuditLogEntry, getAllTenants, getAuditLogs } from "@/lib/admin-api";

function toDateInput(value: Date) {
  return value.toISOString().slice(0, 10);
}

function createDefaultFilters(): AuditFilterValue {
  const now = new Date();
  const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  return {
    tenantId: "",
    action: "",
    startDate: toDateInput(yesterday),
    endDate: toDateInput(now),
  };
}

function csvEscape(value: string) {
  return `"${value.replace(/"/g, '""')}"`;
}

export default function AuditPage() {
  const [filters, setFilters] = useState<AuditFilterValue>(createDefaultFilters);
  const [rows, setRows] = useState<AuditLogEntry[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [totalCount, setTotalCount] = useState(0);
  const [loadingMore, setLoadingMore] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState<AuditLogEntry | null>(null);

  const queryParams = useMemo(
    () => ({
      tenant_id: filters.tenantId || undefined,
      action: filters.action || undefined,
      start_date: filters.startDate,
      end_date: filters.endDate,
      limit: 50,
    }),
    [filters],
  );

  const tenantsQuery = useSWR("audit-tenants", getAllTenants, {
    refreshInterval: 60_000,
    revalidateOnFocus: false,
  });

  const auditQuery = useSWR(["audit-logs", queryParams], () => getAuditLogs(queryParams), {
    refreshInterval: 30_000,
    revalidateOnFocus: false,
    onSuccess: (response) => {
      setRows(response.data);
      setNextCursor(response.next_cursor);
      setTotalCount(response.total_count);
    },
  });

  async function handleLoadMore() {
    if (!nextCursor) return;
    setLoadingMore(true);
    try {
      const response = await getAuditLogs({
        ...queryParams,
        cursor: nextCursor,
      });
      setRows((current) => [...current, ...response.data]);
      setNextCursor(response.next_cursor);
      setTotalCount(response.total_count);
    } finally {
      setLoadingMore(false);
    }
  }

  async function handleExportCsv() {
    const response = await getAuditLogs({
      tenant_id: filters.tenantId || undefined,
      action: filters.action || undefined,
      start_date: filters.startDate,
      end_date: filters.endDate,
      limit: 200,
    });
    const header = [
      "time",
      "tenant",
      "action",
      "memory_id",
      "ip_address",
      "old_value_summary",
      "new_value_summary",
    ];
    const lines = response.data.map((entry) =>
      [
        entry.created_at,
        entry.company_name ?? "Unknown",
        entry.action,
        entry.memory_id ?? "",
        entry.ip_address ?? "",
        entry.old_value_summary ?? "",
        entry.new_value_summary ?? "",
      ]
        .map((value) => csvEscape(String(value)))
        .join(","),
    );
    const csv = [header.join(","), ...lines].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `audit-log-${filters.endDate}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="min-h-screen bg-slate-950 px-6 py-8 text-slate-100 lg:px-10">
      <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.35em] text-sky-300">
            Audit Log
          </p>
          <h1 className="mt-4 text-4xl font-semibold tracking-tight text-white">
            Operational history and change review
          </h1>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-400">
            Filter the last 24 hours by tenant, action, and date range, then inspect summarized before and after values without leaving the console.
          </p>
        </div>
        <button
          type="button"
          onClick={handleExportCsv}
          className="inline-flex items-center gap-2 rounded-2xl border border-slate-800 bg-slate-900/80 px-4 py-3 text-sm text-slate-300 transition hover:bg-slate-800"
        >
          <Download className="size-4" />
          Export CSV
        </button>
      </div>

      <AuditFilters
        tenants={tenantsQuery.data?.tenants ?? []}
        value={filters}
        onChange={setFilters}
        onReset={() => setFilters(createDefaultFilters())}
      />

      <div className="my-6 rounded-3xl border border-slate-800 bg-slate-900/70 px-5 py-4 text-sm text-slate-300">
        Showing {totalCount} events from {filters.startDate} to {filters.endDate}
      </div>

      {auditQuery.error ? (
        <div className="mb-6 rounded-3xl border border-red-500/30 bg-red-500/10 px-5 py-4 text-sm text-red-200">
          Failed to load audit logs.
        </div>
      ) : null}

      {auditQuery.isLoading && rows.length === 0 ? (
        <div className="h-72 animate-pulse rounded-3xl border border-slate-800 bg-slate-900/70" />
      ) : (
        <AuditTable
          rows={rows}
          nextCursor={nextCursor}
          loadingMore={loadingMore}
          onLoadMore={handleLoadMore}
          onViewChanges={setSelectedEntry}
        />
      )}

      <AuditSlideover entry={selectedEntry} onClose={() => setSelectedEntry(null)} />
    </div>
  );
}
