"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

type ConflictType =
  | "FACT_UPDATE"
  | "PREFERENCE_CHANGE"
  | "NEGATION"
  | "SKILL_PROGRESSION"
  | "NUMERIC_UPDATE"
  | "TEMPORAL_SHIFT";

type ConflictBreakdownChartProps = {
  breakdown?: Partial<Record<ConflictType, number>>;
  deployedAt?: string;
};

const CONFLICT_TYPES: Array<{
  key: ConflictType;
  label: string;
  color: string;
}> = [
  { key: "FACT_UPDATE", label: "Fact Updated", color: "#60a5fa" },
  { key: "PREFERENCE_CHANGE", label: "Preference Changed", color: "#c084fc" },
  { key: "NEGATION", label: "Explicitly Negated", color: "#fb7185" },
  { key: "SKILL_PROGRESSION", label: "Skill Progressed", color: "#34d399" },
  { key: "NUMERIC_UPDATE", label: "Number Updated", color: "#2dd4bf" },
  { key: "TEMPORAL_SHIFT", label: "Time-Based Change", color: "#fbbf24" },
];

function formatInteger(value: number) {
  return new Intl.NumberFormat("en-US").format(value);
}

export function ConflictBreakdownChart({
  breakdown,
  deployedAt = "the latest conflict schema deployment",
}: ConflictBreakdownChartProps) {
  const rows = CONFLICT_TYPES.map((item) => ({
    ...item,
    count: breakdown?.[item.key] ?? 0,
  }));
  const total = rows.reduce((sum, row) => sum + row.count, 0);

  return (
    <div className="rounded-3xl border border-slate-800 bg-slate-900/70 p-5">
      <div className="mb-5">
        <h3 className="text-lg font-semibold text-white">
          What types of conflicts is the system catching?
        </h3>
        <p className="mt-1 text-sm leading-6 text-slate-400">
          See whether users are mostly changing facts, preferences, numbers, or
          time-sensitive context.
        </p>
      </div>

      {total === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-700 bg-slate-950/40 px-5 py-10 text-center text-sm text-slate-400">
          No conflicts detected this month. Conflict detection began on{" "}
          {deployedAt}.
        </div>
      ) : (
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={rows}
              layout="vertical"
              margin={{ top: 8, right: 24, bottom: 8, left: 34 }}
            >
              <CartesianGrid stroke="#1e293b" horizontal={false} />
              <XAxis
                type="number"
                allowDecimals={false}
                tick={{ fill: "#94a3b8", fontSize: 12 }}
                axisLine={{ stroke: "#334155" }}
                tickLine={{ stroke: "#334155" }}
              />
              <YAxis
                type="category"
                dataKey="label"
                width={142}
                tick={{ fill: "#cbd5e1", fontSize: 12 }}
                axisLine={{ stroke: "#334155" }}
                tickLine={false}
              />
              <Tooltip
                cursor={{ fill: "rgba(148, 163, 184, 0.08)" }}
                content={({ active, payload }) => {
                  if (!active || !payload?.length) {
                    return null;
                  }
                  const row = payload[0].payload as { label: string; count: number };
                  return (
                    <div className="rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm shadow-xl">
                      <div className="font-medium text-white">{row.label}</div>
                      <div className="mt-1 text-slate-300">
                        {formatInteger(row.count)} conflicts
                      </div>
                    </div>
                  );
                }}
              />
              <Bar dataKey="count" radius={[0, 8, 8, 0]}>
                {rows.map((entry) => (
                  <Cell key={entry.key} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
