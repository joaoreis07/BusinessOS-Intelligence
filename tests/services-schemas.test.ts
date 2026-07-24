import { describe, expect, it } from "vitest";

import {
  serviceIdSchema,
  serviceReorderSchema,
  serviceSchema,
  serviceUpdateSchema,
} from "@/features/services/schemas";

describe("serviceSchema", () => {
  it("accepts a valid service payload", () => {
    const parsed = serviceSchema.parse({
      name: "Consulta",
      description: "Atendimento inicial",
      category: "Clínica",
      durationMinutes: 30,
      priceCents: 15000,
      active: true,
      publiclyVisible: true,
      displayOrder: 0,
    });

    expect(parsed.name).toBe("Consulta");
    expect(parsed.priceCents).toBe(15000);
  });

  it("rejects invalid duration", () => {
    expect(() =>
      serviceSchema.parse({
        name: "Consulta",
        durationMinutes: 2,
        priceCents: 1000,
      }),
    ).toThrow();
  });
});

describe("serviceUpdateSchema", () => {
  it("allows partial updates", () => {
    const parsed = serviceUpdateSchema.parse({ publiclyVisible: false });
    expect(parsed.publiclyVisible).toBe(false);
  });
});

describe("serviceReorderSchema", () => {
  it("accepts ordered service ids", () => {
    const parsed = serviceReorderSchema.parse([
      { id: "00000000-0000-4000-8000-000000000001", displayOrder: 0 },
      { id: "00000000-0000-4000-8000-000000000002", displayOrder: 1 },
    ]);

    expect(parsed).toHaveLength(2);
  });

  it("rejects empty reorder payloads", () => {
    expect(() => serviceReorderSchema.parse([])).toThrow();
  });
});

describe("serviceIdSchema", () => {
  it("rejects invalid ids", () => {
    expect(() => serviceIdSchema.parse("not-a-uuid")).toThrow();
  });
});
