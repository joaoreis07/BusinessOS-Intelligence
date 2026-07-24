import { describe, expect, it } from "vitest";

import {
  comparePlanOrder,
  isSubscriptionAtRisk,
  SUBSCRIPTION_STATUS_LABELS,
} from "@/features/subscriptions/panel/status";

describe("subscription status helpers", () => {
  it("labels subscription statuses", () => {
    expect(SUBSCRIPTION_STATUS_LABELS.past_due).toBe("Inadimplente");
    expect(SUBSCRIPTION_STATUS_LABELS.trial).toBe("Trial");
  });

  it("detects risky statuses", () => {
    expect(isSubscriptionAtRisk("past_due")).toBe(true);
    expect(isSubscriptionAtRisk("active")).toBe(false);
  });

  it("compares plan order", () => {
    const plans = [
      { code: "starter_monthly", displayOrder: 10 },
      { code: "premium_monthly", displayOrder: 30 },
    ].map((plan) => ({ code: plan.code, displayOrder: plan.displayOrder }));

    expect(comparePlanOrder("starter_monthly", "premium_monthly", plans)).toBe("upgrade");
    expect(comparePlanOrder("premium_monthly", "starter_monthly", plans)).toBe("downgrade");
  });
});
