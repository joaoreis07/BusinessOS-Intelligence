import { describe, expect, it } from "vitest";

import { mapPublicBookingScheduling, mapPublicBookingWizard } from "@/features/scheduling/mappers";

describe("public booking wizard mappers", () => {
  it("maps rpc scheduling context", () => {
    const scheduling = mapPublicBookingScheduling({
      bookingEnabled: true,
      bookingFlow: "instant_confirmation",
      minNoticeMinutes: 60,
      horizonDays: 30,
      intervalMinutes: 30,
      timezone: "America/Sao_Paulo",
      preferences: {
        allowCancellation: true,
        allowReschedule: true,
        requireObjective: false,
        requireNotes: false,
      },
    });

    expect(scheduling).toMatchObject({
      bookingEnabled: true,
      timezone: "America/Sao_Paulo",
      professionalId: null,
      locationId: null,
    });
  });

  it("returns null for invalid scheduling context", () => {
    expect(mapPublicBookingScheduling(null)).toBeNull();
    expect(mapPublicBookingScheduling({ bookingEnabled: "yes" })).toBeNull();
  });

  it("maps full wizard dto", () => {
    const wizard = mapPublicBookingWizard({
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
          price: 150,
          duration_minutes: 45,
        },
      ],
      scheduling: {
        bookingEnabled: true,
        bookingFlow: "instant_confirmation",
        minNoticeMinutes: 60,
        horizonDays: 30,
        intervalMinutes: 30,
        timezone: "America/Sao_Paulo",
        preferences: {
          allowCancellation: true,
          allowReschedule: true,
          requireObjective: false,
          requireNotes: false,
        },
        professionalId: null,
        locationId: null,
      },
    });

    expect(wizard.company.city).toBe("São Paulo");
    expect(wizard.services).toHaveLength(1);
    expect(wizard.scheduling.bookingEnabled).toBe(true);
  });
});
