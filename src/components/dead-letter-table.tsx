"use client";

import { useMemo, useState } from "react";
import { ChevronDown, ChevronRight, Copy, RefreshCcw, Trash2 } from "lucide-react";
import { Fragment } from "react";

import {
  DeadLetterJob,
  discardDeadLetterJob,
  retryDeadLetterJob,
} from "@/lib/admin-api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

function truncate(value: string, length = 24) {
  return value.length <= length ? value : `${value.slice(0, length)}...`;
}

function formatTimestamp(value: string | null) {
  if (!value) {
    return "Unavailable";
  }
  return new Date(value).toLocaleString();
}

function legacyErrorMessage(error: string | null | undefined) {
  return !error || error.trim().toLowerCase() === "error";
}

function errorTypeBadge(errorType: string | null | undefined) {
  switch (errorType) {
    case "llm_provider_unavailable_503":
      return { label: "LLM 503", className: "border-red-500/40 bg-red-500/15 text-red-100" };
    case "llm_rate_limited_429":
      return { label: "Rate Limited", className: "border-amber-500/40 bg-amber-500/15 text-amber-100" };
    case "llm_auth_failed":
      return { label: "Auth Failed", className: "border-red-500/40 bg-red-500/15 text-red-100" };
    case "timeout":
      return { label: "Timeout", className: "border-amber-500/40 bg-amber-500/15 text-amber-100" };
    case "connection_error":
      return { label: "Connection", className: "border-amber-500/40 bg-amber-500/15 text-amber-100" };
    case "llm_invalid_response":
      return { label: "Bad Response", className: "border-purple-500/40 bg-purple-500/15 text-purple-100" };
    case "missing_extraction_spec":
      return { label: "Config Error", className: "border-red-500/40 bg-red-500/15 text-red-100" };
    case "unknown_error":
      return { label: "Unknown", className: "border-slate-600 bg-slate-800/70 text-slate-200" };
    default:
      return { label: "Legacy", className: "border-slate-600 bg-slate-800/70 text-slate-200" };
  }
}

function formatPayloadMessages(payload: Record<string, unknown> | null | undefined) {
  const messages = Array.isArray(payload?.messages) ? payload.messages : [];
  const formatted = messages
    .map((message) => {
      if (!message || typeof message !== "object") {
        return null;
      }
      const record = message as Record<string, unknown>;
      const role = typeof record.role === "string" ? record.role : "unknown";
      const content = typeof record.content === "string" ? record.content : JSON.stringify(record.content ?? "");
      return `[${role}]: ${content}`;
    })
    .filter((line): line is string => Boolean(line));

  return {
    count: formatted.length,
    text: formatted.join("\n"),
  };
}

type DeadLetterTableProps = {
  jobs: DeadLetterJob[];
  tenantNames: Record<string, string>;
  onRefresh: () => Promise<unknown>;
};

export function DeadLetterTable({
  jobs,
  tenantNames,
  onRefresh,
}: DeadLetterTableProps) {
  const groupedJobs = useMemo(() => {
    const next = new Map<string, DeadLetterJob[]>();
    jobs.forEach((job) => {
      const current = next.get(job.tenant_id) ?? [];
      current.push(job);
      next.set(job.tenant_id, current);
    });
    return Array.from(next.entries());
  }, [jobs]);

  const [expandedTenants, setExpandedTenants] = useState<Record<string, boolean>>({});
  const [expandedJobs, setExpandedJobs] = useState<Record<string, boolean>>({});
  const [pendingJobId, setPendingJobId] = useState<string | null>(null);
  const [pendingTenantId, setPendingTenantId] = useState<string | null>(null);

  async function handleRetry(jobId: string) {
    setPendingJobId(jobId);
    try {
      await retryDeadLetterJob(jobId);
      await onRefresh();
    } finally {
      setPendingJobId(null);
    }
  }

  async function handleDiscard(job: DeadLetterJob) {
    const tenantName = tenantNames[job.tenant_id] ?? truncate(job.tenant_id, 12);
    const confirmed = window.confirm(
      `Discard 1 job for ${tenantName}? The memory will be permanently lost.`,
    );
    if (!confirmed) {
      return;
    }

    setPendingJobId(job.id);
    try {
      await discardDeadLetterJob(job.id);
      await onRefresh();
    } finally {
      setPendingJobId(null);
    }
  }

  async function handleRetryAll(tenantId: string, tenantJobs: DeadLetterJob[]) {
    const tenantName = tenantNames[tenantId] ?? truncate(tenantId, 12);
    const confirmed = window.confirm(
      `Retry all ${tenantJobs.length} dead-letter jobs for ${tenantName}?`,
    );
    if (!confirmed) {
      return;
    }

    setPendingTenantId(tenantId);
    try {
      await Promise.allSettled(tenantJobs.map((job) => retryDeadLetterJob(job.id)));
      await onRefresh();
    } finally {
      setPendingTenantId(null);
    }
  }

  async function copyText(value: string) {
    await navigator.clipboard.writeText(value);
  }

  return (
    <div className="space-y-4">
      {groupedJobs.map(([tenantId, tenantJobs]) => {
        const tenantName = tenantNames[tenantId] ?? truncate(tenantId, 12);
        const expanded = expandedTenants[tenantId] ?? true;

        return (
          <section
            key={tenantId}
            className="overflow-hidden rounded-3xl border border-slate-800 bg-slate-900/70"
          >
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 px-5 py-4">
              <button
                type="button"
                className="flex items-center gap-3 text-left"
                onClick={() =>
                  setExpandedTenants((current) => ({
                    ...current,
                    [tenantId]: !expanded,
                  }))
                }
              >
                {expanded ? (
                  <ChevronDown className="size-4 text-slate-400" />
                ) : (
                  <ChevronRight className="size-4 text-slate-400" />
                )}
                <div>
                  <p className="font-semibold text-white">{tenantName}</p>
                  <p className="text-sm text-slate-500">
                    {tenantJobs.length} job{tenantJobs.length === 1 ? "" : "s"} waiting
                  </p>
                </div>
              </button>

              <Button
                variant="outline"
                className="border-slate-700 bg-slate-950/50 text-slate-100 hover:bg-slate-800"
                onClick={() => handleRetryAll(tenantId, tenantJobs)}
                disabled={pendingTenantId === tenantId}
              >
                <RefreshCcw className="size-4" />
                {pendingTenantId === tenantId
                  ? "Retrying..."
                  : `Retry All for ${tenantName} (${tenantJobs.length})`}
              </Button>
            </div>

            {expanded ? (
              <Table>
                <TableHeader className="bg-slate-950/30">
                  <TableRow className="border-slate-800 hover:bg-transparent">
                    <TableHead className="px-4 text-slate-400">Job</TableHead>
                    <TableHead className="text-slate-400">User</TableHead>
                    <TableHead className="text-slate-400">Failed At</TableHead>
                    <TableHead className="text-slate-400">Error</TableHead>
                    <TableHead className="text-right text-slate-400">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {tenantJobs.map((job) => {
                    const expandedJob = expandedJobs[job.id] ?? false;
                    return (
                      <Fragment key={job.id}>
                        <TableRow
                          className="border-slate-800 text-slate-100 hover:bg-slate-800/40"
                        >
                          <TableCell className="px-4 py-4">
                            <button
                              type="button"
                              className="flex items-center gap-2 font-medium text-white"
                              onClick={() =>
                                setExpandedJobs((current) => ({
                                  ...current,
                                  [job.id]: !expandedJob,
                                }))
                              }
                            >
                              {expandedJob ? (
                                <ChevronDown className="size-4 text-slate-400" />
                              ) : (
                                <ChevronRight className="size-4 text-slate-400" />
                              )}
                              {job.id.slice(0, 8)}
                            </button>
                          </TableCell>
                          <TableCell>{truncate(job.external_user_id, 20)}</TableCell>
                          <TableCell>{formatTimestamp(job.dead_lettered_at)}</TableCell>
                          <TableCell className="max-w-xs whitespace-normal text-slate-300">
                            <div className="flex flex-wrap items-center gap-2">
                              <span>{truncate(job.error ?? "Unknown failure", 70)}</span>
                              <Badge
                                variant="outline"
                                className={errorTypeBadge(job.error_type).className}
                              >
                                {errorTypeBadge(job.error_type).label}
                              </Badge>
                            </div>
                          </TableCell>
                          <TableCell className="py-4 text-right">
                            <div className="flex justify-end gap-2">
                              <Button
                                variant="outline"
                                className="border-slate-700 bg-slate-950/40 text-slate-100 hover:bg-slate-800"
                                onClick={() => handleRetry(job.id)}
                                disabled={pendingJobId === job.id}
                              >
                                <RefreshCcw className="size-4" />
                                {pendingJobId === job.id ? "Retrying..." : "Retry"}
                              </Button>
                              <Button
                                variant="destructive"
                                onClick={() => handleDiscard(job)}
                                disabled={pendingJobId === job.id}
                              >
                                <Trash2 className="size-4" />
                                Discard
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                        {expandedJob ? (
                          <TableRow className="border-slate-800 bg-slate-950/40 hover:bg-slate-950/40">
                            <TableCell colSpan={5} className="px-4 py-4 whitespace-normal">
                              <div className="grid gap-4 lg:grid-cols-2">
                                <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4">
                                  <div className="flex items-center justify-between gap-3">
                                    <p className="text-xs font-semibold uppercase tracking-[0.3em] text-sky-300">
                                      Full error
                                    </p>
                                    {!legacyErrorMessage(job.error) ? (
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        className="border-slate-700 bg-slate-950/40 text-slate-100 hover:bg-slate-800"
                                        onClick={() => copyText(job.error ?? "")}
                                      >
                                        <Copy className="size-3.5" />
                                        Copy error
                                      </Button>
                                    ) : null}
                                  </div>
                                  {legacyErrorMessage(job.error) ? (
                                    <p className="mt-3 text-sm leading-6 text-slate-400">
                                      Error details not available. This job was created before full error capture was enabled.
                                    </p>
                                  ) : (
                                    <pre className="mt-3 max-h-52 overflow-y-auto whitespace-pre-wrap rounded-xl border border-slate-800 bg-slate-950 p-3 font-mono text-xs leading-5 text-slate-200">
                                      {job.error}
                                    </pre>
                                  )}
                                </div>
                                <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4">
                                  <p className="text-xs font-semibold uppercase tracking-[0.3em] text-sky-300">
                                    Conversation payload
                                  </p>
                                  {formatPayloadMessages(job.payload).count === 0 ? (
                                    <p className="mt-3 text-sm leading-6 text-slate-400">
                                      Conversation not recorded. This job was created before payload capture was enabled. Future jobs will show the conversation.
                                    </p>
                                  ) : (
                                    <>
                                      <p className="mt-3 text-sm text-slate-400">
                                        {formatPayloadMessages(job.payload).count} messages in conversation
                                      </p>
                                      <pre className="mt-3 max-h-52 overflow-y-auto whitespace-pre-wrap rounded-xl border border-slate-800 bg-slate-950 p-3 font-mono text-xs leading-5 text-slate-200">
                                        {formatPayloadMessages(job.payload).text}
                                      </pre>
                                    </>
                                  )}
                                </div>
                                <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4 lg:col-span-2">
                                  <p className="text-xs font-semibold uppercase tracking-[0.3em] text-sky-300">
                                    Available timeline
                                  </p>
                                  <div className="mt-3 grid gap-3 text-sm text-slate-300 md:grid-cols-3">
                                    <div>
                                      <p className="text-slate-500">Queued</p>
                                      <p className="mt-1">{formatTimestamp(job.queued_at)}</p>
                                    </div>
                                    <div>
                                      <p className="text-slate-500">Started</p>
                                      <p className="mt-1">{formatTimestamp(job.started_at)}</p>
                                    </div>
                                    <div>
                                      <p className="text-slate-500">Dead lettered</p>
                                      <p className="mt-1">{formatTimestamp(job.dead_lettered_at)}</p>
                                    </div>
                                  </div>
                                  <p className="mt-4 text-xs text-slate-500">
                                    Per-attempt timestamps are not exposed by the current backend endpoint.
                                  </p>
                                </div>
                              </div>
                            </TableCell>
                          </TableRow>
                        ) : null}
                      </Fragment>
                    );
                  })}
                </TableBody>
              </Table>
            ) : null}
          </section>
        );
      })}
    </div>
  );
}
