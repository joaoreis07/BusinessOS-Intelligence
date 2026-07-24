import type { SchedulingIntegrationStatus } from "./types";

export function getDashboardIntegrationStatus(): SchedulingIntegrationStatus {
  return {
    module: "dashboard",
    enabled: false,
    ready: false,
    notes: "Dashboard KPIs will consume appointment metrics in a future sprint.",
  };
}
