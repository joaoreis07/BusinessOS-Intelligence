import { describe, expect, it } from "vitest";

import {
  APPOINTMENT_STATUS_LABELS,
  APPOINTMENT_STATUS_TRANSITIONS,
  canTransitionAppointmentStatus,
  getAllowedNextStatuses,
} from "@/features/scheduling/panel/status";

describe("appointment status flow", () => {
  it("labels all typed statuses including in_progress", () => {
    expect(APPOINTMENT_STATUS_LABELS.in_progress).toBe("Em atendimento");
    expect(Object.keys(APPOINTMENT_STATUS_LABELS)).toHaveLength(6);
  });

  it("allows pending to confirmed and cancelled", () => {
    expect(canTransitionAppointmentStatus("pending", "confirmed")).toBe(true);
    expect(canTransitionAppointmentStatus("pending", "completed")).toBe(false);
  });

  it("allows confirmed to in_progress and terminal states", () => {
    expect(getAllowedNextStatuses("confirmed")).toEqual([
      "in_progress",
      "completed",
      "cancelled",
      "no_show",
    ]);
  });

  it("blocks transitions from terminal statuses", () => {
    expect(APPOINTMENT_STATUS_TRANSITIONS.completed).toEqual([]);
    expect(canTransitionAppointmentStatus("cancelled", "confirmed")).toBe(false);
  });
});
