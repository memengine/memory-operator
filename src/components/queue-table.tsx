"use client";

import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { QueueStatus } from "@/lib/admin-api";
import { Sparkline } from "@/components/sparkline";

function formatAge(seconds: number | null) {
  if (seconds == null) {
    return "N/A";
  }
  if (seconds < 60) {
    return `${seconds}s`;
  }
  if (seconds < 3600) {
    return `${Math.floor(seconds / 60)}m`;
  }
  return `${Math.floor(seconds / 3600)}h ${Math.floor((seconds % 3600) / 60)}m`;
}

function badgeClasses(status: QueueStatus["status"]) {
  if (status === "CRITICAL") {
    return "border-red-500/40 bg-red-500/10 text-red-200";
  }
  if (status === "BACKLOG") {
    return "border-amber-500/40 bg-amber-500/10 text-amber-200";
  }
  return "border-emerald-500/30 bg-emerald-500/10 text-emerald-200";
}

export function QueueTable({
  queues,
  histories,
}: {
  queues: QueueStatus[];
  histories: Record<string, number[]>;
}) {
  return (
    <div className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/70">
      <Table>
        <TableHeader>
          <TableRow className="border-slate-800">
            <TableHead className="text-slate-400">Queue</TableHead>
            <TableHead className="text-slate-400">Depth</TableHead>
            <TableHead className="text-slate-400">Oldest Job</TableHead>
            <TableHead className="text-slate-400">Trend</TableHead>
            <TableHead className="text-slate-400">Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {queues.map((queue) => (
            <TableRow key={queue.name} className="border-slate-800">
              <TableCell className="font-medium text-white">{queue.name}</TableCell>
              <TableCell className="text-slate-200">{queue.depth}</TableCell>
              <TableCell className="text-slate-300">
                {formatAge(queue.oldest_job_age_seconds)}
              </TableCell>
              <TableCell>
                <Sparkline points={histories[queue.name] ?? [queue.depth]} />
              </TableCell>
              <TableCell>
                <Badge variant="outline" className={badgeClasses(queue.status)}>
                  {queue.status}
                </Badge>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
