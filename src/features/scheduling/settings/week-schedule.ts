import type { AvailabilityRuleDTO } from "../types";
import type { TimeIntervalDTO, WeekScheduleDTO } from "./types";

export const WEEKDAY_LABELS = [
  "Domingo",
  "Segunda",
  "Terça",
  "Quarta",
  "Quinta",
  "Sexta",
  "Sábado",
] as const;

export function createEmptyWeekSchedule(timezone: string): WeekScheduleDTO {
  return {
    timezone,
    days: WEEKDAY_LABELS.map((label, weekday) => ({
      weekday,
      label,
      enabled: weekday >= 1 && weekday <= 5,
      intervals:
        weekday >= 1 && weekday <= 5
          ? [{ startTime: "09:00", endTime: "18:00" }]
          : [],
    })),
  };
}

export function mapRulesToWeekSchedule(
  rules: AvailabilityRuleDTO[],
  timezone: string,
): WeekScheduleDTO {
  const base = createEmptyWeekSchedule(timezone);

  return {
    timezone,
    days: base.days.map((day) => {
      const dayRules = rules.filter(
        (rule) => rule.weekday === day.weekday && rule.enabled,
      );
      if (!dayRules.length) {
        return { ...day, enabled: false, intervals: [] };
      }
      return {
        ...day,
        enabled: true,
        intervals: dayRules.map((rule) => ({
          startTime: rule.startTime.slice(0, 5),
          endTime: rule.endTime.slice(0, 5),
        })),
      };
    }),
  };
}

export function mapWeekScheduleToRules(
  week: WeekScheduleDTO,
): Array<{
  weekday: number;
  startTime: string;
  endTime: string;
  enabled: boolean;
}> {
  const rules: Array<{
    weekday: number;
    startTime: string;
    endTime: string;
    enabled: boolean;
  }> = [];

  for (const day of week.days) {
    if (!day.enabled) continue;
    for (const interval of day.intervals) {
      rules.push({
        weekday: day.weekday,
        startTime: interval.startTime,
        endTime: interval.endTime,
        enabled: true,
      });
    }
  }

  return rules;
}

export function hasOverlappingIntervals(intervals: TimeIntervalDTO[]): boolean {
  const sorted = [...intervals].sort((left, right) =>
    left.startTime.localeCompare(right.startTime),
  );

  for (let index = 1; index < sorted.length; index += 1) {
    const previous = sorted[index - 1];
    const current = sorted[index];
    if (current && previous && current.startTime < previous.endTime) {
      return true;
    }
  }

  return false;
}
