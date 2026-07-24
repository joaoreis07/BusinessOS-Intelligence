import { describe, expect, it } from "vitest";
import { hasCompanyPermission } from "@/lib/permissions/company-permissions";

describe("company permissions", () => {
  it("grants subscription management to owners and admins", () => {
    expect(hasCompanyPermission("owner", "subscription:manage")).toBe(true);
    expect(hasCompanyPermission("admin", "subscription:manage")).toBe(true);
    expect(hasCompanyPermission("manager", "subscription:manage")).toBe(false);
  });

  it("keeps viewers read-only except scheduling read", () => {
    expect(hasCompanyPermission("viewer", "company:read")).toBe(true);
    expect(hasCompanyPermission("viewer", "scheduling:read")).toBe(true);
    expect(hasCompanyPermission("viewer", "scheduling:manage")).toBe(false);
    expect(hasCompanyPermission("viewer", "customers:manage")).toBe(false);
    expect(hasCompanyPermission("viewer", "finance:manage")).toBe(false);
    expect(hasCompanyPermission("viewer", "scheduling:configure")).toBe(false);
  });

  it("allows owners and admins to configure scheduling", () => {
    expect(hasCompanyPermission("owner", "scheduling:configure")).toBe(true);
    expect(hasCompanyPermission("admin", "scheduling:configure")).toBe(true);
    expect(hasCompanyPermission("manager", "scheduling:configure")).toBe(true);
    expect(hasCompanyPermission("member", "scheduling:configure")).toBe(false);
  });
});
