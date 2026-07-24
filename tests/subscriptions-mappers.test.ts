import { describe, expect, it } from "vitest";

import { mapPlan, mapSubscriptionPayment } from "@/features/subscriptions/mappers";

describe("mapPlan", () => {
  it("maps plan row with features", () => {
    const dto = mapPlan({
      code: "pro_monthly",
      name: "Pro",
      description: "Plano intermediário",
      price: 99.9,
      currency: "BRL",
      billing_interval: "month",
      trial_days: 7,
      display_order: 20,
      plan_features: [{ feature_key: "crm", enabled: true, limits: {} }],
    });

    expect(dto.code).toBe("pro_monthly");
    expect(dto.priceCents).toBe(9990);
    expect(dto.features).toHaveLength(1);
  });
});

describe("mapSubscriptionPayment", () => {
  it("maps payment row to DTO", () => {
    const dto = mapSubscriptionPayment({
      id: "00000000-0000-4000-8000-000000000001",
      amount: 49.9,
      currency: "BRL",
      status: "approved",
      due_at: "2026-07-22",
      paid_at: "2026-07-22T12:00:00.000Z",
      created_at: "2026-07-22T00:00:00.000Z",
    });

    expect(dto.amountCents).toBe(4990);
    expect(dto.status).toBe("approved");
  });
});
