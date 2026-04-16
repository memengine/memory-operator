"use client";

import { useEffect, useState } from "react";
import useSWR from "swr";

import { CircuitCard } from "@/components/circuit-card";
import { QueueTable } from "@/components/queue-table";
import { getSystemHealth, SystemHealthResponse } from "@/lib/admin-api";

const REFRESH_INTERVAL_MS = 10_000;

function formatGeneratedAt(value: string) {
  return new Date(value).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

export default function SystemHealthPage() {
  const [queueHistories, setQueueHistories] = useState<Record<string, number[]>>({});
  const { data, error, isLoading, mutate } = useSWR<SystemHealthResponse>(
    "system-health",
    getSystemHealth,
    {
      refreshInterval: REFRESH_INTERVAL_MS,
      revalidateOnFocus: false,
      onSuccess: (nextData) => {
        setQueueHistories((current) => {
          const next = { ...current };
          nextData.queues.forEach((queue) => {
            const history = [...(next[queue.name] ?? []), queue.depth];
            next[queue.name] = history.slice(-360);
          });
          return next;
        });
      },
    },
  );
  const [nowTick, setNowTick] = useState(0);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setNowTick(Date.now());
    }, 1000);
    return () => window.clearInterval(timer);
  }, []);

  const secondsRemaining = !data?.generated_at
    ? 10
    : Math.max(
        1,
        10 -
          (Math.floor((nowTick - new Date(data.generated_at).getTime()) / 1000) %
            10),
      );

  const impactedCircuits = data?.circuits.filter((circuit) => circuit.state !== "CLOSED") ?? [];
  const openCircuits = impactedCircuits.filter((circuit) => circuit.state === "OPEN");
  const halfOpenCircuits = impactedCircuits.filter((circuit) => circuit.state === "HALF_OPEN");
  const hasHardOpen = openCircuits.length > 0;

  return (
    <div className="min-h-screen bg-slate-950 px-6 py-8 text-slate-100 lg:px-10">
      {impactedCircuits.length > 0 ? (
        <div
          className={`sticky top-0 z-20 mb-6 rounded-2xl px-5 py-4 text-sm shadow-lg ${
            hasHardOpen
              ? "border border-red-500/30 bg-red-500/15 text-red-100 shadow-red-950/30"
              : "border border-amber-500/30 bg-amber-500/15 text-amber-100 shadow-amber-950/20"
          }`}
        >
          {hasHardOpen ? (
            <p>
              Circuit alert: {openCircuits.map((circuit) => circuit.name).join(", ")} is currently OPEN.
            </p>
          ) : null}
          {halfOpenCircuits.length > 0 ? (
            <p className={hasHardOpen ? "mt-1" : ""}>
              Recovery in progress: {halfOpenCircuits.map((circuit) => circuit.name).join(", ")} is probing in HALF_OPEN state.
            </p>
          ) : null}
        </div>
      ) : null}

      <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.35em] text-sky-300">
            System Health
          </p>
          <h1 className="mt-4 text-4xl font-semibold tracking-tight text-white">
            Platform dependencies and queue pressure
          </h1>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-400">
            Monitor circuit state and queue backlog in one screen. Data refreshes in the background every 10 seconds.
          </p>
        </div>
        <div className="rounded-2xl border border-slate-800 bg-slate-900/80 px-4 py-3 text-sm text-slate-300">
          <p>Refreshing in {secondsRemaining}s</p>
          {data ? <p className="mt-1 text-slate-500">Last update {formatGeneratedAt(data.generated_at)}</p> : null}
        </div>
      </div>

      {error ? (
        <div className="rounded-2xl border border-red-500/30 bg-red-500/10 px-5 py-6 text-sm text-red-200">
          Failed to load system health. Refresh the page or check the internal API proxy.
        </div>
      ) : null}

      <section className="mb-10">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-white">Circuit Breakers</h2>
          {data ? (
            <p className="text-sm text-slate-400">Overall status: {data.overall_status}</p>
          ) : null}
        </div>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
          {(data?.circuits ?? Array.from({ length: 5 })).map((circuit, index) =>
            circuit ? (
              <CircuitCard
                key={circuit.name}
                circuit={circuit}
                onReset={async () => {
                  await mutate();
                }}
              />
            ) : (
              <div
                key={index}
                className="h-48 animate-pulse rounded-2xl border border-slate-800 bg-slate-900/70"
              />
            ),
          )}
        </div>
      </section>

      <section>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-white">Queue Depth</h2>
          <p className="text-sm text-slate-400">Trend reflects samples captured while this page is open.</p>
        </div>
        {isLoading && !data ? (
          <div className="h-64 animate-pulse rounded-2xl border border-slate-800 bg-slate-900/70" />
        ) : data ? (
          <QueueTable queues={data.queues} histories={queueHistories} />
        ) : null}
      </section>
    </div>
  );
}
