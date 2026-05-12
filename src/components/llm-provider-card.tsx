"use client";

import { AlertTriangle, CheckCircle2, TimerReset } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { LlmProviderStatus } from "@/lib/admin-api";

function minutesSince(value: string | null | undefined) {
  if (!value) {
    return null;
  }
  const diffMs = Date.now() - new Date(value).getTime();
  return Math.max(1, Math.floor(diffMs / 60000));
}

function formatStateLabel(state: LlmProviderStatus["state"]) {
  return state.replace("_", " ");
}

function cardClassName(state: LlmProviderStatus["state"]) {
  if (state === "OPEN") {
    return "border-red-500/40 bg-red-500/10";
  }
  if (state === "HALF_OPEN") {
    return "border-amber-500/40 bg-amber-500/10";
  }
  return "border-emerald-500/30 bg-emerald-500/10";
}

function configuredCardClassName(provider: LlmProviderStatus) {
  if (provider.configured === false) {
    return "border-slate-700 bg-slate-900/60";
  }
  return cardClassName(provider.state);
}

function dotClassName(state: LlmProviderStatus["state"]) {
  if (state === "OPEN") {
    return "bg-red-400";
  }
  if (state === "HALF_OPEN") {
    return "bg-amber-400";
  }
  return "bg-emerald-400";
}

function configuredDotClassName(provider: LlmProviderStatus) {
  if (provider.configured === false) {
    return "bg-slate-500";
  }
  return dotClassName(provider.state);
}

type LlmProviderCardProps = {
  provider: LlmProviderStatus;
  isActive: boolean;
  usedThisHour?: number;
};

export function LlmProviderCard({
  provider,
  isActive,
  usedThisHour = 0,
}: LlmProviderCardProps) {
  const openMinutes = minutesSince(provider.last_failure_at);

  return (
    <div className={`rounded-2xl border p-5 ${configuredCardClassName(provider)}`}>
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-400">
              {provider.name}
            </p>
            {provider.configured === false ? (
              <Badge className="border-slate-600 bg-slate-800 text-slate-200">
                NOT CONFIGURED
              </Badge>
            ) : isActive ? (
              <Badge className="border-emerald-500/40 bg-emerald-500/15 text-emerald-100">
                ACTIVE
              </Badge>
            ) : null}
          </div>
          <div className="mt-3 flex items-center gap-2">
            <span className={`size-2.5 rounded-full ${configuredDotClassName(provider)}`} />
            <p className="text-lg font-semibold text-white">
              {provider.configured === false ? "NOT CONFIGURED" : formatStateLabel(provider.state)}
            </p>
          </div>
        </div>
        {provider.configured === false ? null : provider.state === "OPEN" ? (
          <AlertTriangle className="size-5 text-red-300" />
        ) : provider.state === "HALF_OPEN" ? (
          <TimerReset className="size-5 text-amber-300" />
        ) : (
          <CheckCircle2 className="size-5 text-emerald-300" />
        )}
      </div>

      <div className="mt-4 space-y-2 text-sm text-slate-300">
        <p>Failures: {provider.failures}</p>
        {provider.configured !== false ? (
          <p>Used for {usedThisHour.toLocaleString()} extractions this hour</p>
        ) : null}
        {provider.configured === false ? (
          <p>Add this provider API key to enable fallback.</p>
        ) : provider.state === "OPEN" ? (
          openMinutes ? (
            <p>Open since {openMinutes} minutes ago</p>
          ) : (
            <p>Open since unavailable</p>
          )
        ) : provider.state === "HALF_OPEN" ? (
          <p>Testing recovery...</p>
        ) : isActive ? (
          <p>Currently used for new extraction calls.</p>
        ) : (
          <p>Ready fallback provider.</p>
        )}
        {provider.configured !== false && usedThisHour === 0 ? (
          <p className="text-amber-200">
            No recent usage - may indicate circuit is open.
          </p>
        ) : null}
      </div>

      <div className="mt-5">
        <Badge variant="outline" className="border-slate-700 bg-slate-950/40 text-slate-200">
          LLM provider circuit
        </Badge>
      </div>
    </div>
  );
}
