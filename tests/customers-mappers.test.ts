import { describe, expect, it } from "vitest";

import { mapCustomerDetail, mapCustomerListItem } from "@/features/customers/mappers";

describe("mapCustomerListItem", () => {
  it("maps database row to list DTO", () => {
    const dto = mapCustomerListItem({
      id: "00000000-0000-4000-8000-000000000001",
      full_name: "Maria Silva",
      email: "maria@example.com",
      phone: "+5511999998888",
      whatsapp: null,
      birth_date: null,
      city: "São Paulo",
      state: "SP",
      profession: null,
      acquisition_source: "public_booking",
      objectives: "Emagrecimento",
      status: "active",
      created_at: "2026-07-22T00:00:00.000Z",
      updated_at: "2026-07-22T00:00:00.000Z",
    });

    expect(dto.name).toBe("Maria Silva");
    expect(dto.acquisitionSource).toBe("public_booking");
    expect(dto.status).toBe("active");
  });
});

describe("mapCustomerDetail", () => {
  it("maps nested history and notes", () => {
    const dto = mapCustomerDetail({
      id: "00000000-0000-4000-8000-000000000001",
      full_name: "Maria Silva",
      email: null,
      phone: "+5511999998888",
      whatsapp: null,
      birth_date: null,
      city: null,
      state: null,
      profession: null,
      acquisition_source: null,
      objectives: null,
      status: "new",
      created_at: "2026-07-22T00:00:00.000Z",
      updated_at: "2026-07-22T00:00:00.000Z",
      customer_notes: [
        {
          id: "00000000-0000-4000-8000-000000000010",
          content: "Preferência por horários matinais",
          created_at: "2026-07-22T12:00:00.000Z",
        },
      ],
      appointments: [
        {
          id: "00000000-0000-4000-8000-000000000020",
          starts_at: "2026-07-25T14:00:00.000Z",
          status: "confirmed",
          services: { name: "Consulta" },
        },
      ],
      financial_transactions: [
        {
          id: "00000000-0000-4000-8000-000000000030",
          transaction_type: "income",
          amount: 150,
          status: "paid",
          due_date: "2026-07-25",
          description: "Consulta",
        },
      ],
    });

    expect(dto.notes).toHaveLength(1);
    expect(dto.appointments[0]?.serviceName).toBe("Consulta");
    expect(dto.financialEntries[0]?.amountCents).toBe(15000);
  });
});
