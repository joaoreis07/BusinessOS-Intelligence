import type { CompanyRole } from "@/lib/tenancy/context";

export type CompanyPermission =
  | "company:read"
  | "company:update"
  | "landing:manage"
  | "services:manage"
  | "appointments:manage"
  | "scheduling:read"
  | "scheduling:manage"
  | "scheduling:configure"
  | "customers:read"
  | "customers:manage"
  | "finance:read"
  | "finance:manage"
  | "subscription:manage"
  | "ai:read";

const permissions: Record<CompanyRole, readonly CompanyPermission[]> = {
  owner: [
    "company:read",
    "company:update",
    "landing:manage",
    "services:manage",
    "appointments:manage",
    "scheduling:read",
    "scheduling:manage",
    "scheduling:configure",
    "customers:read",
    "customers:manage",
    "finance:read",
    "finance:manage",
    "subscription:manage",
    "ai:read",
  ],
  admin: [
    "company:read",
    "company:update",
    "landing:manage",
    "services:manage",
    "appointments:manage",
    "scheduling:read",
    "scheduling:manage",
    "scheduling:configure",
    "customers:read",
    "customers:manage",
    "finance:read",
    "finance:manage",
    "subscription:manage",
    "ai:read",
  ],
  manager: [
    "company:read",
    "landing:manage",
    "services:manage",
    "appointments:manage",
    "scheduling:read",
    "scheduling:manage",
    "scheduling:configure",
    "customers:read",
    "customers:manage",
    "finance:read",
    "finance:manage",
    "ai:read",
  ],
  member: [
    "company:read",
    "services:manage",
    "appointments:manage",
    "scheduling:read",
    "scheduling:manage",
    "customers:read",
    "customers:manage",
    "finance:read",
  ],
  employee: [
    "company:read",
    "appointments:manage",
    "scheduling:read",
    "scheduling:manage",
    "customers:read",
    "customers:manage",
  ],
  viewer: ["company:read", "finance:read", "scheduling:read", "customers:read"],
};

export function hasCompanyPermission(
  role: CompanyRole,
  permission: CompanyPermission,
) {
  return permissions[role].includes(permission);
}
