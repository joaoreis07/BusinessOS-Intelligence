import { describe, expect, it } from "vitest";
import {
  switchCompanySchema,
  workspacePreferencesSchema,
} from "@/features/workspace";

describe("workspace schemas", () => {
  it("validates company switch payload", () => {
    const parsed = switchCompanySchema.safeParse({
      companyId: "550e8400-e29b-41d4-a716-446655440000",
    });
    expect(parsed.success).toBe(true);
  });

  it("rejects invalid workspace preferences", () => {
    const parsed = workspacePreferencesSchema.safeParse({
      locale: "pt-BR",
      timezone: "UTC",
      dateFormat: "dd/MM/yyyy",
      timeFormat: "36h",
    });
    expect(parsed.success).toBe(false);
  });
});
