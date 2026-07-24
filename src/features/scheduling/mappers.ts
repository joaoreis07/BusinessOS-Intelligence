import type { Json } from "@/types/database.generated";
import type { AppointmentStatus } from "./schemas";
import { schedulingPreferencesSchema } from "./settings/schemas";
import { publicBookingWizardContextSchema } from "./public/wizard-schemas";
import type {
  AppointmentDetailDTO,
  AppointmentEventDTO,
  AppointmentListItemDTO,
  AvailabilityRuleDTO,
  AvailabilitySlotDTO,
  PublicBookingCompanyDTO,
  PublicBookingPageDTO,
  PublicBookingResultDTO,
  PublicBookingServiceDTO,
  PublicBookingSchedulingDTO,
  PublicBookingWizardDTO,
  PaginatedAppointmentsDTO,
  RescheduleAppointmentResultDTO,
  WorkspaceAppointmentResultDTO,
} from "./types";

type AppointmentCustomerRow = {
  full_name: string | null;
  phone?: string | null;
  email?: string | null;
};

type AppointmentServiceRow = {
  name: string | null;
  price: number | string | null;
  duration_minutes?: number | null;
};

export type AppointmentListRow = {
  id: string;
  service_id: string;
  customer_id: string;
  starts_at: string;
  ends_at: string;
  status: string;
  objective: string | null;
  customer_notes: string | null;
  internal_notes: string | null;
  cancellation_reason: string | null;
  source: string;
  created_at: string;
  updated_at: string;
  customers: AppointmentCustomerRow | AppointmentCustomerRow[] | null;
  services: AppointmentServiceRow | AppointmentServiceRow[] | null;
};

type AppointmentEventRow = {
  id: string;
  event_type: string;
  from_status: string | null;
  to_status: string | null;
  payload: Json;
  created_at: string;
};

type PublicLandingPageRow = {
  name: string;
  slug: string;
  address: Json | null;
  primary_color: string | null;
};

type PublicServiceRow = {
  id: string;
  name: string;
  description: string | null;
  price: number | string;
  duration_minutes: number;
};

type BusinessHoursRow = {
  id: string;
  weekday: number;
  start_time: string;
  end_time: string;
  active: boolean;
};

type PublicAvailabilityRow = {
  slot_start: string;
};

type PublicAppointmentRpcRow = {
  appointment_id: string;
  appointment_status: AppointmentStatus;
};

function firstRelation<T>(value: T | T[] | null | undefined): T | null {
  if (!value) return null;
  return Array.isArray(value) ? (value[0] ?? null) : value;
}

function parseAddress(address: Json | null): Record<string, string> {
  if (!address || typeof address !== "object" || Array.isArray(address)) {
    return {};
  }
  return address as Record<string, string>;
}

export function mapAppointmentListItem(row: AppointmentListRow): AppointmentListItemDTO {
  const customer = firstRelation(row.customers);
  const service = firstRelation(row.services);
  return {
    id: row.id,
    customerId: row.customer_id,
    serviceId: row.service_id,
    customerName: customer?.full_name ?? "Cliente",
    customerPhone: customer?.phone ?? null,
    customerEmail: customer?.email ?? null,
    serviceName: service?.name ?? "Serviço",
    priceCents: Math.round(Number(service?.price ?? 0) * 100),
    durationMinutes: Number(service?.duration_minutes ?? 0),
    startsAt: row.starts_at,
    endsAt: row.ends_at,
    status: row.status as AppointmentStatus,
    objective: row.objective,
    customerNotes: row.customer_notes,
    internalNotes: row.internal_notes,
    cancellationReason: row.cancellation_reason,
    source: row.source,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    professionalId: null,
  };
}

export function mapAppointmentEvent(row: AppointmentEventRow): AppointmentEventDTO {
  const payload =
    row.payload && typeof row.payload === "object" && !Array.isArray(row.payload)
      ? (row.payload as Record<string, unknown>)
      : {};
  return {
    id: row.id,
    eventType: row.event_type,
    fromStatus: (row.from_status as AppointmentStatus | null) ?? null,
    toStatus: (row.to_status as AppointmentStatus | null) ?? null,
    createdAt: row.created_at,
    payload,
  };
}

export function mapAppointmentDetail(
  row: AppointmentListRow,
  events: AppointmentEventRow[],
): AppointmentDetailDTO {
  return {
    ...mapAppointmentListItem(row),
    history: events.map(mapAppointmentEvent),
  };
}

export function mapPaginatedAppointments(input: {
  rows: AppointmentListRow[];
  page: number;
  pageSize: number;
  total: number;
}): PaginatedAppointmentsDTO {
  const totalPages = Math.max(1, Math.ceil(input.total / input.pageSize));
  return {
    items: input.rows.map(mapAppointmentListItem),
    page: input.page,
    pageSize: input.pageSize,
    total: input.total,
    totalPages,
  };
}

export function mapPublicBookingCompany(row: PublicLandingPageRow): PublicBookingCompanyDTO {
  const address = parseAddress(row.address);
  return {
    name: row.name,
    slug: row.slug,
    city: address.city ?? null,
    state: address.state ?? null,
    primaryColor: row.primary_color,
  };
}

export function mapPublicBookingService(row: PublicServiceRow): PublicBookingServiceDTO {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    priceCents: Math.round(Number(row.price) * 100),
    durationMinutes: row.duration_minutes,
  };
}

export function mapPublicBookingPage(input: {
  company: PublicLandingPageRow;
  services: PublicServiceRow[];
}): PublicBookingPageDTO {
  return {
    company: mapPublicBookingCompany(input.company),
    services: input.services.map(mapPublicBookingService),
  };
}

export function mapAvailabilitySlot(row: PublicAvailabilityRow): AvailabilitySlotDTO {
  return { startsAt: row.slot_start };
}

export function mapPublicBookingResult(
  row: PublicAppointmentRpcRow | undefined,
): PublicBookingResultDTO | null {
  if (!row) return null;
  return {
    appointmentId: row.appointment_id,
    status: row.appointment_status,
  };
}

type WorkspaceAppointmentRpcRow = {
  appointment_id: string;
  appointment_status: AppointmentStatus;
};

type RescheduleAppointmentRpcRow = {
  appointment_id: string;
  appointment_status: AppointmentStatus;
  starts_at: string;
  ends_at: string;
};

export function mapWorkspaceAppointmentResult(
  row: WorkspaceAppointmentRpcRow | undefined,
): WorkspaceAppointmentResultDTO | null {
  if (!row) return null;
  return {
    appointmentId: row.appointment_id,
    status: row.appointment_status,
  };
}

export function mapRescheduleAppointmentResult(
  row: RescheduleAppointmentRpcRow | undefined,
): RescheduleAppointmentResultDTO | null {
  if (!row) return null;
  return {
    appointmentId: row.appointment_id,
    status: row.appointment_status,
    startsAt: row.starts_at,
    endsAt: row.ends_at,
  };
}

export function toBusinessHoursRulesPayload(
  rules: Array<{
    weekday: number;
    startTime: string;
    endTime: string;
    enabled: boolean;
  }>,
) {
  return rules.map((rule) => ({
    weekday: rule.weekday,
    startTime: rule.startTime,
    endTime: rule.endTime,
    enabled: rule.enabled,
  }));
}

export function mapAvailabilityRule(row: BusinessHoursRow): AvailabilityRuleDTO {
  return {
    id: row.id,
    weekday: row.weekday,
    startTime: row.start_time,
    endTime: row.end_time,
    enabled: row.active,
  };
}

export function mapPublicBookingScheduling(
  raw: unknown,
): PublicBookingSchedulingDTO | null {
  if (!raw || typeof raw !== "object") return null;
  const parsed = publicBookingWizardContextSchema.safeParse(raw);
  if (!parsed.success) return null;
  return {
    bookingEnabled: parsed.data.bookingEnabled,
    bookingFlow: parsed.data.bookingFlow,
    minNoticeMinutes: parsed.data.minNoticeMinutes,
    horizonDays: parsed.data.horizonDays,
    intervalMinutes: parsed.data.intervalMinutes,
    timezone: parsed.data.timezone,
    preferences: schedulingPreferencesSchema.parse(parsed.data.preferences),
    professionalId: null,
    locationId: null,
  };
}

export function mapPublicBookingWizard(input: {
  company: PublicLandingPageRow;
  services: PublicServiceRow[];
  scheduling: PublicBookingSchedulingDTO;
}): PublicBookingWizardDTO {
  return {
    company: mapPublicBookingCompany(input.company),
    services: input.services.map(mapPublicBookingService),
    scheduling: input.scheduling,
  };
}

/** Maps scheduling DTOs to client booking wizard props. */
export function toBookingWizardProps(wizard: PublicBookingWizardDTO) {
  return {
    company: wizard.company,
    services: wizard.services,
    scheduling: wizard.scheduling,
  };
}

/** Maps scheduling DTOs to the legacy booking form prop shape. */
export function toBookingFormProps(page: PublicBookingPageDTO) {
  return {
    company: {
      name: page.company.name,
      slug: page.company.slug,
      city: page.company.city,
      state: page.company.state,
      primary_color: page.company.primaryColor,
    },
    services: page.services.map((service) => ({
      id: service.id,
      name: service.name,
      description: service.description,
      price_cents: service.priceCents,
      duration_minutes: service.durationMinutes,
    })),
  };
}
