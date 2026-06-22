"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, DatabaseZap, FlaskConical, Play } from "lucide-react";
import useSWR from "swr";

import { BackfillCard } from "@/components/backfill-card";
import { getBackfillStatus, runTenantProvenanceBackfill, runUniversalProvenanceBackfill } from "@/lib/admin-api";

const REFRESH_INTERVAL_MS = 15_000;

export default function BackfillPage() {
  const [nowTick, setNowTick] = useState(0);
  const [isStarting, setIsStarting] = useState<"passport-dry" | "passport-live" | "tenant-dry" | "tenant-live" | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionMessage, setActionMessage] = useState<string | null>(null);
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

  async function startBackfill(target: "passport" | "tenant", dryRun: boolean) {
    const label = target === "passport" ? "Passport" : "Tenant";
    if (!dryRun && !window.confirm("Run the live " + label + " provenance backfill? It adds missing claim history without changing memory content, vectors, or established winners. Legacy rows without reliable source evidence remain explicitly marked unknown.")) {
      return;
    }
    const action = (target + "-" + (dryRun ? "dry" : "live")) as "passport-dry" | "passport-live" | "tenant-dry" | "tenant-live";
    setIsStarting(action);
    setActionError(null);
    setActionMessage(null);
    try {
      if (target === "passport") {
        await runUniversalProvenanceBackfill(dryRun);
      } else {
        await runTenantProvenanceBackfill(dryRun);
      }
      setActionMessage(dryRun
        ? label + " dry run queued. It counts eligible legacy rows without writing data."
        : label + " provenance backfill queued.");
      await mutate();
    } catch (requestError) {
      setActionError(requestError instanceof Error ? requestError.message : "Could not queue the backfill.");
    } finally {
      setIsStarting(null);
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 px-6 py-8 text-slate-100 lg:px-10">
      <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.35em] text-sky-300">Backfill</p>
          <h1 className="mt-4 text-4xl font-semibold tracking-tight text-white">Migration and recovery jobs</h1>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-400">Track long-running schema and data repair work without leaving the operator console.</p>
        </div>
        <div className="rounded-2xl border border-slate-800 bg-slate-900/80 px-4 py-3 text-sm text-slate-300">
          <p>Refreshing in {secondsRemaining}s</p>
          <button type="button" onClick={() => mutate()} className="mt-2 text-xs text-sky-300 transition hover:text-sky-200">Refresh now</button>
        </div>
      </div>

      <section className="mb-8 border-y border-slate-800 py-6" aria-labelledby="passport-provenance-title">
        <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
          <div className="max-w-3xl">
            <div className="flex items-center gap-3">
              <DatabaseZap className="size-5 text-sky-300" />
              <h2 id="passport-provenance-title" className="text-xl font-semibold text-white">Legacy Passport provenance</h2>
            </div>
            <p className="mt-3 text-sm leading-6 text-slate-400">Adds missing source, grant, and claim-revision history to older Passport memories. It makes no LLM calls, creates no embeddings, and never changes memory content or a winner established by live traffic or user correction.</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <button type="button" disabled={isStarting !== null} onClick={() => startBackfill("passport", true)} className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-sky-400/40 px-4 py-2 text-sm font-medium text-sky-100 transition hover:bg-sky-500/10 disabled:cursor-not-allowed disabled:opacity-50">
              <FlaskConical className="size-4" />
              {isStarting === "passport-dry" ? "Queuing..." : "Run dry check"}
            </button>
            <button type="button" disabled={isStarting !== null} onClick={() => startBackfill("passport", false)} className="inline-flex min-h-11 items-center gap-2 rounded-lg bg-sky-400 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-sky-300 disabled:cursor-not-allowed disabled:opacity-50">
              <Play className="size-4" />
              {isStarting === "passport-live" ? "Queuing..." : "Start live backfill"}
            </button>
          </div>
        </div>
        {actionMessage ? <p className="mt-4 text-sm text-emerald-300">{actionMessage}</p> : null}
        {actionError ? <p className="mt-4 text-sm text-red-300">{actionError}</p> : null}
      </section>

      <section className="mb-8 border-y border-slate-800 py-6" aria-labelledby="tenant-provenance-title">
        <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
          <div className="max-w-3xl">
            <div className="flex items-center gap-3">
              <DatabaseZap className="size-5 text-amber-300" />
              <h2 id="tenant-provenance-title" className="text-xl font-semibold text-white">Legacy tenant provenance</h2>
            </div>
            <p className="mt-3 text-sm leading-6 text-slate-400">Builds claim history for older tenant memories. Exact source events and registered writers are recovered when evidence exists. Evidence-free rows are labelled legacy unknown; the job never invents a writer, timestamp, or authority.</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <button type="button" disabled={isStarting !== null} onClick={() => startBackfill("tenant", true)} className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-amber-400/40 px-4 py-2 text-sm font-medium text-amber-100 transition hover:bg-amber-500/10 disabled:cursor-not-allowed disabled:opacity-50">
              <FlaskConical className="size-4" />
              {isStarting === "tenant-dry" ? "Queuing..." : "Run dry check"}
            </button>
            <button type="button" disabled={isStarting !== null} onClick={() => startBackfill("tenant", false)} className="inline-flex min-h-11 items-center gap-2 rounded-lg bg-amber-300 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-amber-200 disabled:cursor-not-allowed disabled:opacity-50">
              <Play className="size-4" />
              {isStarting === "tenant-live" ? "Queuing..." : "Start live backfill"}
            </button>
          </div>
        </div>
      </section>
      {error ? <div className="mb-6 rounded-lg border border-red-500/30 bg-red-500/10 px-5 py-4 text-sm text-red-200">Failed to load backfill status.</div> : null}

      {isLoading && !data ? (
        <div className="space-y-4">{Array.from({ length: 2 }).map((_, index) => <div key={index} className="h-72 animate-pulse rounded-lg border border-slate-800 bg-slate-900/70" />)}</div>
      ) : data && data.length === 0 ? (
        <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-8">
          <div className="flex items-start gap-4">
            <div className="rounded-lg bg-emerald-500/15 p-3 text-emerald-100"><CheckCircle2 className="size-6" /></div>
            <div><h2 className="text-2xl font-semibold text-white">No migration history</h2><p className="mt-3 max-w-2xl text-sm leading-6 text-emerald-100/90">Run the dry check above before starting a live provenance backfill.</p></div>
          </div>
        </div>
      ) : (
        <div className="space-y-4">{(data ?? []).map((job) => <BackfillCard key={job.id} job={job} />)}</div>
      )}
    </div>
  );
}
