"use client";

import useSWR from "swr";
import { Archive, Flame, RefreshCcw, RotateCcw, TrendingDown } from "lucide-react";

import {
  LifecycleTable,
  type LifecycleReportRow,
} from "@/components/lifecycle-table";
import { adminFetch } from "@/lib/admin-api";

type LifecycleResponse =
  | LifecycleReportRow[]
  | {
      data?: LifecycleReportRow[];
      reports?: LifecycleReportRow[];
    };

function normalizeReports(payload: LifecycleResponse): LifecycleReportRow[] {
  if (Array.isArray(payload)) {
    return payload;
  }
  return payload.data ?? payload.reports ?? [];
}

function formatRelativeUntil(value: string | null | undefined) {
  if (!value) {
    return "unknown";
  }
  const target = new Date(value).getTime();
  if (Number.isNaN(target)) {
    return "unknown";
  }
  const diffMs = Math.max(0, target - Date.now());
  const totalHours = Math.floor(diffMs / (60 * 60 * 1000));
  const days = Math.floor(totalHours / 24);
  const hours = totalHours % 24;
  return `${days} days ${hours} hours`;
}

function SummaryBox({
  label,
  value,
  subtext,
  icon: Icon,
  tone,
}: {
  label: string;
  value: number;
  subtext: string;
  icon: typeof Archive;
  tone: string;
}) {
  return (
    <div className={`rounded-3xl border p-5 ${tone}`}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm text-slate-300">{label}</p>
          <p className="mt-4 text-4xl font-semibold text-white">
            {value.toLocaleString()}
          </p>
          <p className="mt-3 text-sm text-slate-400">{subtext}</p>
        </div>
        <div className="rounded-2xl bg-white/5 p-3 text-slate-100">
          <Icon className="size-5" />
        </div>
      </div>
    </div>
  );
}

export default function LifecyclePage() {
  const { data, error, isLoading, mutate } = useSWR(
    "lifecycle-report",
    async () => normalizeReports(await adminFetch<LifecycleResponse>("lifecycle-report")),
    {
      refreshInterval: 300_000,
      revalidateOnFocus: false,
    },
  );

  const rows = data ?? [];
  const mostRecentNextRun = rows
    .map((row) => row.next_run_at)
    .filter((value): value is string => Boolean(value))
    .sort((left, right) => new Date(left).getTime() - new Date(right).getTime())[0];

  const totals = rows.reduce(
    (acc, row) => ({
      decayed: acc.decayed + row.decayed_count,
      archived: acc.archived + row.archived_count,
      promoted: acc.promoted + row.promoted_to_hot,
      rescored: acc.rescored + row.rescored_count,
    }),
    { decayed: 0, archived: 0, promoted: 0, rescored: 0 },
  );

  return (
    <div className="min-h-screen bg-slate-950 px-6 py-8 text-slate-100 lg:px-10">
      <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.35em] text-sky-300">
            Memory Lifecycle
          </p>
          <h1 className="mt-4 text-4xl font-semibold tracking-tight text-white">
            Memory Lifecycle
          </h1>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-400">
            Weekly cleanup, decay, and hot tier promotion results. Runs every Sunday at 02:00 UTC.
          </p>
          <p className="mt-3 text-sm text-sky-200">
            Next run in: {formatRelativeUntil(mostRecentNextRun)}
          </p>
        </div>
        <button
          type="button"
          onClick={() => mutate()}
          className="inline-flex items-center gap-2 rounded-2xl border border-slate-800 bg-slate-900/80 px-4 py-3 text-sm text-slate-300 transition hover:bg-slate-800"
        >
          <RefreshCcw className="size-4" />
          Refresh
        </button>
      </div>

      {error ? (
        <div className="mb-6 rounded-3xl border border-red-500/30 bg-red-500/10 px-5 py-4 text-sm text-red-200">
          Failed to load lifecycle reports.
        </div>
      ) : null}

      {isLoading && !data ? (
        <div className="grid gap-4 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <div
              key={index}
              className="h-44 animate-pulse rounded-3xl border border-slate-800 bg-slate-900/70"
            />
          ))}
        </div>
      ) : rows.length === 0 ? (
        <div className="rounded-3xl border border-slate-800 bg-slate-900/70 px-5 py-14 text-center">
          <h2 className="text-xl font-semibold text-white">
            Lifecycle manager has not run yet.
          </h2>
          <p className="mt-3 text-sm text-slate-400">
            First run scheduled for Sunday at 02:00 UTC.
          </p>
        </div>
      ) : (
        <>
          <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <SummaryBox
              label="Total Decayed"
              value={totals.decayed}
              subtext="importance scores reduced"
              icon={TrendingDown}
              tone="border-amber-500/30 bg-amber-500/10"
            />
            <SummaryBox
              label="Total Archived"
              value={totals.archived}
              subtext="low-value memories removed from search"
              icon={Archive}
              tone="border-slate-800 bg-slate-900/70"
            />
            <SummaryBox
              label="Total Promoted"
              value={totals.promoted}
              subtext="moved to fast hot tier cache"
              icon={Flame}
              tone="border-orange-500/30 bg-orange-500/10"
            />
            <SummaryBox
              label="Total Rescored"
              value={totals.rescored}
              subtext="importance scores recalculated"
              icon={RotateCcw}
              tone="border-sky-500/30 bg-sky-500/10"
            />
          </section>

          <section className="mt-6">
            <LifecycleTable rows={rows} />
          </section>
        </>
      )}
    </div>
  );
}

