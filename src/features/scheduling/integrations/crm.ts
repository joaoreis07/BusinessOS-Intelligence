import type { SchedulingEventPayload, SchedulingIntegrationStatus } from "./types";

export function getCrmIntegrationStatus(): SchedulingIntegrationStatus {
  return {
    module: "crm",
    enabled: false,
    ready: false,
    notes: "CRM sync will attach customers and appointment history in a future sprint.",
  };
}

export async function notifyCrmAppointmentCreated(
  payload: SchedulingEventPayload,
): Promise<void> {
  void payload;
}
