import type { SchedulingEventPayload, SchedulingIntegrationStatus } from "./types";

export function getMessagingIntegrationStatus(): SchedulingIntegrationStatus {
  return {
    module: "messaging",
    enabled: false,
    ready: false,
    notes: "WhatsApp notifications will be dispatched from appointment events in a future sprint.",
  };
}

export async function notifyMessagingAppointmentUpdate(
  payload: SchedulingEventPayload,
): Promise<void> {
  void payload;
}
