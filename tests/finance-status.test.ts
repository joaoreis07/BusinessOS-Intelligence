import { describe, expect, it } from "vitest";

import {
  FINANCIAL_KIND_LABELS,
  FINANCIAL_STATUS_LABELS,
  financialStatusTone,
} from "@/features/finance/panel/status";

describe("finance status labels", () => {
  it("labels kinds and statuses", () => {
    expect(FINANCIAL_KIND_LABELS.income).toBe("Receita");
    expect(FINANCIAL_STATUS_LABELS.paid).toBe("Pago");
  });

  it("returns tone classes", () => {
    expect(financialStatusTone("paid")).toContain("emerald");
    expect(financialStatusTone("overdue")).toContain("rose");
  });
});
