"use client";

import { ExternalLink, RefreshCcw, ShieldAlert, ShieldCheck, ShieldX } from "lucide-react";
import useSWR from "swr";
import { useState } from "react";

import {
  getGlobalAgentsForVerification,
  updateGlobalAgentVerification,
  type GlobalAgentVerificationRecord,
} from "@/lib/admin-api";

type StatusFilter = "pending" | "verified" | "all";

const statusTabs: Array<{ value: StatusFilter; label: string }> = [
  { value: "pending", label: "Needs Review" },
  { value: "verified", label: "Verified" },
  { value: "all", label: "All Agents" },
];

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function AgentCard({
  agent,
  onUpdate,
  busy,
}: {
  agent: GlobalAgentVerificationRecord;
  onUpdate: (agentId: string, isVerified: boolean) => void;
  busy: boolean;
}) {
  return (
    <article className="rounded-3xl border border-slate-800 bg-slate-900/70 p-5 shadow-2xl shadow-slate-950/20">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-3">
            <h2 className="text-xl font-semibold text-white">{agent.name}</h2>
            {agent.is_verified ? (
              <span className="inline-flex items-center gap-1 rounded-full border border-emerald-400/30 bg-emerald-400/10 px-3 py-1 text-xs font-semibold text-emerald-200">
                <ShieldCheck className="size-3.5" />
                Verified
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 rounded-full border border-amber-400/30 bg-amber-400/10 px-3 py-1 text-xs font-semibold text-amber-100">
                <ShieldAlert className="size-3.5" />
                Needs review
              </span>
            )}
          </div>
          <p className="mt-2 text-sm text-slate-400">
            {agent.owner_tenant_name} · {agent.owner_tenant_id}
          </p>
          {agent.description ? (
            <p className="mt-4 max-w-3xl text-sm leading-6 text-slate-300">{agent.description}</p>
          ) : (
            <p className="mt-4 text-sm text-slate-500">No public description provided.</p>
          )}
        </div>

        <div className="flex flex-wrap gap-2">
          {agent.website_url ? (
            <a
              href={agent.website_url}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 rounded-2xl border border-slate-700 px-4 py-2 text-sm text-slate-200 transition hover:border-sky-400/60 hover:text-white"
            >
              Review site
              <ExternalLink className="size-4" />
            </a>
          ) : null}
          {agent.is_verified ? (
            <button
              type="button"
              disabled={busy}
              onClick={() => onUpdate(agent.id, false)}
              className="inline-flex items-center gap-2 rounded-2xl border border-red-400/30 bg-red-400/10 px-4 py-2 text-sm font-medium text-red-100 transition hover:bg-red-400/20 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <ShieldX className="size-4" />
              Revoke verified
            </button>
          ) : (
            <button
              type="button"
              disabled={busy}
              onClick={() => onUpdate(agent.id, true)}
              className="inline-flex items-center gap-2 rounded-2xl border border-emerald-400/30 bg-emerald-400/10 px-4 py-2 text-sm font-medium text-emerald-100 transition hover:bg-emerald-400/20 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <ShieldCheck className="size-4" />
              Mark verified
            </button>
          )}
        </div>
      </div>

      <div className="mt-5 grid gap-3 md:grid-cols-4">
        <div className="rounded-2xl border border-slate-800 bg-slate-950/50 p-4">
          <p className="text-xs uppercase tracking-[0.22em] text-slate-500">Agent ID</p>
          <p className="mt-2 truncate font-mono text-sm text-slate-200">{agent.id}</p>
        </div>
        <div className="rounded-2xl border border-slate-800 bg-slate-950/50 p-4">
          <p className="text-xs uppercase tracking-[0.22em] text-slate-500">Grants</p>
          <p className="mt-2 text-2xl font-semibold text-white">{agent.grants_count}</p>
        </div>
        <div className="rounded-2xl border border-slate-800 bg-slate-950/50 p-4">
          <p className="text-xs uppercase tracking-[0.22em] text-slate-500">Created</p>
          <p className="mt-2 text-sm text-slate-200">{formatDate(agent.created_at)}</p>
        </div>
        <div className="rounded-2xl border border-slate-800 bg-slate-950/50 p-4">
          <p className="text-xs uppercase tracking-[0.22em] text-slate-500">Default categories</p>
          <p className="mt-2 text-sm text-slate-200">
            {agent.default_categories_requested.length > 0
              ? agent.default_categories_requested.join(", ")
              : "All categories"}
          </p>
        </div>
      </div>
    </article>
  );
}

export default function GlobalAgentsPage() {
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("pending");
  const [busyAgentId, setBusyAgentId] = useState<string | null>(null);
  const { data, error, isLoading, mutate } = useSWR(
    ["global-agents", statusFilter],
    () => getGlobalAgentsForVerification(statusFilter),
    {
      refreshInterval: 60_000,
      revalidateOnFocus: false,
    },
  );

  const agents = data?.data ?? [];
  const pendingCount = agents.filter((agent) => !agent.is_verified).length;

  async function handleUpdate(agentId: string, isVerified: boolean) {
    setBusyAgentId(agentId);
    try {
      await updateGlobalAgentVerification(agentId, isVerified);
      await mutate();
    } finally {
      setBusyAgentId(null);
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 px-6 py-8 text-slate-100 lg:px-10">
      <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.35em] text-sky-300">
            Cross-agent trust
          </p>
          <h1 className="mt-4 text-4xl font-semibold tracking-tight text-white">
            Global agent verification
          </h1>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-400">
            Review public agent profiles before the consent page shows "Verified by MemoryOS".
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

      <div className="mb-6 grid gap-4 md:grid-cols-3">
        <div className="rounded-3xl border border-amber-500/20 bg-amber-500/10 p-5">
          <p className="text-sm text-amber-100">Needs review in current view</p>
          <p className="mt-4 text-4xl font-semibold text-white">{pendingCount}</p>
        </div>
        <div className="rounded-3xl border border-slate-800 bg-slate-900/70 p-5">
          <p className="text-sm text-slate-400">Agents loaded</p>
          <p className="mt-4 text-4xl font-semibold text-white">{agents.length}</p>
        </div>
        <div className="rounded-3xl border border-slate-800 bg-slate-900/70 p-5">
          <p className="text-sm text-slate-400">Verified in current view</p>
          <p className="mt-4 text-4xl font-semibold text-white">
            {agents.filter((agent) => agent.is_verified).length}
          </p>
        </div>
      </div>

      <div className="mb-6 flex flex-wrap gap-2 rounded-3xl border border-slate-800 bg-slate-900/70 p-2">
        {statusTabs.map((tab) => (
          <button
            key={tab.value}
            type="button"
            onClick={() => setStatusFilter(tab.value)}
            className={[
              "rounded-2xl px-4 py-2 text-sm font-medium transition",
              statusFilter === tab.value
                ? "bg-sky-500/20 text-sky-100 ring-1 ring-sky-400/40"
                : "text-slate-400 hover:bg-slate-800 hover:text-white",
            ].join(" ")}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {error ? (
        <div className="rounded-3xl border border-red-500/30 bg-red-500/10 px-5 py-4 text-sm text-red-200">
          Failed to load global agents. Try again after the internal API is reachable.
        </div>
      ) : null}

      {isLoading && !data ? (
        <div className="h-64 animate-pulse rounded-3xl border border-slate-800 bg-slate-900/70" />
      ) : agents.length > 0 ? (
        <div className="grid gap-4">
          {agents.map((agent) => (
            <AgentCard
              key={agent.id}
              agent={agent}
              busy={busyAgentId === agent.id}
              onUpdate={handleUpdate}
            />
          ))}
        </div>
      ) : (
        <div className="rounded-3xl border border-slate-800 bg-slate-900/70 px-5 py-12 text-center text-sm text-slate-400">
          No global agents match this filter.
        </div>
      )}
    </div>
  );
}
