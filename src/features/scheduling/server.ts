"use server";

import "server-only";

import { createClient } from "@/lib/supabase/server";

import { authenticatedContext, sanitizeSearchTerm, unwrap } from "../_shared/server";
import {
  buildAppointmentStatusIdempotencyKey,
  buildPublicBookingIdempotencyKey,
  buildRescheduleIdempotencyKey,
  buildWorkspaceAppointmentIdempotencyKey,
} from "./idempotency";
import {
  mapAppointmentDetail,
  mapAppointmentListItem,
  mapAvailabilityRule,
  mapAvailabilitySlot,
  mapPublicBookingResult,
  mapRescheduleAppointmentResult,
  mapWorkspaceAppointmentResult,
  toBusinessHoursRulesPayload,
  type AppointmentListRow,
} from "./mappers";
import { resolvePanelViewRange } from "./panel/query-range";
import { canTransitionAppointmentStatus } from "./panel/status";
import {
  addDaysToDateString,
  clampAvailabilityRange,
  collectAvailableDatesFromSlots,
  getBookingDateBounds,
} from "./public/available-dates";
import { publicAvailabilityRangeSchema } from "./public/wizard-schemas";
import {
  appointmentIdSchema,
  appointmentSchema,
  appointmentStatusSchema,
  appointmentStatusUpdateSchema,
  availabilityQuerySchema,
  availabilityRuleSchema,
  cancelAppointmentSchema,
  listAppointmentsQuerySchema,
  publicBookingSchema,
  rescheduleAppointmentSchema,
} from "./schemas";
import type {
  AppointmentDetailDTO,
  AppointmentListItemDTO,
  AppointmentPanelCapabilitiesDTO,
  AvailabilityRuleDTO,
  AvailabilitySlotDTO,
  PaginatedAppointmentsDTO,
  PublicBookingResultDTO,
  RescheduleAppointmentResultDTO,
  WorkspaceAppointmentResultDTO,
} from "./types";
import {
  hasCompanyPermission,
} from "@/lib/permissions/company-permissions";
import type { CompanyRole } from "@/lib/tenancy/context";

const APPOINTMENT_LIST_SELECT =
  "*, services(name, price, duration_minutes), customers(full_name, phone, email)";

export function resolveAppointmentPanelCapabilities(
  role: CompanyRole,
): AppointmentPanelCapabilitiesDTO {
  return {
    canRead: hasCompanyPermission(role, "scheduling:read"),
    canManage: hasCompanyPermission(role, "scheduling:manage"),
    canConfigure: hasCompanyPermission(role, "scheduling:configure"),
  };
}

function applyAppointmentListFilters(query: any, input: ReturnType<typeof listAppointmentsQuerySchema.parse>) {
  const viewRange = resolvePanelViewRange({
    view: input.view,
    anchorDate: input.anchorDate,
  });
  const fromDate = input.from ?? viewRange?.from;
  const toDate = input.to ?? viewRange?.to;

  if (fromDate) {
    query = query.gte("starts_at", `${fromDate}T00:00:00.000Z`);
  }
  if (toDate) {
    query = query.lt("starts_at", `${addDaysToDateString(toDate, 1)}T00:00:00.000Z`);
  }

  const nowIso = new Date().toISOString();
  if (input.timeframe === "upcoming") {
    query = query.gte("starts_at", nowIso);
  } else if (input.timeframe === "past") {
    query = query.lt("starts_at", nowIso);
  }

  if (input.status?.length) {
    query = query.in("status", input.status);
  }
  if (input.serviceId) {
    query = query.eq("service_id", input.serviceId);
  }
  if (input.customerId) {
    query = query.eq("customer_id", input.customerId);
  }
  if (input.q) {
    const term = sanitizeSearchTerm(input.q);
    if (term) {
      query = query.or(
        `objective.ilike.%${term}%,customer_notes.ilike.%${term}%,internal_notes.ilike.%${term}%,cancellation_reason.ilike.%${term}%`,
      );
    }
  }

  if (input.sort === "starts_at_desc") {
    query = query.order("starts_at", { ascending: false });
  } else if (input.sort === "created_at_desc") {
    query = query.order("created_at", { ascending: false });
  } else {
    query = query.order("starts_at", { ascending: true });
  }

  return query;
}

export async function listAppointmentsPaginated(
  input: unknown,
): Promise<PaginatedAppointmentsDTO> {
  const value = listAppointmentsQuerySchema.parse(input ?? {});
  const { companyId, supabase } = await authenticatedContext("scheduling:read");

  const from = (value.page - 1) * value.pageSize;
  const to = from + value.pageSize - 1;

  let query = supabase
    .from("appointments")
    .select(APPOINTMENT_LIST_SELECT, { count: "exact" })
    .eq("company_id", companyId)
    .is("deleted_at", null);

  query = applyAppointmentListFilters(query, value);

  const result = await query.range(from, to);
  if (result.error) throw new Error(result.error.message);

  const rows = (result.data ?? []) as unknown as AppointmentListRow[];
  let mapped = rows.map(mapAppointmentListItem);

  if (value.q) {
    const term = sanitizeSearchTerm(value.q).toLowerCase();
    if (term) {
      mapped = mapped.filter(
        (item) =>
          item.customerName.toLowerCase().includes(term) ||
          item.serviceName.toLowerCase().includes(term) ||
          (item.objective ?? "").toLowerCase().includes(term) ||
          (item.customerNotes ?? "").toLowerCase().includes(term) ||
          (item.internalNotes ?? "").toLowerCase().includes(term) ||
          (item.cancellationReason ?? "").toLowerCase().includes(term),
      );
    }
  }

  return {
    items: mapped,
    page: value.page,
    pageSize: value.pageSize,
    total: value.q ? mapped.length : (result.count ?? mapped.length),
    totalPages: Math.max(
      1,
      Math.ceil((value.q ? mapped.length : (result.count ?? mapped.length)) / value.pageSize),
    ),
  };
}

export async function getAppointment(idInput: unknown): Promise<AppointmentDetailDTO | null> {
  const id = appointmentIdSchema.parse(idInput);
  const { companyId, supabase } = await authenticatedContext("scheduling:read");

  const { data: row, error } = await supabase
    .from("appointments")
    .select(APPOINTMENT_LIST_SELECT)
    .eq("company_id", companyId)
    .eq("id", id)
    .is("deleted_at", null)
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!row) return null;

  const events = unwrap(
    await supabase
      .from("appointment_events")
      .select("id, event_type, from_status, to_status, payload, created_at")
      .eq("company_id", companyId)
      .eq("appointment_id", id)
      .order("created_at", { ascending: false }),
  );

  return mapAppointmentDetail(row as unknown as AppointmentListRow, events);
}

export async function listAppointments(
  input: { from?: string; to?: string } = {},
): Promise<AppointmentListItemDTO[]> {
  const result = await listAppointmentsPaginated({
    page: 1,
    pageSize: 100,
    from: input.from?.slice(0, 10),
    to: input.to?.slice(0, 10),
    sort: "starts_at_asc",
    timeframe: "all",
    view: "list",
  });
  return result.items;
}

export async function createAppointment(
  input: unknown,
): Promise<WorkspaceAppointmentResultDTO> {
  const value = appointmentSchema.parse(input);
  const { companyId, supabase } = await authenticatedContext("scheduling:manage");
  const idempotencyKey =
    value.idempotencyKey ??
    buildWorkspaceAppointmentIdempotencyKey({
      companyId,
      serviceId: value.serviceId,
      customerId: value.customerId,
      startsAt: value.startsAt,
    });
  const rows = unwrap(
    await supabase.rpc("create_workspace_appointment", {
      target_service_id: value.serviceId,
      target_customer_id: value.customerId,
      requested_starts_at: value.startsAt,
      internal_notes: value.notes ?? null,
      idempotency_key: idempotencyKey,
    }),
  ) as Array<{ appointment_id: string; appointment_status: string }>;
  const result = mapWorkspaceAppointmentResult(
    rows[0]
      ? {
          appointment_id: rows[0].appointment_id,
          appointment_status: appointmentStatusSchema.parse(rows[0].appointment_status),
        }
      : undefined,
  );
  if (!result) {
    throw new Error("Não foi possível criar o agendamento.");
  }
  return result;
}

export async function createPublicBooking(
  input: unknown,
): Promise<PublicBookingResultDTO> {
  const value = publicBookingSchema.parse(input);
  const supabase = await createClient();
  const idempotencyKey =
    value.idempotencyKey ??
    buildPublicBookingIdempotencyKey({
      companySlug: value.companySlug,
      serviceId: value.serviceId,
      startsAt: value.startsAt,
      customerPhone: value.customer.phone,
      customerName: value.customer.name,
    });
  const rows = unwrap(
    await supabase.rpc("create_public_appointment", {
      company_slug: value.companySlug,
      requested_service_id: value.serviceId,
      requested_starts_at: value.startsAt,
      customer_name: value.customer.name,
      customer_email: value.customer.email ?? null,
      customer_phone: value.customer.phone,
      customer_objective: value.objective ?? null,
      notes: value.notes ?? null,
      idempotency_key: idempotencyKey,
    }),
  ) as Array<{ appointment_id: string; appointment_status: string }>;
  const result = mapPublicBookingResult(
    rows[0]
      ? {
          appointment_id: rows[0].appointment_id,
          appointment_status: appointmentStatusSchema.parse(rows[0].appointment_status),
        }
      : undefined,
  );
  if (!result) {
    throw new Error("Não foi possível confirmar o agendamento.");
  }
  return result;
}

export async function updateAppointmentStatus(
  idInput: unknown,
  statusInput: unknown,
  options: { idempotencyKey?: string } = {},
): Promise<WorkspaceAppointmentResultDTO> {
  const parsed = appointmentStatusUpdateSchema.parse({
    id: idInput,
    status: statusInput,
    idempotencyKey: options.idempotencyKey,
  });
  const existing = await getAppointment(parsed.id);
  if (!existing) {
    throw new Error("Agendamento não encontrado.");
  }
  if (!canTransitionAppointmentStatus(existing.status, parsed.status)) {
    throw new Error("Transição de status não permitida.");
  }
  const { supabase } = await authenticatedContext("scheduling:manage");
  const idempotencyKey =
    parsed.idempotencyKey ??
    buildAppointmentStatusIdempotencyKey({
      appointmentId: parsed.id,
      status: parsed.status,
    });
  const rows = unwrap(
    await supabase.rpc("update_appointment_status_secure", {
      target_appointment_id: parsed.id,
      requested_status: parsed.status,
      idempotency_key: idempotencyKey,
    }),
  ) as Array<{ appointment_id: string; appointment_status: string }>;
  const result = mapWorkspaceAppointmentResult(
    rows[0]
      ? {
          appointment_id: rows[0].appointment_id,
          appointment_status: appointmentStatusSchema.parse(rows[0].appointment_status),
        }
      : undefined,
  );
  if (!result) {
    throw new Error("Não foi possível atualizar o agendamento.");
  }
  return result;
}

export async function cancelAppointment(
  input: unknown,
  options: { idempotencyKey?: string } = {},
): Promise<WorkspaceAppointmentResultDTO> {
  const value = cancelAppointmentSchema.parse({
    ...(typeof input === "object" && input ? input : { id: input }),
    idempotencyKey: options.idempotencyKey,
  });
  const { supabase } = await authenticatedContext("scheduling:manage");
  const idempotencyKey =
    value.idempotencyKey ??
    buildAppointmentStatusIdempotencyKey({
      appointmentId: value.id,
      status: "cancelled",
    });
  const rows = unwrap(
    await supabase.rpc("cancel_appointment_secure", {
      target_appointment_id: value.id,
      cancellation_reason: value.reason,
      idempotency_key: idempotencyKey,
    }),
  ) as Array<{ appointment_id: string; appointment_status: string }>;
  const result = mapWorkspaceAppointmentResult(
    rows[0]
      ? {
          appointment_id: rows[0].appointment_id,
          appointment_status: appointmentStatusSchema.parse(rows[0].appointment_status),
        }
      : undefined,
  );
  if (!result) {
    throw new Error("Não foi possível cancelar o agendamento.");
  }
  return result;
}

export async function rescheduleAppointment(
  input: unknown,
): Promise<RescheduleAppointmentResultDTO> {
  const value = rescheduleAppointmentSchema.parse(input);
  const { supabase } = await authenticatedContext("scheduling:manage");
  const idempotencyKey =
    value.idempotencyKey ??
    buildRescheduleIdempotencyKey({
      appointmentId: value.id,
      startsAt: value.startsAt,
    });
  const rows = unwrap(
    await supabase.rpc("reschedule_appointment_secure", {
      target_appointment_id: value.id,
      requested_starts_at: value.startsAt,
      idempotency_key: idempotencyKey,
    }),
  ) as Array<{
    appointment_id: string;
    appointment_status: string;
    starts_at: string;
    ends_at: string;
  }>;
  const result = mapRescheduleAppointmentResult(
    rows[0]
      ? {
          appointment_id: rows[0].appointment_id,
          appointment_status: appointmentStatusSchema.parse(rows[0].appointment_status),
          starts_at: rows[0].starts_at,
          ends_at: rows[0].ends_at,
        }
      : undefined,
  );
  if (!result) {
    throw new Error("Não foi possível reagendar o atendimento.");
  }
  return result;
}

export async function getWorkspaceRescheduleSlots(input: {
  serviceId: string;
  date: string;
}): Promise<AvailabilitySlotDTO[]> {
  const { companySlug } = await authenticatedContext("scheduling:manage");
  return getAvailableSlots({
    companySlug,
    serviceId: input.serviceId,
    date: input.date,
  });
}

export async function getAvailableSlots(input: unknown): Promise<AvailabilitySlotDTO[]> {
  const value = availabilityQuerySchema.parse(input);
  const supabase = await createClient();
  const rows = unwrap(
    await supabase.rpc("get_public_availability", {
      company_slug: value.companySlug,
      requested_service_id: value.serviceId,
      date_from: value.date,
      date_to: value.date,
    }),
  ) as Array<{ slot_start: string }>;
  return rows.map(mapAvailabilitySlot);
}

export async function getPublicAvailableDates(input: {
  companySlug: string;
  serviceId: string;
  dateFrom: string;
  dateTo: string;
  timezone: string;
  horizonDays: number;
}): Promise<string[]> {
  const value = publicAvailabilityRangeSchema.parse({
    companySlug: input.companySlug,
    serviceId: input.serviceId,
    dateFrom: input.dateFrom,
    dateTo: input.dateTo,
  });
  const bounds = getBookingDateBounds({
    timezone: input.timezone,
    horizonDays: input.horizonDays,
  });
  const clamped = clampAvailabilityRange({
    dateFrom: value.dateFrom,
    dateTo: value.dateTo,
    minDate: bounds.minDate,
    maxDate: bounds.maxDate,
  });
  if (!clamped) return [];

  const supabase = await createClient();
  const rows = unwrap(
    await supabase.rpc("get_public_availability", {
      company_slug: value.companySlug,
      requested_service_id: value.serviceId,
      date_from: clamped.dateFrom,
      date_to: clamped.dateTo,
    }),
  ) as Array<{ slot_start: string }>;

  return collectAvailableDatesFromSlots(rows, input.timezone);
}

export async function getAvailabilityRules(): Promise<AvailabilityRuleDTO[]> {
  const { companyId, supabase } = await authenticatedContext("scheduling:configure");
  const rows = unwrap(
    await supabase
      .from("business_hours")
      .select("*")
      .eq("company_id", companyId)
      .order("weekday")
      .order("start_time"),
  );
  return rows.map(mapAvailabilityRule);
}

export async function setAvailabilityRules(input: unknown): Promise<AvailabilityRuleDTO[]> {
  const rules = availabilityRuleSchema.array().max(28).parse(input);
  const { companyId, supabase } = await authenticatedContext("scheduling:configure");
  const rows = unwrap(
    await supabase.rpc("replace_business_hours", {
      target_company_id: companyId,
      rules: toBusinessHoursRulesPayload(rules),
    }),
  );
  return rows.map(mapAvailabilityRule);
}
