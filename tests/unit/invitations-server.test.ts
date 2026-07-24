import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  acceptInvitation,
  cancelInvitation,
  createInvitation,
} from "@/features/invitations";

const { authenticatedContextMock, createClientMock, requireUserMock } = vi.hoisted(
  () => ({
    authenticatedContextMock: vi.fn(),
    createClientMock: vi.fn(),
    requireUserMock: vi.fn(),
  }),
);

vi.mock("@/features/_shared/server", async () => {
  const actual = await vi.importActual("@/features/_shared/server");
  return {
    ...(actual as object),
    authenticatedContext: authenticatedContextMock,
  };
});

vi.mock("@/lib/supabase/server", () => ({
  createClient: createClientMock,
}));

vi.mock("@/lib/auth/guards", () => ({
  requireUser: requireUserMock,
}));

function mockInvitationQuery(duplicate = false) {
  const insert = vi.fn().mockReturnThis();
  const update = vi.fn().mockReturnThis();
  const select = vi.fn().mockReturnThis();
  const eq = vi.fn().mockReturnThis();
  const limit = vi.fn().mockReturnThis();
  const maybeSingle = vi.fn().mockResolvedValue({
    data: duplicate ? { id: "inv-1" } : null,
    error: null,
  });
  const order = vi.fn().mockResolvedValue({ data: [], error: null });
  const single = vi.fn().mockResolvedValue({
    data: { id: "new-invite" },
    error: null,
  });

  return {
    from: vi.fn(() => ({
      select,
      eq,
      limit,
      maybeSingle,
      insert,
      update,
      order,
      single,
    })),
  };
}

describe("invitations server", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("blocks duplicated pending invitation", async () => {
    const supabase = mockInvitationQuery(true);
    authenticatedContextMock.mockResolvedValue({
      companyId: "company-1",
      user: { id: "user-1" },
      supabase,
    });

    await expect(
      createInvitation({
        email: "user@example.com",
        role: "employee",
        expiresInDays: 7,
      }),
    ).rejects.toThrow("Já existe um convite pendente");
  });

  it("normalizes email before creating invitation", async () => {
    const supabase = mockInvitationQuery(false);
    authenticatedContextMock.mockResolvedValue({
      companyId: "company-1",
      user: { id: "user-1" },
      supabase,
    });

    await createInvitation({
      email: "USER@EXAMPLE.COM",
      role: "employee",
      expiresInDays: 7,
    });

    const fromChain = supabase.from.mock.results[1]?.value;
    expect(fromChain.insert).toHaveBeenCalledWith(
      expect.objectContaining({
        email: "user@example.com",
      }),
    );
  });

  it("acceptInvitation propagates rpc error", async () => {
    requireUserMock.mockResolvedValue({ id: "user-1" });
    createClientMock.mockResolvedValue({
      rpc: vi.fn().mockResolvedValue({
        data: null,
        error: { message: "invitation expired" },
      }),
    });

    await expect(acceptInvitation("1234567890123456")).rejects.toThrow(
      "invitation expired",
    );
  });

  it("cancelInvitation only targets pending invites", async () => {
    const supabase = mockInvitationQuery(false);
    authenticatedContextMock.mockResolvedValue({
      companyId: "company-1",
      user: { id: "user-1" },
      supabase,
    });

    await cancelInvitation("550e8400-e29b-41d4-a716-446655440000");

    const fromChain = supabase.from.mock.results[0]?.value;
    expect(fromChain.eq).toHaveBeenCalledWith("status", "pending");
  });
});
