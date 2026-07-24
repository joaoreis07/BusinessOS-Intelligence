"use server";

import {
  buildPublicBookingActionSchema,
  createPublicBooking,
  getAvailableSlots,
  getPublicAvailableDates,
  publicAvailabilityActionSchema,
  publicAvailableDatesActionSchema,
  resolvePublicBookingWizard,
} from "@/features/scheduling";
import { buildPublicBookingIdempotencyKey } from "@/features/scheduling/idempotency";
import { toSafeError } from "@/lib/errors/app-error";
import { normalizePhoneToE164 } from "@/lib/utils";

export async function getPublicAvailableDatesAction(input: unknown) {
  try {
    const value = publicAvailableDatesActionSchema.parse(input);
    const wizard = await resolvePublicBookingWizard(value.slug);
    if (!wizard?.scheduling.bookingEnabled) {
      return { data: [], error: "Agendamento indisponível no momento." };
    }

    const dates = await getPublicAvailableDates({
      companySlug: value.slug,
      serviceId: value.serviceId,
      dateFrom: value.dateFrom,
      dateTo: value.dateTo,
      timezone: wizard.scheduling.timezone,
      horizonDays: wizard.scheduling.horizonDays,
    });

    return { data: dates, error: undefined };
  } catch {
    return { data: [], error: "Não foi possível carregar as datas disponíveis." };
  }
}

export async function getPublicAvailabilityAction(input: unknown) {
  try {
    const value = publicAvailabilityActionSchema.parse(input);
    const wizard = await resolvePublicBookingWizard(value.slug);
    if (!wizard?.scheduling.bookingEnabled) {
      return { data: [], error: "Agendamento indisponível no momento." };
    }

    const slots = await getAvailableSlots({
      companySlug: value.slug,
      serviceId: value.serviceId,
      date: value.date,
    });

    return {
      data: slots.map((slot) => slot.startsAt),
      error: undefined,
    };
  } catch {
    return { data: [], error: "Não foi possível carregar os horários." };
  }
}

export async function createPublicAppointmentAction(input: unknown) {
  try {
    const slug =
      typeof input === "object" && input && "slug" in input
        ? String((input as { slug: unknown }).slug)
        : "";
    const wizard = await resolvePublicBookingWizard(slug);
    if (!wizard?.scheduling.bookingEnabled) {
      return { success: false, error: "Agendamento indisponível no momento." };
    }

    const schema = buildPublicBookingActionSchema(wizard.scheduling.preferences);
    const value = schema.parse(input);
    const customerPhone = normalizePhoneToE164(value.customerPhone);
    const idempotencyKey =
      value.idempotencyKey ??
      buildPublicBookingIdempotencyKey({
        companySlug: value.slug,
        serviceId: value.serviceId,
        startsAt: value.startsAt,
        customerPhone,
        customerName: value.customerName,
      });

    const result = await createPublicBooking({
      companySlug: value.slug,
      serviceId: value.serviceId,
      startsAt: value.startsAt,
      customer: {
        name: value.customerName,
        phone: customerPhone,
        email: value.customerEmail,
      },
      objective: value.objective ?? null,
      notes: value.notes ?? null,
      idempotencyKey,
    });

    return { success: true, appointmentId: result.appointmentId, status: result.status };
  } catch (error) {
    return { success: false, error: toSafeError(error).message };
  }
}
