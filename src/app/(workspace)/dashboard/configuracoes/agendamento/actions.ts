"use server";

import { revalidatePath } from "next/cache";
import {
  createBlockedPeriod,
  deleteBlockedPeriod,
  saveWeekSchedule,
  updateSchedulingSettings,
} from "@/features/scheduling/settings/server";
import { toSafeError } from "@/lib/errors/app-error";

export type SchedulingSettingsActionState = {
  error?: string;
  success?: string;
};

export async function saveWeekScheduleAction(
  _: SchedulingSettingsActionState,
  input: unknown,
): Promise<SchedulingSettingsActionState> {
  try {
    await saveWeekSchedule(input);
    revalidatePath("/dashboard/configuracoes/agendamento");
    return { success: "Horários de funcionamento salvos." };
  } catch (error) {
    return { error: toSafeError(error).message };
  }
}

export async function saveSchedulingSettingsAction(
  _: SchedulingSettingsActionState,
  input: unknown,
): Promise<SchedulingSettingsActionState> {
  try {
    await updateSchedulingSettings(input);
    revalidatePath("/dashboard/configuracoes/agendamento");
    return { success: "Configurações gerais salvas." };
  } catch (error) {
    return { error: toSafeError(error).message };
  }
}

export async function createBlockedPeriodAction(
  _: SchedulingSettingsActionState,
  input: unknown,
): Promise<SchedulingSettingsActionState> {
  try {
    await createBlockedPeriod(input);
    revalidatePath("/dashboard/configuracoes/agendamento");
    return { success: "Bloqueio adicionado." };
  } catch (error) {
    return { error: toSafeError(error).message };
  }
}

export async function deleteBlockedPeriodAction(
  _: SchedulingSettingsActionState,
  id: string,
): Promise<SchedulingSettingsActionState> {
  try {
    await deleteBlockedPeriod(id);
    revalidatePath("/dashboard/configuracoes/agendamento");
    return { success: "Bloqueio removido." };
  } catch (error) {
    return { error: toSafeError(error).message };
  }
}
