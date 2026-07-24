import { describe, expect, it } from "vitest";

import {
  CUSTOMER_STATUS_LABELS,
  customerStatusTone,
} from "@/features/customers/panel/status";

describe("CUSTOMER_STATUS_LABELS", () => {
  it("labels every status", () => {
    expect(CUSTOMER_STATUS_LABELS.new).toBe("Novo");
    expect(CUSTOMER_STATUS_LABELS.active).toBe("Ativo");
    expect(CUSTOMER_STATUS_LABELS.following).toBe("Em acompanhamento");
    expect(CUSTOMER_STATUS_LABELS.inactive).toBe("Inativo");
  });
});

describe("customerStatusTone", () => {
  it("returns tone classes per status", () => {
    expect(customerStatusTone("active")).toContain("emerald");
    expect(customerStatusTone("inactive")).toContain("slate");
  });
});
