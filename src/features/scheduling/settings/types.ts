import type { BlockedPeriodType, BookingFlow, SchedulingPreferences } from "./schemas";

export type TimeIntervalDTO = {
  startTime: string;
  endTime: string;
};

export type WeekdayScheduleDTO = {
  weekday: number;
  label: string;
  enabled: boolean;
  intervals: TimeIntervalDTO[];
};

export type WeekScheduleDTO = {
  days: WeekdayScheduleDTO[];
  timezone: string;
};

export type BlockedPeriodDTO = {
  id: string;
  startsAt: string;
  endsAt: string;
  reason: string | null;
  allDay: boolean;
  blockType: BlockedPeriodType;
  recurrenceRule: Record<string, unknown> | null;
  scope: Record<string, unknown>;
};

export type SchedulingSettingsDTO = {
  bookingEnabled: boolean;
  bookingFlow: BookingFlow;
  minNoticeMinutes: number;
  intervalMinutes: number;
  horizonDays: number;
  maxAppointmentsPerDay: number | null;
  preferences: SchedulingPreferences;
  timezone: string;
};

export type SchedulingConfigurationDTO = {
  weekSchedule: WeekScheduleDTO;
  blockedPeriods: BlockedPeriodDTO[];
  settings: SchedulingSettingsDTO;
};
