import { describe, expect, it } from "vitest";
import {
  createInvitationSchema,
  invitationTokenSchema,
} from "@/features/invitations";

describe("invitation schemas", () => {
  it("accepts valid invitation payload", () => {
    const parsed = createInvitationSchema.safeParse({
      email: "user@example.com",
      role: "manager",
      expiresInDays: 10,
    });
    expect(parsed.success).toBe(true);
  });

  it("rejects invalid invitation payload", () => {
    const parsed = createInvitationSchema.safeParse({
      email: "invalid-email",
      role: "root",
      expiresInDays: 40,
    });
    expect(parsed.success).toBe(false);
  });

  it("rejects invalid invitation token length", () => {
    const parsed = invitationTokenSchema.safeParse("short");
    expect(parsed.success).toBe(false);
  });
});
