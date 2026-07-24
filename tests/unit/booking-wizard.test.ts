import { describe, expect, it } from "vitest";

import { BOOKING_WIZARD_STEPS } from "@/features/scheduling/public/wizard-types";

describe("booking wizard flow", () => {
  it("defines five progressive steps", () => {
    expect(BOOKING_WIZARD_STEPS).toEqual([
      "service",
      "date",
      "time",
      "customer",
      "confirm",
    ]);
  });

  it("starts with service selection and ends with confirmation", () => {
    expect(BOOKING_WIZARD_STEPS[0]).toBe("service");
    expect(BOOKING_WIZARD_STEPS.at(-1)).toBe("confirm");
  });
});
