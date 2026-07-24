import { describe, expect, it } from "vitest";
import {
  blockedPeriodSchema,
  schedulingSettingsSchema,
  timeIntervalSchema,
  weekScheduleInputSchema,
  weekdayScheduleSchema,
} from "@/features/scheduling/settings/schemas";

describe("scheduling settings schemas", () => {
  describe("timeIntervalSchema", () => {
    it("rejects end time before start time", () => {
      expect(() =>
        timeIntervalSchema.parse({ startTime: "18:00", endTime: "09:00" }),
      ).toThrow();
    });
  });

  describe("weekdayScheduleSchema", () => {
    it("rejects overlapping intervals on the same day", () => {
      expect(() =>
        weekdayScheduleSchema.parse({
          weekday: 1,
          enabled: true,
          intervals: [
            { startTime: "09:00", endTime: "12:00" },
            { startTime: "11:00", endTime: "13:00" },
          ],
        }),
      ).toThrow();
    });

    it("allows disabled days without intervals", () => {
      const parsed = weekdayScheduleSchema.parse({
        weekday: 0,
        enabled: false,
        intervals: [],
      });
      expect(parsed.enabled).toBe(false);
    });
  });

  describe("weekScheduleInputSchema", () => {
    it("requires seven weekdays", () => {
      expect(() =>
        weekScheduleInputSchema.parse({
          days: [{ weekday: 1, enabled: true, intervals: [{ startTime: "09:00", endTime: "18:00" }] }],
        }),
      ).toThrow();
    });
  });

  describe("schedulingSettingsSchema", () => {
    it("accepts valid general settings", () => {
      const parsed = schedulingSettingsSchema.parse({
        bookingEnabled: true,
        bookingFlow: "manual_approval",
        minNoticeMinutes: 120,
        intervalMinutes: 30,
        horizonDays: 90,
        maxAppointmentsPerDay: 12,
        preferences: {
          allowCancellation: true,
          allowReschedule: true,
          requireObjective: false,
          requireNotes: false,
        },
      });

      expect(parsed.bookingFlow).toBe("manual_approval");
    });
  });

  describe("blockedPeriodSchema", () => {
    it("rejects invalid date ranges", () => {
      expect(() =>
        blockedPeriodSchema.parse({
          startsAt: "2026-07-16T10:00:00.000Z",
          endsAt: "2026-07-15T10:00:00.000Z",
          blockType: "holiday",
        }),
      ).toThrow();
    });
  });
});
