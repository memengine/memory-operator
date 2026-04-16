"use client";

import { useRouter } from "next/navigation";

import { MiniQuotaBar } from "@/components/mini-quota-bar";
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
  tenants: TenantSummary[];
};

export function TenantTable({ tenants }: TenantTableProps) {
  const router = useRouter();

  return (
    <div className="overflow-hidden rounded-3xl border border-slate-800 bg-slate-900/70">
      <Table>
        <TableHeader className="bg-slate-950/30">
          <TableRow className="border-slate-800 hover:bg-transparent">
            <TableHead className="px-4 text-slate-400">Company</TableHead>
            <TableHead className="text-slate-400">Plan</TableHead>
            <TableHead className="text-slate-400">Quota Mode</TableHead>
            <TableHead className="text-slate-400">Quota %</TableHead>
            <TableHead className="text-slate-400">Memories</TableHead>
            <TableHead className="text-slate-400">Active Users (7d)</TableHead>
            <TableHead className="text-slate-400">Dead Jobs</TableHead>
            <TableHead className="text-slate-400">Last API Call</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {tenants.map((tenant) => {
            const stale = isStaleIntegration(tenant.last_api_call);
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
                  <Badge className={planBadgeClassName(tenant.plan_tier)}>
                    {tenant.plan_tier}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge className={quotaModeClassName(tenant.quota_mode)}>
                    {tenant.quota_mode}
                  </Badge>
                </TableCell>
                <TableCell>
                  <MiniQuotaBar quotaPct={tenant.quota_pct} />
                </TableCell>
                <TableCell className="tabular-nums text-slate-200">
                  {tenant.memory_count.toLocaleString()}
                </TableCell>
                <TableCell className="tabular-nums text-slate-200">
                  {tenant.active_users_7d.toLocaleString()}
                </TableCell>
                <TableCell>
                  {tenant.dead_job_count > 0 ? (
                    <Badge className="border-red-400/30 bg-red-500/15 text-red-100">
                      {tenant.dead_job_count}
                    </Badge>
                  ) : (
                    <span className="text-slate-400">0</span>
                  )}
                </TableCell>
                <TableCell
                  className={stale ? "text-amber-300" : "text-slate-300"}
                  title={stale ? "Integration may be inactive" : undefined}
                >
                  {formatRelativeTime(tenant.last_api_call)}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
