import { describe, expect, it } from "vitest";

import {
  addDaysToDateString,
  clampAvailabilityRange,
  collectAvailableDatesFromSlots,
  formatDateInTimezone,
  getBookingDateBounds,
  monthRange,
  slotToLocalDate,
} from "@/features/scheduling/public/available-dates";

describe("public available dates helpers", () => {
  it("formats dates in tenant timezone", () => {
    expect(formatDateInTimezone(new Date("2026-07-15T03:00:00.000Z"), "America/Sao_Paulo")).toBe(
      "2026-07-15",
    );
  });

  it("maps slot timestamps to local dates", () => {
    expect(slotToLocalDate("2026-07-15T14:00:00.000Z", "America/Sao_Paulo")).toBe("2026-07-15");
  });

  it("adds days to iso date strings", () => {
    expect(addDaysToDateString("2026-07-01", 14)).toBe("2026-07-15");
  });

  it("collects unique sorted dates from rpc slots", () => {
    expect(
      collectAvailableDatesFromSlots(
        [
          { slot_start: "2026-07-15T14:00:00.000Z" },
          { slot_start: "2026-07-15T17:00:00.000Z" },
          { slot_start: "2026-07-16T14:00:00.000Z" },
        ],
        "America/Sao_Paulo",
      ),
    ).toEqual(["2026-07-15", "2026-07-16"]);
  });

  it("clamps requested ranges to booking bounds", () => {
    expect(
      clampAvailabilityRange({
        dateFrom: "2026-06-01",
        dateTo: "2026-08-01",
        minDate: "2026-07-01",
        maxDate: "2026-07-31",
      }),
    ).toEqual({ dateFrom: "2026-07-01", dateTo: "2026-07-31" });

    expect(
      clampAvailabilityRange({
        dateFrom: "2026-08-01",
        dateTo: "2026-08-31",
        minDate: "2026-07-01",
        maxDate: "2026-07-31",
      }),
    ).toBeNull();
  });

  it("computes booking bounds from horizon days", () => {
    const bounds = getBookingDateBounds({
      timezone: "UTC",
      horizonDays: 7,
      now: new Date("2026-07-01T12:00:00.000Z"),
    });
    expect(bounds).toEqual({ minDate: "2026-07-01", maxDate: "2026-07-08" });
  });

  it("builds month ranges", () => {
    expect(monthRange(2026, 7)).toEqual({
      dateFrom: "2026-07-01",
      dateTo: "2026-07-31",
    });
  });
});
