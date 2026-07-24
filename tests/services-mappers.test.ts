import { describe, expect, it } from "vitest";

import { mapService } from "@/features/services/mappers";

describe("mapService", () => {
  it("maps database row to ServiceDTO", () => {
    const dto = mapService({
      id: "00000000-0000-4000-8000-000000000001",
      name: "Consulta",
      description: "Atendimento",
      category: "Clínica",
      price: 150,
      duration_minutes: 45,
      active: true,
      publicly_visible: true,
      display_order: 2,
      image_path: null,
      created_at: "2026-07-21T00:00:00.000Z",
      updated_at: "2026-07-21T00:00:00.000Z",
    });

    expect(dto).toEqual({
      id: "00000000-0000-4000-8000-000000000001",
      name: "Consulta",
      description: "Atendimento",
      category: "Clínica",
      priceCents: 15000,
      durationMinutes: 45,
      active: true,
      publiclyVisible: true,
      displayOrder: 2,
      imagePath: null,
      createdAt: "2026-07-21T00:00:00.000Z",
      updatedAt: "2026-07-21T00:00:00.000Z",
      professionalId: null,
    });
  });

  it("converts string prices to cents", () => {
    const dto = mapService({
      id: "00000000-0000-4000-8000-000000000002",
      name: "Retorno",
      description: null,
      category: null,
      price: "89.9",
      duration_minutes: 30,
      active: false,
      publicly_visible: false,
      display_order: 0,
      image_path: "/media/service.png",
      created_at: "2026-07-21T00:00:00.000Z",
      updated_at: "2026-07-21T00:00:00.000Z",
    });

    expect(dto.priceCents).toBe(8990);
    expect(dto.imagePath).toBe("/media/service.png");
  });
});
