import type { SchedulingEventPayload, SchedulingIntegrationStatus } from "./types";

export function getExternalCalendarIntegrationStatus(): SchedulingIntegrationStatus {
  return {
    module: "external-calendars",
    enabled: false,
    ready: false,
    notes: "Google Calendar and Outlook sync are planned; adapters will live here.",
  };
}

export async function syncAppointmentToExternalCalendars(
  payload: SchedulingEventPayload,
): Promise<void> {
  void payload;
}
