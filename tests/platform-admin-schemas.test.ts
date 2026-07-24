import { describe, expect, it } from "vitest";

import {
  adminCompaniesQuerySchema,
  adminListSchema,
  adminLogsQuerySchema,
  updateCompanyStatusSchema,
} from "@/features/platform-admin/schemas";

describe("adminListSchema", () => {
  it("applies defaults", () => {
    const parsed = adminListSchema.parse({});
    expect(parsed.page).toBe(1);
    expect(parsed.pageSize).toBe(25);
    expect(parsed.search).toBe("");
  });
});

describe("adminCompaniesQuerySchema", () => {
  it("accepts status filter", () => {
    const parsed = adminCompaniesQuerySchema.parse({ status: "trial", page: "2" });
    expect(parsed.status).toBe("trial");
    expect(parsed.page).toBe(2);
  });
});

describe("adminLogsQuerySchema", () => {
  it("accepts module filter", () => {
    const parsed = adminLogsQuerySchema.parse({ module: "customers" });
    expect(parsed.module).toBe("customers");
  });
});

describe("updateCompanyStatusSchema", () => {
  it("requires company id and status", () => {
    const parsed = updateCompanyStatusSchema.parse({
      companyId: "00000000-0000-4000-8000-000000000001",
      status: "blocked",
    });
    expect(parsed.status).toBe("blocked");
  });
});
