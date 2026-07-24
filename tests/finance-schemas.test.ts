import { describe, expect, it } from "vitest";

import {
  financialEntrySchema,
  financialKindSchema,
  listFinancialEntriesQuerySchema,
} from "@/features/finance/schemas";

describe("financialEntrySchema", () => {
  it("accepts a valid entry", () => {
    const parsed = financialEntrySchema.parse({
      kind: "income",
      description: "Consulta",
      amountCents: 15000,
      dueDate: "2026-07-22",
      status: "paid",
      categoryId: "00000000-0000-4000-8000-000000000001",
    });

    expect(parsed.kind).toBe("income");
    expect(parsed.amountCents).toBe(15000);
  });
});

describe("listFinancialEntriesQuerySchema", () => {
  it("requires period bounds", () => {
    expect(() => listFinancialEntriesQuerySchema.parse({ page: 1 })).toThrow();
  });

  it("accepts filters", () => {
    const parsed = listFinancialEntriesQuerySchema.parse({
      from: "2026-07-01",
      to: "2026-07-31",
      kind: "expense",
      status: "pending",
    });

    expect(parsed.kind).toBe("expense");
    expect(parsed.status).toBe("pending");
  });
});

describe("financialKindSchema", () => {
  it("rejects invalid kind", () => {
    expect(() => financialKindSchema.parse("transfer")).toThrow();
  });
});
