"use client";

import { RotateCcw } from "lucide-react";

import { TenantSummary } from "@/lib/admin-api";

export type AuditFilterValue = {
  tenantId: string;
  action: string;
  startDate: string;
  endDate: string;
};

type AuditFiltersProps = {
  tenants: TenantSummary[];
  value: AuditFilterValue;
  onChange: (next: AuditFilterValue) => void;
  onReset: () => void;
};

const ACTION_OPTIONS = [
  "",
  "memory_created",
  "memory_updated",
  "memory_archived",
  "memory_deleted",
  "memory_retrieved",
  "conflict_resolved",
  "proxy_user_deleted",
  "job_discarded",
];

export function AuditFilters({ tenants, value, onChange, onReset }: AuditFiltersProps) {
  return (
    <div className="rounded-3xl border border-slate-800 bg-slate-900/70 p-5">
      <div className="grid gap-4 xl:grid-cols-[1.4fr_1fr_1fr_1fr_auto]">
        <label className="flex flex-col gap-2 text-sm text-slate-300">
          <span>Tenant</span>
          <select
            className="rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-slate-100 outline-none transition focus:border-sky-400"
            value={value.tenantId}
            onChange={(event) => onChange({ ...value, tenantId: event.target.value })}
          >
            <option value="">All Tenants</option>
            {tenants.map((tenant) => (
              <option key={tenant.tenant_id} value={tenant.tenant_id}>
                {tenant.company_name}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-2 text-sm text-slate-300">
          <span>Action</span>
          <select
            className="rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-slate-100 outline-none transition focus:border-sky-400"
            value={value.action}
            onChange={(event) => onChange({ ...value, action: event.target.value })}
          >
            <option value="">All Actions</option>
            {ACTION_OPTIONS.filter(Boolean).map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-2 text-sm text-slate-300">
          <span>Start date</span>
          <input
            type="date"
            className="rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-slate-100 outline-none transition focus:border-sky-400"
            value={value.startDate}
            max={value.endDate}
            onChange={(event) => {
              const startDate = event.target.value;
              onChange({
                ...value,
                startDate,
                endDate: value.endDate < startDate ? startDate : value.endDate,
              });
            }}
          />
        </label>

        <label className="flex flex-col gap-2 text-sm text-slate-300">
          <span>End date</span>
          <input
            type="date"
            className="rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-slate-100 outline-none transition focus:border-sky-400"
            value={value.endDate}
            min={value.startDate}
            onChange={(event) => {
              const endDate = event.target.value;
              onChange({
                ...value,
                startDate: value.startDate > endDate ? endDate : value.startDate,
                endDate,
              });
            }}
          />
        </label>

        <div className="flex items-end">
          <button
            type="button"
            onClick={onReset}
            className="inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-slate-200 transition hover:bg-slate-800 xl:w-auto"
          >
            <RotateCcw className="size-4" />
            Reset Filters
          </button>
        </div>
      </div>
    </div>
  );
}
