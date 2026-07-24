import type { SchedulingIntegrationModule } from "../types";

export type SchedulingIntegrationStatus = {
  module: SchedulingIntegrationModule;
  enabled: boolean;
  ready: boolean;
  notes?: string;
};

export type SchedulingEventPayload = {
  appointmentId: string;
  companyId: string;
  serviceId: string;
  customerId: string;
  startsAt: string;
  endsAt: string;
  status: string;
  source: string;
};
