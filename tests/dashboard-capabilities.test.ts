import { describe, expect, it } from "vitest";

import { resolveDashboardCapabilities } from "@/features/dashboard/server";

describe("resolveDashboardCapabilities", () => {
  it("grants read-only finance to viewer", () => {
    const capabilities = resolveDashboardCapabilities("viewer");
    expect(capabilities.finance).toBe(true);
    expect(capabilities.financeManage).toBe(false);
    expect(capabilities.customers).toBe(true);
  });

  it("grants manage permissions to owner", () => {
    const capabilities = resolveDashboardCapabilities("owner");
    expect(capabilities.financeManage).toBe(true);
    expect(capabilities.customersManage).toBe(true);
    expect(capabilities.schedulingManage).toBe(true);
  });
});
