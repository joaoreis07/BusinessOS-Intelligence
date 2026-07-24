import { describe, expect, it } from "vitest";

import {
  AI_CATEGORY_LABELS,
  AI_PRIORITY_LABELS,
  aiAlertToneClass,
} from "@/features/ai/panel/status";

describe("ai panel status", () => {
  it("labels alert categories", () => {
    expect(AI_CATEGORY_LABELS.finance).toBe("Financeiro");
    expect(AI_PRIORITY_LABELS.high).toBe("Alta");
  });

  it("returns tone classes", () => {
    expect(aiAlertToneClass("danger")).toContain("rose");
  });
});
