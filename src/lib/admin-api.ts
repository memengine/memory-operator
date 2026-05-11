export type CircuitState = "CLOSED" | "OPEN" | "HALF_OPEN";
export type QueueStatusValue = "NORMAL" | "BACKLOG" | "CRITICAL";
export type OverallStatus = "HEALTHY" | "DEGRADED" | "CRITICAL";
export type PlanTier = "free" | "starter" | "growth" | "enterprise";
export type QuotaMode = "FULL" | "PASSTHROUGH" | "DEGRADED_RETRIEVE" | "BLOCKED";

export type CircuitStatus = {
  name: string;
  state: CircuitState;
  open_since: string | null;
  failure_count: number;
};

export type LlmProviderStatus = {
  name: string;
  state: CircuitState;
  failures: number;
  configured?: boolean;
  last_failure_at?: string | null;
};

export type ProviderUsageResponse = {
  data: {
    last_hour: Record<string, number>;
    active_provider: string | null;
  };
  generated_at: string;
};

export type QueueStatus = {
  name: string;
  depth: number;
  oldest_job_age_seconds: number | null;
  threshold: number;
  status: QueueStatusValue;
};

export type SystemHealthResponse = {
  circuits: CircuitStatus[];
  llm_providers: LlmProviderStatus[];
  queues: QueueStatus[];
  overall_status: OverallStatus;
  generated_at: string;
};

export type TenantSummary = {
  tenant_id: string;
  company_name: string;
  plan_tier: PlanTier;
  quota_mode: QuotaMode;
  quota_pct: number;
  memory_count: number;
  active_users_7d: number;
  dead_job_count: number;
  last_api_call: string | null;
  needs_attention: boolean;
  cross_user_conflicts_pending?: number;
  requires_attention?: number;
  clarifications_pending?: number;
  auto_resolution_rate?: number | null;
  extraction_success_rate?: number | null;
  nothing_to_extract_rate?: number | null;
  avg_extraction_tokens?: number | null;
  total_extraction_calls_mtd?: number;
  hot_memories_count?: number;
};

export type AllTenantsResponse = {
  tenants: TenantSummary[];
  next_cursor: string | null;
  limit: number;
  generated_at: string;
};

export type TenantUsage = {
  calls_used: number;
  calls_limit: number | null;
  tokens_used: number;
  tokens_limit: number | null;
  mode: QuotaMode;
  budget_remaining_pct: number;
  reset_at: string | null;
  plan_tier: PlanTier;
};

export type RecentExtractionJob = {
  id: string;
  status: string;
  proxy_user_id: string;
  created_at: string | null;
  processing_started_at: string | null;
  completed_at: string | null;
  attempts: number;
  error: string | null;
};

export type TenantDetail = {
  tenant: {
    tenant_id: string;
    company_name: string;
    plan_tier: PlanTier;
    created_at: string;
  };
  usage: TenantUsage;
  recent_jobs: RecentExtractionJob[];
  quality_summary: {
    total_calls: number;
    blocked_calls: number;
    block_rate: number;
    by_layer: {
      L1: number;
      L2: number;
      L3: number;
      L4: number;
    };
  };
  cost_estimate_mtd: number;
  cost_is_estimate: boolean;
};

export type DeadLetterJob = {
  id: string;
  tenant_id: string;
  proxy_user_id: string;
  external_user_id: string;
  status: string;
  attempts: number;
  queue_name: string | null;
  error: string | null;
  error_type?: string | null;
  payload?: Record<string, unknown> | null;
  queued_at: string | null;
  started_at: string | null;
  completed_at: string | null;
  dead_lettered_at: string | null;
};

export type DeadLetterResponse = {
  data: DeadLetterJob[];
  request_id: string;
  timestamp: string;
};

type ResetCircuitResponse = {
  name: string;
  state: string;
  open_since: string | null;
  failure_count: number;
};

type RetryDeadLetterResponse = {
  data: {
    job_id: string;
    status: string;
    queue_name: string;
  };
};

type DiscardDeadLetterResponse = {
  discarded: boolean;
  job_id: string;
};

export type CostSummaryTenant = {
  tenant_id: string;
  company_name: string;
  tokens: number;
  estimated_cost_usd: number;
  extraction_success_rate?: number | null;
  conflicts_resolved_mtd?: number | null;
  nothing_to_extract_rate?: number | null;
  add_calls?: number;
};

export type CostSummaryResponse = {
  total_tokens_mtd: number;
  total_estimated_cost_usd: number;
  avg_cost_per_call: number | null;
  top_5_tenants_by_cost: CostSummaryTenant[];
  total_gate_blocks_mtd: number;
  estimated_savings_from_gate_usd: number;
  projected_month_cost_usd: number;
  cost_is_estimate: boolean;
  avg_extraction_tokens?: number;
  total_extraction_calls_mtd?: number;
  extraction_success_rate?: number | null;
  nothing_to_extract_rate?: number | null;
  top_5_by_nothing_to_extract?: Array<{
    tenant_id: string;
    company_name: string;
    rate: number;
    add_calls: number;
  }>;
  conflict_types_breakdown?: Partial<
    Record<
      | "FACT_UPDATE"
      | "PREFERENCE_CHANGE"
      | "NEGATION"
      | "SKILL_PROGRESSION"
      | "NUMERIC_UPDATE"
      | "TEMPORAL_SHIFT",
      number
    >
  >;
  total_conflicts_resolved_mtd?: number;
  cross_user_conflicts_pending_total?: number;
  auto_resolution_rate_avg?: number | null;
  clarifications_triggered_mtd?: number;
  clarifications_resolved_mtd?: number;
  clarification_resolution_rate?: number | null;
};

export type BackfillJobResponse = {
  id: string;
  task_name: string;
  status: string;
  total_rows: number | null;
  processed_rows: number;
  pct_complete: number | null;
  started_at: string;
  completed_at: string | null;
  error: string | null;
  eta_seconds: number | null;
};

export type AuditLogEntry = {
  id: string;
  tenant_id: string | null;
  company_name: string | null;
  action: string;
  memory_id: string | null;
  created_at: string;
  ip_address: string | null;
  old_value_summary: string | null;
  new_value_summary: string | null;
  metadata: Record<string, unknown> | null;
};

export type AuditLogsResponse = {
  data: AuditLogEntry[];
  next_cursor: string | null;
  total_count: number;
  start_date: string;
  end_date: string;
};

async function parseJson<T>(response: Response): Promise<T> {
  const text = await response.text();
  return text ? (JSON.parse(text) as T) : ({} as T);
}

export async function adminFetch<T>(
  path: string,
  init?: RequestInit,
): Promise<T> {
  const response = await fetch(`/api/internal/${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
    cache: "no-store",
  });

  if (!response.ok) {
    const errorBody = await parseJson<{ error?: string; detail?: string }>(response);
    throw new Error(errorBody.error ?? errorBody.detail ?? "Request failed");
  }

  return parseJson<T>(response);
}

export function getSystemHealth() {
  return adminFetch<SystemHealthResponse>("system-health");
}

export function getProviderUsage() {
  return adminFetch<ProviderUsageResponse>("provider-usage");
}

export function resetCircuit(name: string) {
  return adminFetch<ResetCircuitResponse>(`circuit/${name}/reset`, {
    method: "POST",
  });
}

export function getAllTenants() {
  return adminFetch<AllTenantsResponse>("all-tenants");
}

export function getTenantDetail(tenantId: string) {
  return adminFetch<TenantDetail>(`tenant/${tenantId}`);
}

export function getDeadLetterJobs() {
  return adminFetch<DeadLetterResponse>("dead-letter-jobs");
}

export function retryDeadLetterJob(jobId: string) {
  return adminFetch<RetryDeadLetterResponse>(`dead-letter-jobs/${jobId}/retry`, {
    method: "POST",
  });
}

export function discardDeadLetterJob(jobId: string) {
  return adminFetch<DiscardDeadLetterResponse>(`dead-letter-jobs/${jobId}`, {
    method: "DELETE",
  });
}

export function getCostSummary() {
  return adminFetch<CostSummaryResponse>("cost-summary");
}

export function getBackfillStatus() {
  return adminFetch<BackfillJobResponse[]>("backfill-status");
}

export function getAuditLogs(params?: {
  tenant_id?: string;
  action?: string;
  start_date?: string;
  end_date?: string;
  cursor?: string;
  limit?: number;
}) {
  const searchParams = new URLSearchParams();
  Object.entries(params ?? {}).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      searchParams.set(key, String(value));
    }
  });
  const suffix = searchParams.toString();
  return adminFetch<AuditLogsResponse>(suffix ? `audit-logs?${suffix}` : "audit-logs");
}
