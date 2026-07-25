import { describe, expect, it } from "vitest";

import {
  buildPublicBookingActionSchema,
  buildPublicCustomerFieldsSchema,
  publicAvailabilityRangeSchema,
} from "@/features/scheduling/public/wizard-schemas";

const SERVICE_ID = "660e8400-e29b-41d4-a716-446655440001";

describe("public booking wizard schemas", () => {
  describe("publicAvailabilityRangeSchema", () => {
    it("accepts ranges up to 31 days", () => {
      expect(
        publicAvailabilityRangeSchema.parse({
          companySlug: "clinica-saude",
          serviceId: SERVICE_ID,
          dateFrom: "2026-07-01",
          dateTo: "2026-07-31",
        }),
      ).toMatchObject({ dateFrom: "2026-07-01" });
    });

    it("accepts demo seed service ids that are not RFC uuid v4", () => {
      expect(
        publicAvailabilityRangeSchema.parse({
          companySlug: "vitta-demo",
          serviceId: "30000000-0000-0000-0000-000000000001",
          dateFrom: "2026-07-24",
          dateTo: "2026-07-31",
        }),
      ).toMatchObject({ serviceId: "30000000-0000-0000-0000-000000000001" });
    });

    it("rejects ranges longer than 31 days", () => {
      expect(() =>
        publicAvailabilityRangeSchema.parse({
          companySlug: "clinica-saude",
          serviceId: SERVICE_ID,
          dateFrom: "2026-07-01",
          dateTo: "2026-08-05",
        }),
      ).toThrow();
    });
  });

  describe("buildPublicCustomerFieldsSchema", () => {
    it("requires email and optional notes by default", () => {
      const parsed = buildPublicCustomerFieldsSchema().parse({
        customerName: "Maria Silva",
        customerPhone: "11999999999",
        customerEmail: "maria@example.com",
        notes: null,
      });
      expect(parsed.customerEmail).toBe("maria@example.com");
    });

    it("requires objective when configured", () => {
      expect(() =>
        buildPublicCustomerFieldsSchema({ requireObjective: true }).parse({
          customerName: "Maria Silva",
          customerPhone: "11999999999",
          customerEmail: "maria@example.com",
          objective: null,
        }),
      ).toThrow();
    });

    it("requires notes when configured", () => {
      expect(() =>
        buildPublicCustomerFieldsSchema({ requireNotes: true }).parse({
          customerName: "Maria Silva",
          customerPhone: "11999999999",
          customerEmail: "maria@example.com",
          notes: null,
        }),
      ).toThrow();
    });
  });

  describe("buildPublicBookingActionSchema", () => {
    it("validates booking payload with service and slot", () => {
      const parsed = buildPublicBookingActionSchema().parse({
        slug: "clinica-saude",
        serviceId: SERVICE_ID,
        startsAt: "2026-07-15T14:00:00.000Z",
        customerName: "Maria Silva",
        customerPhone: "11999999999",
        customerEmail: "maria@example.com",
      });
      expect(parsed.startsAt).toBe("2026-07-15T14:00:00.000Z");
    });
  });
});
