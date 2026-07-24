import type { Json } from "@/types/database.generated";
import type { AvailabilityRuleDTO } from "../types";
import {
  schedulingPreferencesSchema,
  type BlockedPeriodType,
  type BookingFlow,
} from "./schemas";
import type {
  BlockedPeriodDTO,
  SchedulingConfigurationDTO,
  SchedulingSettingsDTO,
  WeekScheduleDTO,
} from "./types";
import { mapRulesToWeekSchedule } from "./week-schedule";

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

function parseObject(value: Json | null | undefined): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {};
  }
  return value as Record<string, unknown>;
}

export function mapSchedulingPreferences(
  value: Json | null | undefined,
): SchedulingSettingsDTO["preferences"] {
  const parsed = schedulingPreferencesSchema.safeParse({
    allowCancellation: true,
    allowReschedule: true,
    requireObjective: false,
    requireNotes: false,
    defaultDurationMinutes: null,
    ...parseObject(value),
  });

  if (parsed.success) return parsed.data;

  return {
    allowCancellation: true,
    allowReschedule: true,
    requireObjective: false,
    requireNotes: false,
    defaultDurationMinutes: null,
  };
}

export function mapSchedulingSettings(row: CompanySettingsRow): SchedulingSettingsDTO {
  return {
    bookingEnabled: row.booking_enabled,
    bookingFlow: row.booking_flow,
    minNoticeMinutes: row.booking_min_notice_minutes,
    intervalMinutes: row.booking_interval_minutes,
    horizonDays: row.booking_horizon_days,
    maxAppointmentsPerDay: row.max_appointments_per_day,
    preferences: mapSchedulingPreferences(row.scheduling_preferences),
    timezone: row.timezone,
  };
}

export function mapBlockedPeriod(row: BlockedPeriodRow): BlockedPeriodDTO {
  return {
    id: row.id,
    startsAt: row.starts_at,
    endsAt: row.ends_at,
    reason: row.reason,
    allDay: row.all_day,
    blockType: row.block_type as BlockedPeriodType,
    recurrenceRule:
      row.recurrence_rule && typeof row.recurrence_rule === "object" && !Array.isArray(row.recurrence_rule)
        ? (row.recurrence_rule as Record<string, unknown>)
        : null,
    scope: parseObject(row.scope),
  };
}

export function mapSchedulingConfiguration(input: {
  settings: CompanySettingsRow;
  rules: AvailabilityRuleDTO[];
  blockedPeriods: BlockedPeriodRow[];
}): SchedulingConfigurationDTO {
  const settings = mapSchedulingSettings(input.settings);
  const weekSchedule: WeekScheduleDTO = mapRulesToWeekSchedule(
    input.rules,
    settings.timezone,
  );

  return {
    weekSchedule,
    blockedPeriods: input.blockedPeriods.map(mapBlockedPeriod),
    settings,
  };
}

export function toSchedulingSettingsPayload(
  settings: Pick<
    SchedulingSettingsDTO,
    | "bookingEnabled"
    | "bookingFlow"
    | "minNoticeMinutes"
    | "intervalMinutes"
    | "horizonDays"
    | "maxAppointmentsPerDay"
    | "preferences"
  >,
) {
  return {
    bookingEnabled: settings.bookingEnabled,
    bookingFlow: settings.bookingFlow,
    minNoticeMinutes: settings.minNoticeMinutes,
    intervalMinutes: settings.intervalMinutes,
    horizonDays: settings.horizonDays,
    maxAppointmentsPerDay: settings.maxAppointmentsPerDay,
    preferences: settings.preferences,
  };
}

export const BLOCKED_PERIOD_TYPE_LABELS: Record<BlockedPeriodType, string> = {
  vacation: "Férias",
  holiday: "Feriado",
  maintenance: "Manutenção",
  meeting: "Reunião",
  temporary: "Bloqueio temporário",
  custom: "Personalizado",
};
