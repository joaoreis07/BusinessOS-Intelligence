import { describe, expect, it } from "vitest";

import {
  COMPANY_STATUS_LABELS,
  SUBSCRIPTION_STATUS_LABELS,
  companyStatusTone,
  subscriptionStatusTone,
} from "@/features/platform-admin/panel/status";

describe("platform admin status labels", () => {
  it("labels company statuses", () => {
    expect(COMPANY_STATUS_LABELS.active).toBe("Ativa");
    expect(COMPANY_STATUS_LABELS.trial).toBe("Trial");
  });

  it("labels subscription statuses", () => {
    expect(SUBSCRIPTION_STATUS_LABELS.past_due).toBe("Inadimplente");
  });
});

describe("platform admin status tones", () => {
  it("returns tone classes for company status", () => {
    expect(companyStatusTone("active")).toContain("emerald");
    expect(companyStatusTone("blocked")).toContain("rose");
  });

  it("returns tone classes for subscription status", () => {
    expect(subscriptionStatusTone("past_due")).toContain("rose");
    expect(subscriptionStatusTone("pending")).toContain("amber");
  });
});
