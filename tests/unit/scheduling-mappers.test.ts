import { describe, expect, it } from "vitest";
import {
  mapAppointmentListItem,
  mapAvailabilityRule,
  mapAvailabilitySlot,
  mapPublicBookingPage,
  mapPublicBookingResult,
  mapPublicBookingService,
  mapRescheduleAppointmentResult,
  mapWorkspaceAppointmentResult,
  toBookingFormProps,
  toBusinessHoursRulesPayload,
} from "@/features/scheduling/mappers";
import { resolveSchedulingEnabled } from "@/features/scheduling/integrations/landing-bridge";

describe("scheduling mappers", () => {
  describe("mapAppointmentListItem", () => {
    it("maps nested relations from list query rows", () => {
      const item = mapAppointmentListItem({
        id: "770e8400-e29b-41d4-a716-446655440002",
        service_id: "660e8400-e29b-41d4-a716-446655440001",
        customer_id: "880e8400-e29b-41d4-a716-446655440003",
        starts_at: "2026-07-15T14:00:00.000Z",
        ends_at: "2026-07-15T14:30:00.000Z",
        status: "confirmed",
        objective: "Consulta inicial",
        customer_notes: "Prefere tarde",
        internal_notes: null,
        cancellation_reason: null,
        source: "public_landing",
        created_at: "2026-07-14T10:00:00.000Z",
        updated_at: "2026-07-14T12:00:00.000Z",
        customers: [{ full_name: "Maria Silva", phone: "+5511999999999", email: "maria@example.com" }],
        services: [{ name: "Consulta", price: 150, duration_minutes: 30 }],
      });

      expect(item.customerName).toBe("Maria Silva");
      expect(item.customerPhone).toBe("+5511999999999");
      expect(item.serviceName).toBe("Consulta");
      expect(item.priceCents).toBe(15_000);
      expect(item.status).toBe("confirmed");
      expect(item.source).toBe("public_landing");
    });
  });

  describe("mapPublicBookingPage", () => {
    it("maps company and services for the public booking flow", () => {
      const page = mapPublicBookingPage({
        company: {
          name: "Clínica Saúde",
          slug: "clinica-saude",
          address: { city: "São Paulo", state: "SP" },
          primary_color: "#112233",
        },
        services: [
          {
            id: "550e8400-e29b-41d4-a716-446655440000",
            name: "Consulta",
            description: "Primeira consulta",
            price: 199.9,
            duration_minutes: 45,
          },
        ],
      });

      expect(page.company.city).toBe("São Paulo");
      expect(page.services[0]?.priceCents).toBe(19_990);
    });
  });

  describe("mapPublicBookingService", () => {
    it("rounds decimal prices to cents", () => {
      const service = mapPublicBookingService({
        id: "550e8400-e29b-41d4-a716-446655440000",
        name: "Consulta",
        description: null,
        price: "120.5",
        duration_minutes: 30,
      });

      expect(service.priceCents).toBe(12_050);
    });
  });

  describe("toBookingFormProps", () => {
    it("keeps booking form prop compatibility", () => {
      const props = toBookingFormProps({
        company: {
          name: "Clínica Saúde",
          slug: "clinica-saude",
          city: "São Paulo",
          state: "SP",
          primaryColor: "#112233",
        },
        services: [
          {
            id: "550e8400-e29b-41d4-a716-446655440000",
            name: "Consulta",
            description: null,
            priceCents: 15_000,
            durationMinutes: 30,
          },
        ],
      });

      expect(props.company.primary_color).toBe("#112233");
      expect(props.services[0]?.price_cents).toBe(15_000);
    });
  });

  describe("mapAvailabilitySlot", () => {
    it("maps rpc slot rows", () => {
      expect(mapAvailabilitySlot({ slot_start: "2026-07-15T14:00:00.000Z" })).toEqual({
        startsAt: "2026-07-15T14:00:00.000Z",
      });
    });
  });

  describe("mapPublicBookingResult", () => {
    it("maps rpc appointment rows", () => {
      expect(
        mapPublicBookingResult({
          appointment_id: "770e8400-e29b-41d4-a716-446655440002",
          appointment_status: "pending",
        }),
      ).toEqual({
        appointmentId: "770e8400-e29b-41d4-a716-446655440002",
        status: "pending",
      });
    });
  });

  describe("mapAvailabilityRule", () => {
    it("maps business hours rows", () => {
      expect(
        mapAvailabilityRule({
          id: "880e8400-e29b-41d4-a716-446655440003",
          weekday: 1,
          start_time: "09:00",
          end_time: "18:00",
          active: true,
        }),
      ).toEqual({
        id: "880e8400-e29b-41d4-a716-446655440003",
        weekday: 1,
        startTime: "09:00",
        endTime: "18:00",
        enabled: true,
      });
    });
  });

  describe("mapWorkspaceAppointmentResult", () => {
    it("maps workspace rpc rows", () => {
      expect(
        mapWorkspaceAppointmentResult({
          appointment_id: "770e8400-e29b-41d4-a716-446655440002",
          appointment_status: "pending",
        }),
      ).toEqual({
        appointmentId: "770e8400-e29b-41d4-a716-446655440002",
        status: "pending",
      });
    });
  });

  describe("mapRescheduleAppointmentResult", () => {
    it("maps reschedule rpc rows", () => {
      expect(
        mapRescheduleAppointmentResult({
          appointment_id: "770e8400-e29b-41d4-a716-446655440002",
          appointment_status: "confirmed",
          starts_at: "2026-07-16T10:00:00.000Z",
          ends_at: "2026-07-16T11:00:00.000Z",
        }),
      ).toEqual({
        appointmentId: "770e8400-e29b-41d4-a716-446655440002",
        status: "confirmed",
        startsAt: "2026-07-16T10:00:00.000Z",
        endsAt: "2026-07-16T11:00:00.000Z",
      });
    });
  });

  describe("toBusinessHoursRulesPayload", () => {
    it("serializes rules for replace_business_hours rpc", () => {
      expect(
        toBusinessHoursRulesPayload([
          { weekday: 1, startTime: "09:00", endTime: "18:00", enabled: true },
        ]),
      ).toEqual([
        { weekday: 1, startTime: "09:00", endTime: "18:00", enabled: true },
      ]);
    });
  });
});

describe("scheduling landing bridge", () => {
  it("requires booking href and visible services", () => {
    expect(
      resolveSchedulingEnabled({
        bookingHref: "/clinica-saude/agendar",
        publiclyVisibleServices: 2,
      }),
    ).toBe(true);

    expect(
      resolveSchedulingEnabled({
        bookingHref: null,
        publiclyVisibleServices: 2,
      }),
    ).toBe(false);

    expect(
      resolveSchedulingEnabled({
        bookingHref: "/clinica-saude/agendar",
        bookingEnabled: false,
        publiclyVisibleServices: 2,
      }),
    ).toBe(false);
  });
});
