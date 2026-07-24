import { describe, expect, it } from "vitest";

import {
  buildFinancialSummary,
  mapFinancialEntryListItem,
} from "@/features/finance/mappers";

describe("mapFinancialEntryListItem", () => {
  it("maps database row to DTO", () => {
    const dto = mapFinancialEntryListItem({
      id: "00000000-0000-4000-8000-000000000001",
      transaction_type: "income",
      description: "Consulta",
      amount: 150,
      status: "paid",
      due_date: "2026-07-22",
      paid_at: "2026-07-22T12:00:00.000Z",
      category_id: "00000000-0000-4000-8000-000000000010",
      customer_id: null,
      created_at: "2026-07-22T00:00:00.000Z",
      financial_categories: { name: "Serviços" },
      customers: null,
    });

    expect(dto.amountCents).toBe(15000);
    expect(dto.categoryName).toBe("Serviços");
  });
});

describe("buildFinancialSummary", () => {
  it("aggregates income, expense and pending values", () => {
    const summary = buildFinancialSummary([
      { transaction_type: "income", amount: 200, status: "paid" },
      { transaction_type: "expense", amount: 50, status: "paid" },
      { transaction_type: "income", amount: 100, status: "pending" },
    ]);

    expect(summary.incomeCents).toBe(20000);
    expect(summary.expenseCents).toBe(5000);
    expect(summary.profitCents).toBe(15000);
    expect(summary.pendingCents).toBe(10000);
  });
});
