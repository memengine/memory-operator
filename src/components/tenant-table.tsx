"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronRight } from "lucide-react";

import { MiniQuotaBar } from "@/components/mini-quota-bar";
import { TenantQuickView, type TenantQuickViewData } from "@/components/tenant-quick-view";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { TenantSummary } from "@/lib/admin-api";

function formatRelativeTime(value: string | null) {
  if (!value) {
    return "Never";
  }

  const diffMs = Date.now() - new Date(value).getTime();
  const minutes = Math.floor(diffMs / 60000);
  if (minutes < 1) {
    return "Just now";
  }
  if (minutes < 60) {
    return `${minutes}m ago`;
  }
  const hours = Math.floor(minutes / 60);
  if (hours < 24) {
    return `${hours}h ago`;
  }
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

function isStaleIntegration(lastApiCall: string | null) {
  if (!lastApiCall) {
    return false;
  }
  return Date.now() - new Date(lastApiCall).getTime() > 7 * 24 * 60 * 60 * 1000;
}

function planBadgeClassName(plan: TenantSummary["plan_tier"]) {
  switch (plan) {
    case "enterprise":
      return "border-fuchsia-400/30 bg-fuchsia-500/15 text-fuchsia-100";
    case "growth":
      return "border-sky-400/30 bg-sky-500/15 text-sky-100";
    case "starter":
      return "border-emerald-400/30 bg-emerald-500/15 text-emerald-100";
    default:
      return "border-slate-600 bg-slate-800 text-slate-200";
  }
}

function quotaModeClassName(mode: TenantSummary["quota_mode"]) {
  switch (mode) {
    case "BLOCKED":
      return "border-red-400/30 bg-red-500/15 text-red-100";
    case "PASSTHROUGH":
      return "border-amber-400/30 bg-amber-500/15 text-amber-100";
    case "DEGRADED_RETRIEVE":
      return "border-orange-400/30 bg-orange-500/15 text-orange-100";
    default:
      return "border-emerald-400/30 bg-emerald-500/15 text-emerald-100";
  }
}

type TenantTableProps = {
  tenants: TenantQuickViewData[];
};

function formatPercent(value: number | null | undefined, totalCalls?: number | null) {
  if (totalCalls === 0 || value === null || value === undefined) {
    return "-";
  }
  return `${(value * 100).toFixed(1)}%`;
}

function autoResolutionClassName(value: number | null | undefined) {
  if (value === null || value === undefined) {
    return "text-slate-500";
  }
  if (value > 0.9) {
    return "text-emerald-300";
  }
  if (value >= 0.7) {
    return "text-amber-300";
  }
  return "text-red-300";
}

function noExtractClassName(value: number | null | undefined, totalCalls?: number | null) {
  if (totalCalls === 0 || value === null || value === undefined || value < 0.3) {
    return "text-slate-400";
  }
  if (value <= 0.5) {
    return "text-amber-300";
  }
  return "text-red-300";
}

export function TenantTable({ tenants }: TenantTableProps) {
  const router = useRouter();
  const [quickViewTenant, setQuickViewTenant] = useState<TenantQuickViewData | null>(null);

  return (
    <>
      <div className="overflow-hidden rounded-3xl border border-slate-800 bg-slate-900/70">
        <Table>
          <TableHeader className="bg-slate-950/30">
            <TableRow className="border-slate-800 hover:bg-transparent">
              <TableHead className="px-4 text-slate-400">Company</TableHead>
              <TableHead className="text-slate-400">Plan / Mode</TableHead>
              <TableHead className="text-slate-400">Quota</TableHead>
              <TableHead className="text-slate-400">Memory Activity</TableHead>
              <TableHead className="text-slate-400">Jobs / Extraction</TableHead>
              <TableHead
                className="text-slate-400"
                title="% of add() calls that passed quality gates but had no facts to store"
              >
                No-Extract Rate
              </TableHead>
              <TableHead className="text-slate-400">Hot Tier</TableHead>
              <TableHead
                className="text-slate-400"
                title="Percentage of cross-user conflicts resolved automatically this month"
              >
                Auto-Resolved %
              </TableHead>
              <TableHead
                className="text-slate-400"
                title="Conflicts that could not be auto-resolved and need tenant attention"
              >
                Needs Review
              </TableHead>
              <TableHead className="text-slate-400">Last API Call</TableHead>
              <TableHead className="px-4 text-right text-slate-400">Quick View</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {tenants.map((tenant) => {
              const stale = isStaleIntegration(tenant.last_api_call);
              const extractionRate = tenant.extraction_success_rate;
              const noExtractRate = tenant.nothing_to_extract_rate;
              const hotMemories = tenant.hot_memories_count ?? 0;
              const autoResolutionRate = tenant.auto_resolution_rate;
              const needsReview = tenant.requires_attention ?? 0;
              return (
                <TableRow
                  key={tenant.tenant_id}
                  className="cursor-pointer border-slate-800 text-slate-100 hover:bg-slate-800/60"
                  onClick={() => router.push(`/tenants/${tenant.tenant_id}`)}
                >
                  <TableCell className="px-4 py-4">
                    <div>
                      <p className="font-medium text-white">{tenant.company_name}</p>
                      <p className="mt-1 text-xs text-slate-500">{tenant.tenant_id}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col gap-2">
                      <Badge className={planBadgeClassName(tenant.plan_tier)}>
                        {tenant.plan_tier}
                      </Badge>
                      <Badge className={quotaModeClassName(tenant.quota_mode)}>
                        {tenant.quota_mode}
                      </Badge>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="min-w-28">
                      <MiniQuotaBar quotaPct={tenant.quota_pct} />
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1 text-sm">
                      <div className="tabular-nums text-slate-200">
                        {tenant.memory_count.toLocaleString()} memories
                      </div>
                      <div className="tabular-nums text-xs text-slate-500">
                        {tenant.active_users_7d.toLocaleString()} active users
                      </div>
                    </div>
                  </TableCell>
                  <TableCell
                    className={
                      extractionRate !== null &&
                      extractionRate !== undefined &&
                      extractionRate < 0.4
                        ? "tabular-nums text-red-300"
                        : "tabular-nums text-slate-200"
                    }
                    title={
                      extractionRate !== null &&
                      extractionRate !== undefined &&
                      extractionRate < 0.4
                        ? "Extraction may be broken for this tenant"
                        : undefined
                    }
                  >
                    <div className="space-y-2">
                      <div>
                        {tenant.dead_job_count > 0 ? (
                          <Badge className="border-red-400/30 bg-red-500/15 text-red-100">
                            {tenant.dead_job_count} dead
                          </Badge>
                        ) : (
                          <span className="text-xs text-slate-500">0 dead jobs</span>
                        )}
                      </div>
                      <div>
                        {formatPercent(extractionRate, tenant.total_extraction_calls_mtd)}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell
                    className={`tabular-nums ${noExtractClassName(
                      noExtractRate,
                      tenant.total_extraction_calls_mtd,
                    )}`}
                    title="% of add() calls that passed quality gates but had no facts to store"
                  >
                    {formatPercent(noExtractRate, tenant.total_extraction_calls_mtd)}
                  </TableCell>
                  <TableCell>
                    {hotMemories === 0 ? (
                      <Badge className="border-amber-400/30 bg-amber-500/15 text-amber-100">
                        0 hot
                      </Badge>
                    ) : (
                      <span className="tabular-nums text-slate-200">
                        {hotMemories.toLocaleString()} hot
                      </span>
                    )}
                  </TableCell>
                  <TableCell
                    className={`tabular-nums ${autoResolutionClassName(autoResolutionRate)}`}
                    title="Percentage of cross-user conflicts resolved automatically this month"
                  >
                    {formatPercent(autoResolutionRate)}
                  </TableCell>
                  <TableCell
                    title="Conflicts that could not be auto-resolved and need tenant attention"
                  >
                    {needsReview === 0 ? (
                      <span className="text-slate-500">-</span>
                    ) : needsReview > 3 ? (
                      <Badge className="border-red-400/30 bg-red-500/15 text-red-100">
                        {needsReview.toLocaleString()}
                      </Badge>
                    ) : (
                      <Badge className="border-amber-400/30 bg-amber-500/15 text-amber-100">
                        {needsReview.toLocaleString()}
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell
                    className={stale ? "text-amber-300" : "text-slate-300"}
                    title={stale ? "Integration may be inactive" : undefined}
                  >
                    {formatRelativeTime(tenant.last_api_call)}
                  </TableCell>
                  <TableCell className="px-4 text-right">
                    <button
                      type="button"
                      className="rounded-xl border border-slate-700 p-2 text-slate-300 transition hover:bg-slate-800 hover:text-white"
                      aria-label={`Open quick view for ${tenant.company_name}`}
                      onClick={(event) => {
                        event.stopPropagation();
                        setQuickViewTenant(tenant);
                      }}
                    >
                      <ChevronRight className="size-4" />
                    </button>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
      <TenantQuickView tenant={quickViewTenant} onClose={() => setQuickViewTenant(null)} />
    </>
  );
}
