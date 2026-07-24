import { describe, expect, it } from "vitest";
import {
  mapBlockedPeriod,
  mapSchedulingConfiguration,
  mapSchedulingPreferences,
  mapSchedulingSettings,
} from "@/features/scheduling/settings/mappers";
import {
  createEmptyWeekSchedule,
  hasOverlappingIntervals,
  mapRulesToWeekSchedule,
  mapWeekScheduleToRules,
} from "@/features/scheduling/settings/week-schedule";

describe("scheduling settings mappers", () => {
  it("maps company settings and preferences", () => {
    const settings = mapSchedulingSettings({
      timezone: "America/Sao_Paulo",
      booking_enabled: true,
      booking_flow: "instant_confirmation",
      booking_min_notice_minutes: 60,
      booking_interval_minutes: 30,
      booking_horizon_days: 45,
      max_appointments_per_day: 8,
      scheduling_preferences: {
        allowCancellation: false,
        allowReschedule: true,
        requireObjective: true,
        requireNotes: false,
      },
    });

    expect(settings.preferences.allowCancellation).toBe(false);
    expect(settings.horizonDays).toBe(45);
  });

  it("falls back to default preferences for invalid json", () => {
    expect(mapSchedulingPreferences("invalid")).toMatchObject({
      allowCancellation: true,
      allowReschedule: true,
    });
  });

  it("maps blocked periods with metadata", () => {
    const blocked = mapBlockedPeriod({
      id: "770e8400-e29b-41d4-a716-446655440002",
      starts_at: "2026-07-15T10:00:00.000Z",
      ends_at: "2026-07-15T18:00:00.000Z",
      reason: "Férias",
      all_day: true,
      block_type: "vacation",
      recurrence_rule: null,
      scope: { professionalId: null },
    });

    expect(blocked.blockType).toBe("vacation");
    expect(blocked.scope).toEqual({ professionalId: null });
  });

  it("maps full scheduling configuration", () => {
    const configuration = mapSchedulingConfiguration({
      settings: {
        timezone: "America/Sao_Paulo",
        booking_enabled: true,
        booking_flow: "manual_approval",
        booking_min_notice_minutes: 120,
        booking_interval_minutes: 30,
        booking_horizon_days: 90,
        max_appointments_per_day: null,
        scheduling_preferences: {},
      },
      rules: [
        {
          id: "1",
          weekday: 1,
          startTime: "09:00:00",
          endTime: "12:00:00",
          enabled: true,
        },
        {
          id: "2",
          weekday: 1,
          startTime: "14:00:00",
          endTime: "18:00:00",
          enabled: true,
        },
      ],
      blockedPeriods: [],
    });

    expect(configuration.weekSchedule.days[1]?.intervals).toHaveLength(2);
  });
});

describe("week schedule helpers", () => {
  it("creates a default week with weekdays enabled", () => {
    const week = createEmptyWeekSchedule("America/Sao_Paulo");
    expect(week.days).toHaveLength(7);
    expect(week.days[1]?.enabled).toBe(true);
    expect(week.days[0]?.enabled).toBe(false);
  });

  it("maps rules back to replace_business_hours payload", () => {
    const week = mapRulesToWeekSchedule(
      [
        {
          id: "1",
          weekday: 2,
          startTime: "10:00:00",
          endTime: "12:00:00",
          enabled: true,
        },
      ],
      "America/Sao_Paulo",
    );

    const rules = mapWeekScheduleToRules(week);
    expect(rules).toEqual([
      {
        weekday: 2,
        startTime: "10:00",
        endTime: "12:00",
        enabled: true,
      },
    ]);
  });

  it("detects overlapping intervals", () => {
    expect(
      hasOverlappingIntervals([
        { startTime: "09:00", endTime: "12:00" },
        { startTime: "11:30", endTime: "13:00" },
      ]),
    ).toBe(true);
  });
});
