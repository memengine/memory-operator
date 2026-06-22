"use client";

import { Building2, ExternalLink, RefreshCcw, ShieldAlert, ShieldCheck, ShieldX } from "lucide-react";
import { useState } from "react";
import useSWR from "swr";

import {
  getOrganisationsForVerification,
  updateOrganisationVerification,
  type OrganisationVerificationRecord,
} from "@/lib/admin-api";

type StatusFilter = "pending" | "verified" | "all";

const statusTabs: Array<{ value: StatusFilter; label: string }> = [
  { value: "pending", label: "Needs Review" },
  { value: "verified", label: "Verified" },
  { value: "all", label: "All Organisations" },
];

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function OrganisationCard({
  organisation,
  busy,
  onUpdate,
}: {
  organisation: OrganisationVerificationRecord;
  busy: boolean;
  onUpdate: (organisationId: string, isVerified: boolean) => void;
}) {
  return (
    <article className="rounded-3xl border border-slate-800 bg-slate-900/70 p-5 shadow-2xl shadow-slate-950/20">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
        <div className="flex min-w-0 gap-4">
          <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl border border-slate-700 bg-slate-950 text-sm font-semibold text-sky-200">
            {organisation.logo_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={organisation.logo_url} alt="" className="size-full rounded-2xl object-cover" />
            ) : (
              <Building2 className="size-5" />
            )}
          </div>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-3">
              <h2 className="text-xl font-semibold text-white">{organisation.display_name}</h2>
              {organisation.is_verified ? (
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
              {organisation.tenant_name} · {organisation.tenant_id}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          {organisation.website_url ? (
            <a
              href={organisation.website_url}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 rounded-2xl border border-slate-700 px-4 py-2 text-sm text-slate-200 transition hover:border-sky-400/60 hover:text-white"
            >
              Review site
              <ExternalLink className="size-4" />
            </a>
          ) : null}
          <button
            type="button"
            disabled={busy}
            onClick={() => onUpdate(organisation.id, !organisation.is_verified)}
            className={[
              "inline-flex items-center gap-2 rounded-2xl border px-4 py-2 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-50",
              organisation.is_verified
                ? "border-red-400/30 bg-red-400/10 text-red-100 hover:bg-red-400/20"
                : "border-emerald-400/30 bg-emerald-400/10 text-emerald-100 hover:bg-emerald-400/20",
            ].join(" ")}
          >
            {organisation.is_verified ? <ShieldX className="size-4" /> : <ShieldCheck className="size-4" />}
            {organisation.is_verified ? "Revoke verified" : "Mark verified"}
          </button>
        </div>
      </div>

      <div className="mt-5 grid gap-3 md:grid-cols-4">
        <div className="rounded-2xl border border-slate-800 bg-slate-950/50 p-4">
          <p className="text-xs uppercase tracking-[0.22em] text-slate-500">Category</p>
          <p className="mt-2 capitalize text-slate-200">{organisation.category}</p>
        </div>
        <div className="rounded-2xl border border-slate-800 bg-slate-950/50 p-4">
          <p className="text-xs uppercase tracking-[0.22em] text-slate-500">Connection methods</p>
          <p className="mt-2 text-sm text-slate-200">
            {[organisation.oauth_enabled ? "OAuth" : null, organisation.link_token_enabled ? "Secure link" : null]
              .filter(Boolean)
              .join(", ") || "None"}
          </p>
        </div>
        <div className="rounded-2xl border border-slate-800 bg-slate-950/50 p-4">
          <p className="text-xs uppercase tracking-[0.22em] text-slate-500">Connections</p>
          <p className="mt-2 text-2xl font-semibold text-white">{organisation.connections_count}</p>
        </div>
        <div className="rounded-2xl border border-slate-800 bg-slate-950/50 p-4">
          <p className="text-xs uppercase tracking-[0.22em] text-slate-500">Registered</p>
          <p className="mt-2 text-sm text-slate-200">{formatDate(organisation.created_at)}</p>
        </div>
      </div>
    </article>
  );
}

export default function OrganisationsPage() {
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("pending");
  const [busyId, setBusyId] = useState<string | null>(null);
  const { data, error, isLoading, mutate } = useSWR(
    ["organisation-reviews", statusFilter],
    () => getOrganisationsForVerification(statusFilter),
    { refreshInterval: 60_000, revalidateOnFocus: false },
  );
  const organisations = data?.data ?? [];

  async function handleUpdate(organisationId: string, isVerified: boolean) {
    setBusyId(organisationId);
    try {
      await updateOrganisationVerification(organisationId, isVerified);
      await mutate();
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 px-6 py-8 text-slate-100 lg:px-10">
      <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.35em] text-sky-300">Passport trust</p>
          <h1 className="mt-4 text-4xl font-semibold tracking-tight text-white">Organisation reviews</h1>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-400">
            Review directory registrations before Consent shows “Verified by MemoryOS”.
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
          Failed to load organisation reviews.
        </div>
      ) : null}
      {isLoading && !data ? (
        <div className="h-64 animate-pulse rounded-3xl border border-slate-800 bg-slate-900/70" />
      ) : organisations.length ? (
        <div className="grid gap-4">
          {organisations.map((organisation) => (
            <OrganisationCard
              key={organisation.id}
              organisation={organisation}
              busy={busyId === organisation.id}
              onUpdate={handleUpdate}
            />
          ))}
        </div>
      ) : (
        <div className="rounded-3xl border border-slate-800 bg-slate-900/70 px-5 py-12 text-center text-sm text-slate-400">
          No organisations match this filter.
        </div>
      )}
    </div>
  );
}
