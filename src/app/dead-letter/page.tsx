"use client";

import { RefreshCcw, Trash2 } from "lucide-react";
import useSWR from "swr";

import { DeadLetterTable } from "@/components/dead-letter-table";
import { discardDeadLetterJob, getAllTenants, getDeadLetterJobs } from "@/lib/admin-api";

function olderThanSevenDays(value: string | null) {
  if (!value) {
    return false;
  }
  return Date.now() - new Date(value).getTime() > 7 * 24 * 60 * 60 * 1000;
}

export default function DeadLetterPage() {
  const deadLetterQuery = useSWR("dead-letter-jobs", getDeadLetterJobs, {
    refreshInterval: 60_000,
    revalidateOnFocus: false,
  });
  const tenantsQuery = useSWR("all-tenants-for-dead-letter", getAllTenants, {
    refreshInterval: 60_000,
    revalidateOnFocus: false,
  });

  const jobs = deadLetterQuery.data?.data ?? [];
  const tenantNames = Object.fromEntries(
    (tenantsQuery.data?.tenants ?? []).map((tenant) => [tenant.tenant_id, tenant.company_name]),
  );
  const tenantCount = new Set(jobs.map((job) => job.tenant_id)).size;
  const olderJobs = jobs.filter((job) => olderThanSevenDays(job.dead_lettered_at));

  async function handleDiscardOlder() {
    if (olderJobs.length === 0) {
      return;
    }

    const confirmed = window.confirm(
      `Discard ${olderJobs.length} dead-letter jobs older than 7 days? The memories will be permanently lost.`,
    );
    if (!confirmed) {
      return;
    }

    await Promise.allSettled(olderJobs.map((job) => discardDeadLetterJob(job.id)));
    await deadLetterQuery.mutate();
  }

  return (
    <div className="min-h-screen bg-slate-950 px-6 py-8 text-slate-100 lg:px-10">
      <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.35em] text-sky-300">
            Dead Letter
          </p>
          <h1 className="mt-4 text-4xl font-semibold tracking-tight text-white">
            Extraction jobs that need intervention
          </h1>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-400">
            Retry or discard failed extraction jobs grouped by tenant. Payload and per-attempt timestamps will appear here once the backend exposes them.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => deadLetterQuery.mutate()}
            className="inline-flex items-center gap-2 rounded-2xl border border-slate-800 bg-slate-900/80 px-4 py-3 text-sm text-slate-300 transition hover:bg-slate-800"
          >
            <RefreshCcw className="size-4" />
            Refresh
          </button>
          <button
            type="button"
            onClick={handleDiscardOlder}
            disabled={olderJobs.length === 0}
            className="inline-flex items-center gap-2 rounded-2xl bg-red-500 px-4 py-3 text-sm font-semibold text-white transition hover:bg-red-400 disabled:cursor-not-allowed disabled:bg-red-500/40"
          >
            <Trash2 className="size-4" />
            Discard All &gt; 7 days
          </button>
        </div>
      </div>

      <div className="mb-6 grid gap-4 md:grid-cols-3">
        <div className="rounded-3xl border border-red-500/20 bg-red-500/10 p-5">
          <p className="text-sm text-red-100">Jobs needing attention</p>
          <p className="mt-4 text-4xl font-semibold text-white">{jobs.length}</p>
        </div>
        <div className="rounded-3xl border border-slate-800 bg-slate-900/70 p-5">
          <p className="text-sm text-slate-400">Affected tenants</p>
          <p className="mt-4 text-4xl font-semibold text-white">{tenantCount}</p>
        </div>
        <div className="rounded-3xl border border-slate-800 bg-slate-900/70 p-5">
          <p className="text-sm text-slate-400">Older than 7 days</p>
          <p className="mt-4 text-4xl font-semibold text-white">{olderJobs.length}</p>
        </div>
      </div>

      <div className="mb-6 rounded-3xl border border-slate-800 bg-slate-900/70 px-5 py-4 text-sm text-slate-300">
        {jobs.length} jobs need attention across {tenantCount} tenant{tenantCount === 1 ? "" : "s"}.
      </div>

      {deadLetterQuery.error ? (
        <div className="mb-6 rounded-3xl border border-red-500/30 bg-red-500/10 px-5 py-4 text-sm text-red-200">
          Failed to load dead-letter jobs.
        </div>
      ) : null}

      {deadLetterQuery.isLoading && !deadLetterQuery.data ? (
        <div className="h-72 animate-pulse rounded-3xl border border-slate-800 bg-slate-900/70" />
      ) : jobs.length > 0 ? (
        <DeadLetterTable
          jobs={jobs}
          tenantNames={tenantNames}
          onRefresh={() => deadLetterQuery.mutate()}
        />
      ) : (
        <div className="rounded-3xl border border-slate-800 bg-slate-900/70 px-5 py-12 text-center text-sm text-slate-400">
          No dead-letter jobs right now.
        </div>
      )}
    </div>
  );
}
