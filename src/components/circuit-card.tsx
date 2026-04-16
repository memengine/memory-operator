"use client";

import { useMemo, useState } from "react";
import { AlertTriangle, CheckCircle2, RotateCcw, TimerReset } from "lucide-react";

import { CircuitStatus, resetCircuit } from "@/lib/admin-api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";

function minutesSince(openSince: string | null) {
  if (!openSince) {
    return null;
  }
  const diffMs = Date.now() - new Date(openSince).getTime();
  return Math.max(1, Math.floor(diffMs / 60000));
}

function formatStateLabel(state: CircuitStatus["state"]) {
  return state.replace("_", " ");
}

type CircuitCardProps = {
  circuit: CircuitStatus;
  onReset: () => Promise<void>;
};

export function CircuitCard({ circuit, onReset }: CircuitCardProps) {
  const [confirmValue, setConfirmValue] = useState("");
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const minutesOpen = minutesSince(circuit.open_since);
  const cardClassName = useMemo(() => {
    if (circuit.state === "OPEN") {
      return "border-red-500/40 bg-red-500/10";
    }
    if (circuit.state === "HALF_OPEN") {
      return "border-amber-500/40 bg-amber-500/10";
    }
    return "border-emerald-500/30 bg-emerald-500/10";
  }, [circuit.state]);

  const dotClassName =
    circuit.state === "OPEN"
      ? "bg-red-400"
      : circuit.state === "HALF_OPEN"
        ? "bg-amber-400"
        : "bg-emerald-400";

  async function handleReset() {
    setSubmitting(true);
    setError(null);
    try {
      await resetCircuit(circuit.name);
      await onReset();
      setOpen(false);
      setConfirmValue("");
    } catch (resetError) {
      setError(resetError instanceof Error ? resetError.message : "Reset failed");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className={`rounded-2xl border p-5 ${cardClassName}`}>
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-400">
            {circuit.name}
          </p>
          <div className="mt-3 flex items-center gap-2">
            <span className={`size-2.5 rounded-full ${dotClassName}`} />
            <p className="text-lg font-semibold text-white">{formatStateLabel(circuit.state)}</p>
          </div>
        </div>
        {circuit.state === "OPEN" ? (
          <AlertTriangle className="size-5 text-red-300" />
        ) : circuit.state === "HALF_OPEN" ? (
          <TimerReset className="size-5 text-amber-300" />
        ) : (
          <CheckCircle2 className="size-5 text-emerald-300" />
        )}
      </div>

      <div className="mt-4 space-y-2 text-sm text-slate-300">
        <p>Failures: {circuit.failure_count}</p>
        {circuit.state === "OPEN" ? (
          minutesOpen ? (
            <p>Open since {minutesOpen} minutes ago</p>
          ) : (
            <p>Open since unavailable</p>
          )
        ) : circuit.state === "HALF_OPEN" ? (
          minutesOpen ? (
            <p>Recovering after {minutesOpen} minutes open</p>
          ) : (
            <p>Recovery probe in progress</p>
          )
        ) : (
          <p>Dependency healthy</p>
        )}
      </div>

      <div className="mt-5 flex items-center justify-between gap-3">
        <Badge
          variant="outline"
          className="border-slate-700 bg-slate-950/40 text-slate-200"
        >
          Dependency circuit
        </Badge>

        {circuit.state === "OPEN" ? (
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button variant="destructive" size="sm">
                <RotateCcw className="size-3.5" />
                Force Close
              </Button>
            </DialogTrigger>
            <DialogContent className="border border-slate-800 bg-slate-900 text-slate-100">
              <DialogHeader>
                <DialogTitle>Force close {circuit.name}?</DialogTitle>
                <DialogDescription className="text-slate-400">
                  Type <span className="font-semibold text-slate-100">CONFIRM</span> to reset this circuit.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-3">
                <Input
                  value={confirmValue}
                  onChange={(event) => setConfirmValue(event.target.value)}
                  placeholder="Type CONFIRM"
                  className="border-slate-700 bg-slate-950 text-white"
                />
                {error ? (
                  <p className="text-sm text-red-300">{error}</p>
                ) : null}
              </div>
              <DialogFooter>
                <Button
                  variant="destructive"
                  onClick={handleReset}
                  disabled={confirmValue !== "CONFIRM" || submitting}
                >
                  {submitting ? "Resetting..." : "Confirm reset"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        ) : null}
      </div>
    </div>
  );
}
