import { describe, expect, it } from "vitest";

import {
  mapPlatformActivityLog,
  mapPlatformCompany,
  mapPlatformMetrics,
  mapPlatformSubscription,
  mapPlatformUser,
} from "@/features/platform-admin/mappers";

describe("mapPlatformMetrics", () => {
  it("derives MRR and ARR from monthly revenue", () => {
    const dto = mapPlatformMetrics({
      total_companies: 10,
      active_companies: 7,
      trial_companies: 2,
      total_subscriptions: 8,
      monthly_revenue_cents: 150000,
    });

    expect(dto.companies).toBe(10);
    expect(dto.mrrCents).toBe(150000);
    expect(dto.arrCents).toBe(1800000);
  });
});

describe("mapPlatformCompany", () => {
  it("maps company row", () => {
    const dto = mapPlatformCompany({
      id: "00000000-0000-4000-8000-000000000001",
      name: "Acme",
      slug: "acme",
      status: "active",
      active: true,
      created_at: "2026-07-22T00:00:00.000Z",
    });

    expect(dto.slug).toBe("acme");
    expect(dto.active).toBe(true);
  });
});

describe("mapPlatformUser", () => {
  it("maps user with platform role", () => {
    const dto = mapPlatformUser(
      {
        id: "00000000-0000-4000-8000-000000000002",
        full_name: "Maria",
        phone: "11999999999",
        created_at: "2026-07-22T00:00:00.000Z",
      },
      "platform_admin",
    );

    expect(dto.fullName).toBe("Maria");
    expect(dto.platformRole).toBe("platform_admin");
  });
});

describe("mapPlatformSubscription", () => {
  it("maps subscription with joined company and plan", () => {
    const dto = mapPlatformSubscription({
      id: "00000000-0000-4000-8000-000000000003",
      status: "active",
      company_id: "00000000-0000-4000-8000-000000000001",
      current_period_ends_at: "2026-08-22T00:00:00.000Z",
      next_payment_at: "2026-08-22T00:00:00.000Z",
      companies: { name: "Acme", slug: "acme" },
      plans: { name: "Pro" },
    });

    expect(dto.companyName).toBe("Acme");
    expect(dto.planName).toBe("Pro");
  });
});

describe("mapPlatformActivityLog", () => {
  it("maps activity log row", () => {
    const dto = mapPlatformActivityLog({
      id: "00000000-0000-4000-8000-000000000004",
      company_id: "00000000-0000-4000-8000-000000000001",
      actor_user_id: "00000000-0000-4000-8000-000000000002",
      action: "customer.created",
      module: "customers",
      entity_type: "customer",
      entity_id: "00000000-0000-4000-8000-000000000005",
      created_at: "2026-07-22T12:00:00.000Z",
    });

    expect(dto.module).toBe("customers");
    expect(dto.action).toBe("customer.created");
  });
});
