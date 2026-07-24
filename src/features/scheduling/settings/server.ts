"use server";

import "server-only";

import type { Json } from "@/types/database.generated";
import { AppError } from "@/lib/errors/app-error";

import { authenticatedContext, unwrap } from "../../_shared/server";
import { mapAvailabilityRule, toBusinessHoursRulesPayload } from "../mappers";
import type { AvailabilityRuleDTO } from "../types";
import {
  mapBlockedPeriod,
  mapSchedulingConfiguration,
  mapSchedulingSettings,
  toSchedulingSettingsPayload,
} from "./mappers";
import {
  blockedPeriodIdSchema,
  blockedPeriodSchema,
  schedulingSettingsSchema,
  weekScheduleInputSchema,
  type BookingFlow,
} from "./schemas";
import type {
  BlockedPeriodDTO,
  SchedulingConfigurationDTO,
  SchedulingSettingsDTO,
} from "./types";
import { mapWeekScheduleToRules, WEEKDAY_LABELS } from "./week-schedule";

type BlockedPeriodRow = {
  id: string;
  starts_at: string;
  ends_at: string;
  reason: string | null;
  all_day: boolean;
  block_type: string;
  recurrence_rule: Json | null;
  scope: Json;
};

type CompanySettingsRow = {
  timezone: string;
  booking_enabled: boolean;
  booking_flow: BookingFlow;
  booking_min_notice_minutes: number;
  booking_interval_minutes: number;
  booking_horizon_days: number;
  max_appointments_per_day: number | null;
  scheduling_preferences?: Json | null;
};

async function schedulingConfigureContext() {
  const context = await authenticatedContext("scheduling:configure");
  const company = unwrap(
    await context.supabase
      .from("companies")
      .select("active, status")
      .eq("id", context.companyId)
      .single(),
    "Empresa não encontrada.",
  );

  if (!company.active || !["trial", "active"].includes(company.status)) {
    throw new AppError("FORBIDDEN", "A empresa precisa estar ativa para configurar o agendamento.", 403);
  }

  return context;
}

export async function getSchedulingConfiguration(): Promise<SchedulingConfigurationDTO> {
  const { companyId, supabase } = await schedulingConfigureContext();
  const [settings, rules, blockedPeriods] = await Promise.all([
    unwrap(
      await supabase
        .from("company_settings")
        .select(
          "timezone, booking_enabled, booking_flow, booking_min_notice_minutes, booking_interval_minutes, booking_horizon_days, max_appointments_per_day, scheduling_preferences",
        )
        .eq("company_id", companyId)
        .single(),
      "Configurações de agendamento não encontradas.",
    ),
    unwrap(
      await supabase
        .from("business_hours")
        .select("*")
        .eq("company_id", companyId)
        .order("weekday")
        .order("start_time"),
    ),
    unwrap(
      await supabase
        .from("blocked_periods")
        .select("id, starts_at, ends_at, reason, all_day, block_type, recurrence_rule, scope")
        .eq("company_id", companyId)
        .is("deleted_at", null)
        .order("starts_at"),
    ),
  ]);

  return mapSchedulingConfiguration({
    settings: settings as CompanySettingsRow,
    rules: rules.map(mapAvailabilityRule),
    blockedPeriods: blockedPeriods as BlockedPeriodRow[],
  });
}

export async function saveWeekSchedule(input: unknown): Promise<AvailabilityRuleDTO[]> {
  const parsed = weekScheduleInputSchema.parse(input);
  const { companyId, supabase } = await schedulingConfigureContext();
  const rules = mapWeekScheduleToRules({
    timezone: parsed.timezone ?? "America/Sao_Paulo",
    days: parsed.days.map((day, index) => ({
      weekday: day.weekday,
      label: WEEKDAY_LABELS[day.weekday] ?? `Dia ${index}`,
      enabled: day.enabled,
      intervals: day.intervals,
    })),
  });
  const rows = unwrap(
    await supabase.rpc("replace_business_hours", {
      target_company_id: companyId,
      rules: toBusinessHoursRulesPayload(rules),
    }),
  );
  return rows.map(mapAvailabilityRule);
}

export async function updateSchedulingSettings(
  input: unknown,
): Promise<SchedulingSettingsDTO> {
  const value = schedulingSettingsSchema.parse(input);
  const { companyId, supabase } = await schedulingConfigureContext();
  const row = unwrap(
    await supabase.rpc("update_scheduling_settings", {
      target_company_id: companyId,
      settings: toSchedulingSettingsPayload(value),
    }),
  );
  return mapSchedulingSettings(row);
}

export async function listBlockedPeriods(): Promise<BlockedPeriodDTO[]> {
  const { companyId, supabase } = await schedulingConfigureContext();
  const rows = unwrap(
    await supabase
      .from("blocked_periods")
      .select("id, starts_at, ends_at, reason, all_day, block_type, recurrence_rule, scope")
      .eq("company_id", companyId)
      .is("deleted_at", null)
      .order("starts_at"),
  );
  return rows.map((row) => mapBlockedPeriod(row as BlockedPeriodRow));
}

export async function createBlockedPeriod(input: unknown): Promise<BlockedPeriodDTO> {
  const value = blockedPeriodSchema.parse(input);
  const { companyId, supabase, user } = await schedulingConfigureContext();
  const row = unwrap(
    await supabase
      .from("blocked_periods")
      .insert({
        company_id: companyId,
        starts_at: value.startsAt,
        ends_at: value.endsAt,
        reason: value.reason ?? null,
        all_day: value.allDay,
        block_type: value.blockType,
        recurrence_rule: (value.recurrenceRule ?? null) as Json,
        scope: (value.scope ?? {}) as Json,
        created_by: user.id,
      })
      .select("id, starts_at, ends_at, reason, all_day, block_type, recurrence_rule, scope")
      .single(),
  );
  return mapBlockedPeriod(row as BlockedPeriodRow);
}

export async function deleteBlockedPeriod(idInput: unknown): Promise<void> {
  const id = blockedPeriodIdSchema.parse(idInput);
  const { companyId, supabase } = await schedulingConfigureContext();
  unwrap(
    await supabase
      .from("blocked_periods")
      .update({ deleted_at: new Date().toISOString() })
      .eq("company_id", companyId)
      .eq("id", id)
      .select("id")
      .single(),
  );
}
