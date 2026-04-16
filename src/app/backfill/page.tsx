"use client";

import { useEffect, useState } from "react";
import { CheckCircle2 } from "lucide-react";
import useSWR from "swr";

import { BackfillCard } from "@/components/backfill-card";
import { getBackfillStatus } from "@/lib/admin-api";

const REFRESH_INTERVAL_MS = 15_000;

export default function BackfillPage() {
  const [nowTick, setNowTick] = useState(0);
  const { data, error, isLoading, mutate } = useSWR("backfill-status", getBackfillStatus, {
    refreshInterval: REFRESH_INTERVAL_MS,
    revalidateOnFocus: false,
  });

  useEffect(() => {
    const timer = window.setInterval(() => setNowTick(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  const latestStartedAt = data?.[0]?.started_at;
  const secondsRemaining = !latestStartedAt
    ? 15
    : Math.max(1, 15 - (Math.floor((nowTick - new Date(latestStartedAt).getTime()) / 1000) % 15));

  return (
    <div className="min-h-screen bg-slate-950 px-6 py-8 text-slate-100 lg:px-10">
      <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.35em] text-sky-300">
            Backfill
          </p>
          <h1 className="mt-4 text-4xl font-semibold tracking-tight text-white">
            Migration and recovery jobs
          </h1>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-400">
            Track long-running schema and data repair work without leaving the operator console.
          </p>
        </div>
        <div className="rounded-2xl border border-slate-800 bg-slate-900/80 px-4 py-3 text-sm text-slate-300">
          <p>Refreshing in {secondsRemaining}s</p>
          <button
            type="button"
            onClick={() => mutate()}
            className="mt-2 text-xs text-sky-300 transition hover:text-sky-200"
          >
            Refresh now
          </button>
        </div>
      </div>

      {error ? (
        <div className="mb-6 rounded-3xl border border-red-500/30 bg-red-500/10 px-5 py-4 text-sm text-red-200">
          Failed to load backfill status.
        </div>
      ) : null}

      {isLoading && !data ? (
        <div className="space-y-4">
          {Array.from({ length: 2 }).map((_, index) => (
            <div
              key={index}
              className="h-72 animate-pulse rounded-3xl border border-slate-800 bg-slate-900/70"
            />
          ))}
        </div>
      ) : data && data.length === 0 ? (
        <div className="rounded-3xl border border-emerald-500/30 bg-emerald-500/10 p-8">
          <div className="flex items-start gap-4">
            <div className="rounded-2xl bg-emerald-500/15 p-3 text-emerald-100">
              <CheckCircle2 className="size-6" />
            </div>
            <div>
              <h2 className="text-2xl font-semibold text-white">No Active Migrations</h2>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-emerald-100/90">
                All backfill jobs are complete. The system schema is up to date.
              </p>
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {(data ?? []).map((job) => (
            <BackfillCard key={job.id} job={job} />
          ))}
        </div>
      )}
    </div>
  );
}
