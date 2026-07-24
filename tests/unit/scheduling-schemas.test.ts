import { describe, expect, it } from "vitest";
import {
  appointmentSchema,
  appointmentStatusUpdateSchema,
  availabilityQuerySchema,
  publicAvailabilityActionSchema,
  publicBookingActionSchema,
  publicBookingSchema,
  rescheduleAppointmentSchema,
} from "@/features/scheduling/schemas";

describe("scheduling schemas", () => {
  describe("publicBookingSchema", () => {
    it("accepts a valid public booking payload", () => {
      const parsed = publicBookingSchema.parse({
        companySlug: "clinica-saude",
        serviceId: "550e8400-e29b-41d4-a716-446655440000",
        startsAt: "2026-07-15T14:00:00.000Z",
        customer: {
          name: "Maria Silva",
          phone: "+5511999999999",
          email: "maria@example.com",
        },
        objective: "Consulta inicial",
        notes: "Prefere manhã",
      });

      expect(parsed.objective).toBe("Consulta inicial");
      expect(parsed.customer.email).toBe("maria@example.com");
    });

    it("rejects reserved public slugs", () => {
      expect(() =>
        publicBookingSchema.parse({
          companySlug: "agendar",
          serviceId: "550e8400-e29b-41d4-a716-446655440000",
          startsAt: "2026-07-15T14:00:00.000Z",
          customer: {
            name: "Maria Silva",
            phone: "+5511999999999",
          },
        }),
      ).toThrow();
    });
  });

  describe("publicBookingActionSchema", () => {
    it("normalizes empty email to null", () => {
      const parsed = publicBookingActionSchema.parse({
        slug: "clinica-saude",
        serviceId: "550e8400-e29b-41d4-a716-446655440000",
        startsAt: "2026-07-15T14:00:00.000Z",
        customerName: "Maria Silva",
        customerPhone: "+5511999999999",
        customerEmail: "",
        objective: "Avaliação",
      });

      expect(parsed.customerEmail).toBeNull();
      expect(parsed.objective).toBe("Avaliação");
    });
  });

  describe("publicAvailabilityActionSchema", () => {
    it("maps slug to availability query fields", () => {
      const parsed = publicAvailabilityActionSchema.parse({
        slug: "clinica-saude",
        serviceId: "550e8400-e29b-41d4-a716-446655440000",
        date: "2026-07-15",
      });

      expect(parsed.date).toBe("2026-07-15");
    });
  });

  describe("appointmentSchema", () => {
    it("requires workspace appointment identifiers", () => {
      const parsed = appointmentSchema.parse({
        serviceId: "550e8400-e29b-41d4-a716-446655440000",
        customerId: "660e8400-e29b-41d4-a716-446655440001",
        startsAt: "2026-07-15T14:00:00.000Z",
      });

      expect(parsed.notes).toBeUndefined();
      expect(parsed.idempotencyKey).toBeUndefined();
    });
  });

  describe("appointmentStatusUpdateSchema", () => {
    it("accepts secure status updates", () => {
      const parsed = appointmentStatusUpdateSchema.parse({
        id: "550e8400-e29b-41d4-a716-446655440000",
        status: "cancelled",
      });

      expect(parsed.status).toBe("cancelled");
    });
  });

  describe("rescheduleAppointmentSchema", () => {
    it("accepts secure reschedule payloads", () => {
      const parsed = rescheduleAppointmentSchema.parse({
        id: "550e8400-e29b-41d4-a716-446655440000",
        startsAt: "2026-07-16T10:00:00.000Z",
      });

      expect(parsed.startsAt).toBe("2026-07-16T10:00:00.000Z");
    });
  });

  describe("availabilityQuerySchema", () => {
    it("shares slug validation with landing public slugs", () => {
      expect(() =>
        availabilityQuerySchema.parse({
          companySlug: "INVALID",
          serviceId: "550e8400-e29b-41d4-a716-446655440000",
          date: "2026-07-15",
        }),
      ).toThrow();
    });
  });
});
