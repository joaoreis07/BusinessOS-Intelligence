"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import {
  cancelAppointment,
  getAppointment,
  getWorkspaceRescheduleSlots,
  rescheduleAppointment,
  updateAppointmentStatus,
} from "@/features/scheduling";
import {
  appointmentIdSchema,
  appointmentStatusSchema,
  cancelAppointmentSchema,
  rescheduleAppointmentSchema,
} from "@/features/scheduling/schemas";
import { toSafeError } from "@/lib/errors/app-error";

export type AgendaActionState = {
  error?: string;
  success?: string;
};

const rescheduleSlotsActionSchema = z.object({
  serviceId: z.uuid(),
  date: z.iso.date(),
});

const updateStatusActionSchema = z.object({
  id: appointmentIdSchema,
  status: appointmentStatusSchema,
});

export async function getAppointmentDetailAction(id: unknown) {
  try {
    const detail = await getAppointment(id);
    if (!detail) return { data: null, error: "Agendamento não encontrado." };
    return { data: detail, error: undefined };
  } catch {
    return { data: null, error: "Não foi possível carregar o agendamento." };
  }
}

export async function getRescheduleSlotsAction(input: unknown) {
  try {
    const value = rescheduleSlotsActionSchema.parse(input);
    const slots = await getWorkspaceRescheduleSlots({
      serviceId: value.serviceId,
      date: value.date,
    });
    return { data: slots.map((slot) => slot.startsAt), error: undefined };
  } catch {
    return { data: [], error: "Não foi possível carregar horários." };
  }
}

export async function updateAppointmentStatusAction(
  input: unknown,
): Promise<AgendaActionState> {
  try {
    const value = updateStatusActionSchema.parse(input);
    await updateAppointmentStatus(value.id, value.status);
    revalidatePath("/dashboard/agenda");
    revalidatePath("/dashboard");
    return { success: "Status atualizado." };
  } catch (error) {
    return { error: toSafeError(error).message };
  }
}

export async function cancelAppointmentAction(input: unknown): Promise<AgendaActionState> {
  try {
    const value = cancelAppointmentSchema.parse(input);
    await cancelAppointment(value);
    revalidatePath("/dashboard/agenda");
    revalidatePath("/dashboard");
    return { success: "Agendamento cancelado." };
  } catch (error) {
    return { error: toSafeError(error).message };
  }
}

export async function rescheduleAppointmentAction(input: unknown): Promise<AgendaActionState> {
  try {
    const value = rescheduleAppointmentSchema.parse(input);
    await rescheduleAppointment(value);
    revalidatePath("/dashboard/agenda");
    revalidatePath("/dashboard");
    return { success: "Agendamento reagendado." };
  } catch (error) {
    return { error: toSafeError(error).message };
  }
}
