import type { SchedulingEventPayload, SchedulingIntegrationStatus } from "./types";

export function getFinanceIntegrationStatus(): SchedulingIntegrationStatus {
  return {
    module: "finance",
    enabled: false,
    ready: false,
    notes: "Financial entries will be generated from confirmed appointments in a future sprint.",
  };
}

export async function notifyFinanceAppointmentConfirmed(
  payload: SchedulingEventPayload,
): Promise<void> {
  void payload;
}
