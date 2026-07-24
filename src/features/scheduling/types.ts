import type { AppointmentStatus } from "./schemas";
import type { BookingFlow, SchedulingPreferences } from "./settings/schemas";

export type AppointmentListItemDTO = {
  id: string;
  customerId: string;
  serviceId: string;
  customerName: string;
  customerPhone: string | null;
  customerEmail: string | null;
  serviceName: string;
  priceCents: number;
  durationMinutes: number;
  startsAt: string;
  endsAt: string;
  status: AppointmentStatus;
  objective: string | null;
  customerNotes: string | null;
  internalNotes: string | null;
  cancellationReason: string | null;
  source: string;
  createdAt: string;
  updatedAt: string;
  /** Reserved for assigned professional. */
  professionalId?: string | null;
};

export type AppointmentEventDTO = {
  id: string;
  eventType: string;
  fromStatus: AppointmentStatus | null;
  toStatus: AppointmentStatus | null;
  createdAt: string;
  payload: Record<string, unknown>;
};

export type AppointmentDetailDTO = AppointmentListItemDTO & {
  history: AppointmentEventDTO[];
};

export type PaginatedAppointmentsDTO = {
  items: AppointmentListItemDTO[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
};

export type AppointmentPanelCapabilitiesDTO = {
  canRead: boolean;
  canManage: boolean;
  canConfigure: boolean;
};

export type PublicBookingCompanyDTO = {
  name: string;
  slug: string;
  city: string | null;
  state: string | null;
  primaryColor: string | null;
};

export type PublicBookingServiceDTO = {
  id: string;
  name: string;
  description: string | null;
  priceCents: number;
  durationMinutes: number;
};

export type PublicBookingPageDTO = {
  company: PublicBookingCompanyDTO;
  services: PublicBookingServiceDTO[];
};

export type PublicSchedulingPreferencesDTO = SchedulingPreferences;

export type PublicBookingSchedulingDTO = {
  bookingEnabled: boolean;
  bookingFlow: BookingFlow;
  minNoticeMinutes: number;
  horizonDays: number;
  intervalMinutes: number;
  timezone: string;
  preferences: PublicSchedulingPreferencesDTO;
  /** Reserved for multi-professional scheduling. */
  professionalId?: string | null;
  /** Reserved for multi-location scheduling. */
  locationId?: string | null;
};

export type PublicBookingWizardDTO = {
  company: PublicBookingCompanyDTO;
  services: PublicBookingServiceDTO[];
  scheduling: PublicBookingSchedulingDTO;
};

export type PublicAvailableDatesDTO = {
  dates: string[];
  timezone: string;
};

export type AvailabilitySlotDTO = {
  startsAt: string;
};

export type PublicBookingResultDTO = {
  appointmentId: string;
  status: AppointmentStatus;
};

export type WorkspaceAppointmentResultDTO = {
  appointmentId: string;
  status: AppointmentStatus;
};

export type RescheduleAppointmentResultDTO = {
  appointmentId: string;
  status: AppointmentStatus;
  startsAt: string;
  endsAt: string;
};

export type AvailabilityRuleDTO = {
  id: string;
  weekday: number;
  startTime: string;
  endTime: string;
  enabled: boolean;
};

export type SchedulingIntegrationModule =
  | "crm"
  | "finance"
  | "dashboard"
  | "external-calendars"
  | "messaging";
