"use client";

type MiniQuotaBarProps = {
  quotaPct: number;
};

export function MiniQuotaBar({ quotaPct }: MiniQuotaBarProps) {
  const normalized = Math.max(0, Math.min(1, quotaPct));
  const pctLabel = `${(normalized * 100).toFixed(1)}%`;
  const fillClassName =
    normalized >= 1
      ? "bg-red-400"
      : normalized >= 0.8
        ? "bg-amber-400"
        : normalized >= 0.6
          ? "bg-sky-400"
          : "bg-emerald-400";

  return (
    <div className="flex min-w-40 items-center gap-3">
      <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-slate-800">
        <div
          className={`h-full rounded-full transition-all ${fillClassName}`}
          style={{ width: `${Math.max(normalized * 100, normalized > 0 ? 6 : 0)}%` }}
        />
      </div>
      <span className="text-xs font-medium tabular-nums text-slate-300">
        {pctLabel}
      </span>
    </div>
  );
}
