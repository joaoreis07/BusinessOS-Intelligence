import { describe, expect, it } from "vitest";

import { hasCompanyPermission } from "@/lib/permissions/company-permissions";

describe("customers permissions", () => {
  it("grants read to viewer", () => {
    expect(hasCompanyPermission("viewer", "customers:read")).toBe(true);
    expect(hasCompanyPermission("viewer", "customers:manage")).toBe(false);
  });

  it("grants manage to employee", () => {
    expect(hasCompanyPermission("employee", "customers:read")).toBe(true);
    expect(hasCompanyPermission("employee", "customers:manage")).toBe(true);
  });
});

describe("subscription permissions", () => {
  it("grants manage to owner and admin", () => {
    expect(hasCompanyPermission("owner", "subscription:manage")).toBe(true);
    expect(hasCompanyPermission("admin", "subscription:manage")).toBe(true);
    expect(hasCompanyPermission("manager", "subscription:manage")).toBe(false);
  });
});

describe("ai permissions", () => {
  it("grants read to owner, admin and manager", () => {
    expect(hasCompanyPermission("owner", "ai:read")).toBe(true);
    expect(hasCompanyPermission("admin", "ai:read")).toBe(true);
    expect(hasCompanyPermission("manager", "ai:read")).toBe(true);
    expect(hasCompanyPermission("member", "ai:read")).toBe(false);
  });
});
