import Link from "next/link";
import { AlertTriangle, ArrowRight, CheckCircle2, Database, ShieldAlert } from "lucide-react";

import type { ProvenanceHealthResponse } from "@/lib/admin-api";

type Props = {
  data?: ProvenanceHealthResponse;
  error?: unknown;
};

const metricDefinitions = [
  { key: "tenant_claims_disputed", label: "Tenant disputes", description: "Claims waiting for tenant review" },
  { key: "passport_claims_disputed", label: "Passport disputes", description: "User-facing claims awaiting resolution" },
  { key: "revoked_grant_memories", label: "Revoked-source memories", description: "Historical memories whose grant was revoked" },
  { key: "missing_service_writers", label: "Unattributed service lineage", description: "Legacy traffic or services missing writer identity", href: "/provenance-issues" },
  { key: "tenant_legacy_unknown_memories", label: "Unknown legacy sources", description: "Migrated tenant memories whose original source cannot be proven", href: "/backfill" },
  { key: "missing_passport_sources", label: "Missing Passport sources", description: "Deleted or absent agent/organisation lineage", href: "/provenance-issues?type=passport_source" },
  { key: "failed_backfills_30d", label: "Failed backfills", description: "Provenance backfills failed in the last 30 days", href: "/backfill" },
] as const;

function CoverageRow({ label, covered, total, percentage }: { label: string; covered: number; total: number; percentage: number }) {
  const tone = percentage < 95 ? "bg-red-400" : percentage < 100 ? "bg-amber-300" : "bg-emerald-400";
  return (
    <div>
      <div className="flex items-center justify-between gap-4 text-sm">
        <span className="text-slate-300">{label}</span>
        <span className="font-semibold text-white">{percentage.toFixed(2)}%</span>
      </div>
      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-800">
        <div className={`h-full ${tone}`} style={{ width: `${Math.max(0, Math.min(100, percentage))}%` }} />
      </div>
      <p className="mt-1 text-xs text-slate-500">{covered.toLocaleString()} of {total.toLocaleString()}</p>
    </div>
  );
}

export function ProvenanceHealthPanel({ data, error }: Props) {
  const statusTone =
    data?.status === "CRITICAL"
      ? "border-red-500/40 bg-red-500/10 text-red-200"
      : data?.status === "ATTENTION"
        ? "border-amber-500/40 bg-amber-500/10 text-amber-100"
        : "border-emerald-500/30 bg-emerald-500/10 text-emerald-100";

  return (
    <section className="mb-10" aria-labelledby="provenance-health-heading">
      <div className="mb-4 flex flex-col gap-1 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h2 id="provenance-health-heading" className="text-lg font-semibold text-white">Provenance integrity</h2>
          <p className="text-sm text-slate-400">Fleet lineage coverage and actionable governance exceptions. Aggregates refresh every 60 seconds.</p>
        </div>
        {data ? (
          <div className={`inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-xs font-semibold ${statusTone}`}>
            {data.status === "HEALTHY" ? <CheckCircle2 size={15} /> : <AlertTriangle size={15} />}
            {data.status}
          </div>
        ) : null}
      </div>

      {error ? (
        <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-4 text-sm text-red-200">
          Provenance metrics are unavailable. Memory APIs are not blocked; inspect the database circuit and internal API logs.
        </div>
      ) : !data ? (
        <div className="h-44 animate-pulse rounded-lg border border-slate-800 bg-slate-900/70" />
      ) : (
        <div className="grid gap-4 lg:grid-cols-[1.2fr_2fr]">
          <div className="rounded-lg border border-slate-800 bg-slate-900/70 p-5">
            <div className="flex items-center gap-3 text-sky-300">
              <Database size={19} />
              <span className="text-sm font-semibold">Lineage coverage</span>
            </div>
            <p className="mt-4 text-4xl font-semibold text-white">{data.coverage_pct.toFixed(2)}%</p>
            <p className="mt-2 text-sm text-slate-400">Combined tenant and Passport coverage</p>
            <div className="mt-5 space-y-4 border-t border-slate-800 pt-4">
              <CoverageRow label="Tenant memories" covered={data.tenant_memories_with_provenance} total={data.tenant_memories_total} percentage={data.tenant_coverage_pct} />
              <CoverageRow label="Memory Passport" covered={data.passport_memories_with_provenance} total={data.passport_memories_total} percentage={data.passport_coverage_pct} />
              {data.tenant_coverage_pct < 100 ? <p className="rounded-lg border border-amber-400/20 bg-amber-400/5 px-3 py-2 text-xs leading-5 text-amber-100">Run the tenant provenance dry check before migrating legacy rows. The Passport backfill does not change tenant coverage.</p> : null}
              {data.tenant_legacy_unknown_memories > 0 ? <p className="rounded-lg border border-slate-700 bg-slate-800/60 px-3 py-2 text-xs leading-5 text-slate-300">{data.tenant_legacy_unknown_memories.toLocaleString()} migrated tenant memories have ledger history but no provable original source. They remain explicitly unknown.</p> : null}
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {metricDefinitions.map(({ key, label, description, ...metric }) => {
              const value = data[key];
              const body = (
                <>
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-semibold text-slate-200">{label}</p>
                    {value > 0 ? <ShieldAlert size={16} className="text-amber-300" /> : <CheckCircle2 size={16} className="text-emerald-300" />}
                  </div>
                  <p className="mt-3 text-2xl font-semibold text-white">{value.toLocaleString()}</p>
                  <p className="mt-1 text-xs leading-5 text-slate-500">{description}</p>
                  {"href" in metric && metric.href && value > 0 ? (
                    <span className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-sky-300">Investigate <ArrowRight size={13} /></span>
                  ) : null}
                </>
              );
              const className = "rounded-lg border border-slate-800 bg-slate-900/70 p-4 transition hover:border-slate-700";
              return "href" in metric && metric.href && value > 0 ? (
                <Link key={key} href={metric.href} className={className}>{body}</Link>
              ) : (
                <div key={key} className={className}>{body}</div>
              );
            })}
          </div>
        </div>
      )}
    </section>
  );
}