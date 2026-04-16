"use client";

import { CheckCircle2, CircleDotDashed, PauseCircle, XCircle } from "lucide-react";

import { BackfillJobResponse } from "@/lib/admin-api";

function formatInteger(value: number) {
  return new Intl.NumberFormat("en-US").format(value);
}

function formatRelativeTime(value: string) {
  const diffMs = Date.now() - new Date(value).getTime();
  const minutes = Math.max(0, Math.floor(diffMs / 60_000));
  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes} minutes ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hour${hours === 1 ? "" : "s"} ago`;
  const days = Math.floor(hours / 24);
  return `${days} day${days === 1 ? "" : "s"} ago`;
}

function formatDuration(startedAt: string, completedAt?: string | null) {
  const start = new Date(startedAt).getTime();
  const end = completedAt ? new Date(completedAt).getTime() : Date.now();
  const seconds = Math.max(0, Math.floor((end - start) / 1000));
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}m` : `${hours}h`;
}

function formatEta(seconds: number | null, status: string, processedRows: number) {
  if (status === "complete") return "Done";
  if (status === "failed") return "—";
  if (status === "running" && processedRows === 0) return "Calculating...";
  if (status === "running" && seconds !== null) {
    if (seconds < 60) return `~${seconds}s remaining`;
    const minutes = Math.round(seconds / 60);
    return `~${minutes} minute${minutes === 1 ? "" : "s"} remaining`;
  }
  return "—";
}

function statusMeta(status: string) {
  switch (status) {
    case "running":
      return {
        badge: "border-sky-400/30 bg-sky-500/15 text-sky-100",
        icon: <CircleDotDashed className="size-4 animate-spin" />,
      };
    case "complete":
      return {
        badge: "border-emerald-400/30 bg-emerald-500/15 text-emerald-100",
        icon: <CheckCircle2 className="size-4" />,
      };
    case "paused":
      return {
        badge: "border-amber-400/30 bg-amber-500/15 text-amber-100",
        icon: <PauseCircle className="size-4" />,
      };
    default:
      return {
        badge: "border-red-400/30 bg-red-500/15 text-red-100",
        icon: <XCircle className="size-4" />,
      };
  }
}

type BackfillCardProps = {
  job: BackfillJobResponse;
};

export function BackfillCard({ job }: BackfillCardProps) {
  const meta = statusMeta(job.status);
  const progressValue = job.pct_complete === null ? 35 : Math.min(100, Math.max(0, job.pct_complete));

  return (
    <article className="rounded-3xl border border-slate-800 bg-slate-900/70 p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-white">{job.task_name}</h2>
          <p className="mt-2 text-xs text-slate-500">{job.id}</p>
        </div>
        <span className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-medium uppercase tracking-[0.25em] ${meta.badge}`}>
          {meta.icon}
          {job.status}
        </span>
      </div>

      <div className="mt-6">
        <div className="h-3 overflow-hidden rounded-full bg-slate-800">
          {job.total_rows === null ? (
            <div className="h-full w-1/2 animate-pulse rounded-full bg-[linear-gradient(90deg,rgba(14,165,233,0.2),rgba(14,165,233,0.8),rgba(14,165,233,0.2))]" />
          ) : (
            <div
              className="h-full rounded-full bg-sky-400 transition-[width]"
              style={{ width: `${progressValue}%` }}
            />
          )}
        </div>
        <p className="mt-3 text-sm text-slate-300">
          {job.total_rows === null
            ? `${formatInteger(job.processed_rows)} rows processed so far`
            : `${formatInteger(job.processed_rows)} of ${formatInteger(job.total_rows)} rows processed (${progressValue.toFixed(1)}%)`}
        </p>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-3">
        <div className="rounded-2xl border border-slate-800 bg-slate-950/40 p-4">
          <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Started</p>
          <p className="mt-3 text-sm text-slate-200">{formatRelativeTime(job.started_at)}</p>
        </div>
        <div className="rounded-2xl border border-slate-800 bg-slate-950/40 p-4">
          <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Duration</p>
          <p className="mt-3 text-sm text-slate-200">
            {formatDuration(job.started_at, job.completed_at)}
          </p>
        </div>
        <div className="rounded-2xl border border-slate-800 bg-slate-950/40 p-4">
          <p className="text-xs uppercase tracking-[0.3em] text-slate-500">ETA</p>
          <p className="mt-3 text-sm text-slate-200">
            {formatEta(job.eta_seconds, job.status, job.processed_rows)}
          </p>
        </div>
      </div>

      {job.error ? (
        <div className="mt-6 rounded-2xl border border-red-500/30 bg-red-500/10 p-4">
          <p className="text-xs uppercase tracking-[0.3em] text-red-200">Error</p>
          <pre className="mt-3 overflow-x-auto whitespace-pre-wrap break-words font-mono text-xs leading-6 text-red-100">
            {job.error}
          </pre>
        </div>
      ) : null}
    </article>
  );
}
