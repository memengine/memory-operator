"use client";

import { Building2, RefreshCcw, TriangleAlert } from "lucide-react";
import useSWR from "swr";

import { TenantTable } from "@/components/tenant-table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getAllTenants, TenantSummary } from "@/lib/admin-api";

function filterNeedsAttention(tenants: TenantSummary[]) {
  return tenants.filter(
    (tenant) =>
      tenant.quota_mode === "PASSTHROUGH" ||
      tenant.quota_mode === "BLOCKED" ||
      tenant.dead_job_count > 0,
  );
}

export default function TenantsPage() {
  const { data, error, isLoading, mutate } = useSWR(
    "all-tenants",
    getAllTenants,
    {
      refreshInterval: 60_000,
      revalidateOnFocus: false,
    },
  );

  const tenants = data?.tenants ?? [];
  const needsAttention = filterNeedsAttention(tenants);

  return (
    <div className="min-h-screen bg-slate-950 px-6 py-8 text-slate-100 lg:px-10">
      <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.35em] text-sky-300">
            Tenants
          </p>
          <h1 className="mt-4 text-4xl font-semibold tracking-tight text-white">
            Customer fleet overview
          </h1>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-400">
            Review operational posture across tenants, spot degraded quota modes, and jump straight into a single tenant drill-down.
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
        <div className="rounded-3xl border border-slate-800 bg-slate-900/70 p-5">
          <p className="text-sm text-slate-400">Tracked tenants</p>
          <p className="mt-4 text-4xl font-semibold text-white">{tenants.length}</p>
        </div>
        <div className="rounded-3xl border border-amber-500/20 bg-amber-500/10 p-5">
          <p className="text-sm text-amber-100">Needs attention</p>
          <p className="mt-4 text-4xl font-semibold text-white">{needsAttention.length}</p>
        </div>
        <div className="rounded-3xl border border-slate-800 bg-slate-900/70 p-5">
          <p className="text-sm text-slate-400">Dead-letter jobs</p>
          <p className="mt-4 text-4xl font-semibold text-white">
            {tenants.reduce((sum, tenant) => sum + tenant.dead_job_count, 0)}
          </p>
        </div>
      </div>

      {error ? (
        <div className="mb-6 rounded-3xl border border-red-500/30 bg-red-500/10 px-5 py-4 text-sm text-red-200">
          Failed to load tenants. Try again after the internal API is reachable.
        </div>
      ) : null}

      <Tabs defaultValue="attention" className="gap-6">
        <TabsList
          variant="line"
          className="rounded-2xl border border-slate-800 bg-slate-900/70 p-1"
        >
          <TabsTrigger
            value="attention"
            className="rounded-xl px-4 py-2 data-active:bg-sky-500/20 data-active:text-sky-100"
          >
            <TriangleAlert className="size-4" />
            Needs Attention
          </TabsTrigger>
          <TabsTrigger
            value="all"
            className="rounded-xl px-4 py-2 data-active:bg-sky-500/20 data-active:text-sky-100"
          >
            <Building2 className="size-4" />
            All Tenants
          </TabsTrigger>
        </TabsList>

        <TabsContent value="attention" className="mt-0">
          {isLoading && !data ? (
            <div className="h-64 animate-pulse rounded-3xl border border-slate-800 bg-slate-900/70" />
          ) : needsAttention.length > 0 ? (
            <TenantTable tenants={needsAttention} />
          ) : (
            <div className="rounded-3xl border border-slate-800 bg-slate-900/70 px-5 py-12 text-center text-sm text-slate-400">
              No tenants currently match the attention criteria.
            </div>
          )}
        </TabsContent>

        <TabsContent value="all" className="mt-0">
          {isLoading && !data ? (
            <div className="h-64 animate-pulse rounded-3xl border border-slate-800 bg-slate-900/70" />
          ) : (
            <TenantTable tenants={tenants} />
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
