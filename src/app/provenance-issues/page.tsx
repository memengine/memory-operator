"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { AlertTriangle, ArrowLeft, ArrowRight, KeyRound, RefreshCcw, Search, ShieldCheck, Waypoints } from "lucide-react";
import { FormEvent, Suspense, useState } from "react";
import useSWR from "swr";

import { getProvenanceIssues, type ProvenanceIssueRecord } from "@/lib/admin-api";

type IssueType = "all" | "service_writer" | "legacy_event" | "passport_source";

const filters: Array<{ value: IssueType; label: string }> = [
  { value: "all", label: "All issues" },
  { value: "service_writer", label: "Missing writers" },
  { value: "legacy_event", label: "Legacy attribution" },
  { value: "passport_source", label: "Missing Passport sources" },
];

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-IN", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
}

function IssueCard({ issue }: { issue: ProvenanceIssueRecord }) {
  const writerIssue = issue.issue_type === "service_writer";
  const legacyIssue = issue.issue_type === "legacy_event";
  return (
    <article className="rounded-lg border border-slate-800 bg-slate-900/70 p-5">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1 rounded-full border border-amber-400/30 bg-amber-400/10 px-3 py-1 text-xs font-semibold text-amber-100">
              <AlertTriangle className="size-3.5" />
              {writerIssue ? "Writer not registered" : legacyIssue ? "Legacy source unattributed" : "Source identity missing"}
            </span>
            <span className="rounded-full border border-slate-700 px-3 py-1 text-xs text-slate-300">{issue.occurrences.toLocaleString()} affected revisions</span>
          </div>
          <h2 className="mt-4 text-xl font-semibold text-white">{issue.tenant_name}</h2>
          <p className="mt-1 font-mono text-sm text-sky-200">{issue.source_label}</p>
        </div>
        {issue.tenant_id ? (
          <Link href={`/tenants/${issue.tenant_id}`} className="inline-flex items-center gap-2 rounded-lg border border-slate-700 px-4 py-2 text-sm text-slate-200 transition hover:border-sky-400/60 hover:text-white">
            View tenant <ArrowRight className="size-4" />
          </Link>
        ) : null}
      </div>

      <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-lg border border-slate-800 bg-slate-950/50 p-4">
          <p className="text-xs uppercase tracking-[0.18em] text-slate-500">First observed</p>
          <p className="mt-2 text-sm text-slate-200">{formatDate(issue.first_seen)}</p>
        </div>
        <div className="rounded-lg border border-slate-800 bg-slate-950/50 p-4">
          <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Last observed</p>
          <p className="mt-2 text-sm text-slate-200">{formatDate(issue.last_seen)}</p>
        </div>
        <div className="rounded-lg border border-slate-800 bg-slate-950/50 p-4">
          <p className="text-xs uppercase tracking-[0.18em] text-slate-500">API key identity</p>
          <p className="mt-2 flex items-center gap-2 text-sm text-slate-200">
            <KeyRound className="size-4 text-slate-500" />
            {issue.api_key_name ?? "Not available"}
          </p>
          {issue.api_key_prefix ? <p className="mt-1 font-mono text-xs text-slate-500">{issue.api_key_prefix}...</p> : null}
        </div>
        <div className="rounded-lg border border-slate-800 bg-slate-950/50 p-4">
          <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Safe reference</p>
          <p className="mt-2 font-mono text-sm text-slate-300">{issue.sample_reference ?? "Unavailable"}</p>
        </div>
      </div>

      <div className="mt-4 rounded-lg border border-sky-400/20 bg-sky-400/5 px-4 py-3">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-sky-300">Recommended action</p>
        <p className="mt-2 text-sm leading-6 text-slate-300">{issue.recommended_action}</p>
      </div>
    </article>
  );
}

function ProvenanceIssuesContent() {
  const searchParams = useSearchParams();
  const requestedType = searchParams.get("type");
  const initialType: IssueType = requestedType === "service_writer" || requestedType === "legacy_event" || requestedType === "passport_source" ? requestedType : "all";
  const [issueType, setIssueType] = useState<IssueType>(initialType);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [cursor, setCursor] = useState<string | null>(null);
  const [cursorHistory, setCursorHistory] = useState<Array<string | null>>([]);
  const { data, error, isLoading, mutate } = useSWR(
    ["provenance-issues", issueType, search, cursor],
    () => getProvenanceIssues({ issue_type: issueType, search, cursor: cursor ?? undefined, limit: 25 }),
    { refreshInterval: 60_000, revalidateOnFocus: false },
  );

  function changeType(nextType: IssueType) {
    setIssueType(nextType);
    setCursor(null);
    setCursorHistory([]);
  }

  function submitSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSearch(searchInput.trim());
    setCursor(null);
    setCursorHistory([]);
  }

  function nextPage() {
    if (!data?.next_cursor) return;
    setCursorHistory((current) => [...current, cursor]);
    setCursor(data.next_cursor);
  }

  function previousPage() {
    setCursorHistory((current) => {
      const previous = current[current.length - 1] ?? null;
      setCursor(previous);
      return current.slice(0, -1);
    });
  }

  return (
    <div className="min-h-screen bg-slate-950 px-6 py-8 text-slate-100 lg:px-10">
      <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.35em] text-sky-300">Memory governance</p>
          <h1 className="mt-4 text-4xl font-semibold tracking-tight text-white">Provenance issues</h1>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-400">Identify the tenant and source behind missing lineage without opening tenant accounts or exposing customer memory.</p>
        </div>
        <button type="button" onClick={() => mutate()} className="inline-flex items-center gap-2 rounded-lg border border-slate-800 bg-slate-900/80 px-4 py-3 text-sm text-slate-300 transition hover:bg-slate-800">
          <RefreshCcw className="size-4" /> Refresh
        </button>
      </div>

      <div className="mb-6 flex items-start gap-3 rounded-lg border border-emerald-400/20 bg-emerald-400/5 px-4 py-4 text-sm text-emerald-100">
        <ShieldCheck className="mt-0.5 size-5 shrink-0" />
        <p>This view contains operational metadata only. It never returns memory text, user identifiers, evidence, payload hashes, API-key secrets, or Passport tokens.</p>
      </div>

      <div className="mb-6 space-y-4 rounded-lg border border-slate-800 bg-slate-900/70 p-4">
        <div className="flex flex-wrap gap-2">
          {filters.map((filter) => (
            <button key={filter.value} type="button" onClick={() => changeType(filter.value)} className={`rounded-lg px-4 py-2 text-sm font-medium transition ${issueType === filter.value ? "bg-sky-500/20 text-sky-100 ring-1 ring-sky-400/40" : "text-slate-400 hover:bg-slate-800 hover:text-white"}`}>
              {filter.label}
            </button>
          ))}
        </div>
        <form onSubmit={submitSearch} className="flex flex-col gap-2 sm:flex-row">
          <label className="relative flex-1">
            <span className="sr-only">Search tenant, service, or API key name</span>
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-500" />
            <input value={searchInput} onChange={(event) => setSearchInput(event.target.value)} maxLength={100} placeholder="Search tenant, service, or API key name" className="h-11 w-full rounded-lg border border-slate-700 bg-slate-950 pl-10 pr-3 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-sky-400" />
          </label>
          <button type="submit" className="h-11 rounded-lg bg-sky-500 px-5 text-sm font-semibold text-slate-950 transition hover:bg-sky-400">Search</button>
        </form>
      </div>

      <div className="mb-4 flex items-center justify-between text-sm text-slate-400">
        <p>{data ? `${data.total_count.toLocaleString()} issue groups` : "Loading issue groups"}</p>
        <div className="flex items-center gap-2"><Waypoints className="size-4" /> Grouped by tenant, source, and API-key identity</div>
      </div>

      {error ? (
        <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-5 py-4 text-sm text-red-200">Could not load provenance issues. Check the internal API and PostgreSQL circuit.</div>
      ) : isLoading && !data ? (
        <div className="h-64 animate-pulse rounded-lg border border-slate-800 bg-slate-900/70" />
      ) : data?.data.length ? (
        <div className="grid gap-4">{data.data.map((issue) => <IssueCard key={issue.issue_key} issue={issue} />)}</div>
      ) : (
        <div className="rounded-lg border border-emerald-400/20 bg-emerald-400/5 px-5 py-12 text-center text-sm text-emerald-100">No unresolved provenance issues match this filter.</div>
      )}

      {data && (cursorHistory.length > 0 || data.next_cursor) ? (
        <div className="mt-6 flex items-center justify-between">
          <button type="button" disabled={cursorHistory.length === 0} onClick={previousPage} className="inline-flex items-center gap-2 rounded-lg border border-slate-700 px-4 py-2 text-sm disabled:opacity-40"><ArrowLeft className="size-4" /> Previous</button>
          <button type="button" disabled={!data.next_cursor} onClick={nextPage} className="inline-flex items-center gap-2 rounded-lg border border-slate-700 px-4 py-2 text-sm disabled:opacity-40">Next <ArrowRight className="size-4" /></button>
        </div>
      ) : null}
    </div>
  );
}

export default function ProvenanceIssuesPage() {
  return <Suspense fallback={<div className="min-h-screen bg-slate-950" />}><ProvenanceIssuesContent /></Suspense>;
}