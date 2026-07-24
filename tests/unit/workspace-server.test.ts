import { beforeEach, describe, expect, it, vi } from "vitest";
import { listMyWorkspaces, switchWorkspace } from "@/features/workspace";

const { requireUserMock, createClientMock, cookiesMock, authenticatedContextMock } =
  vi.hoisted(() => ({
    requireUserMock: vi.fn(),
    createClientMock: vi.fn(),
    cookiesMock: vi.fn(),
    authenticatedContextMock: vi.fn(),
  }));

vi.mock("@/lib/auth/guards", () => ({
  requireUser: requireUserMock,
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: createClientMock,
}));

vi.mock("next/headers", () => ({
  cookies: cookiesMock,
}));

vi.mock("@/features/_shared/server", async () => {
  const actual = await vi.importActual("@/features/_shared/server");
  return {
    ...(actual as object),
    authenticatedContext: authenticatedContextMock,
  };
});

describe("workspace server", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("switches company only when membership exists", async () => {
    requireUserMock.mockResolvedValue({ id: "user-1" });
    const single = vi.fn().mockResolvedValue({ data: { id: "m-1" }, error: null });
    createClientMock.mockResolvedValue({
      from: vi.fn(() => ({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        not: vi.fn().mockReturnThis(),
        is: vi.fn().mockReturnThis(),
        single,
      })),
    });
    const set = vi.fn();
    cookiesMock.mockResolvedValue({ set });

    await switchWorkspace({
      companyId: "550e8400-e29b-41d4-a716-446655440000",
    });

    expect(set).toHaveBeenCalledWith(
      "businessos_company",
      "550e8400-e29b-41d4-a716-446655440000",
      expect.any(Object),
    );
  });

  it("blocks company switch without membership", async () => {
    requireUserMock.mockResolvedValue({ id: "user-1" });
    createClientMock.mockResolvedValue({
      from: vi.fn(() => ({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        not: vi.fn().mockReturnThis(),
        is: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: null, error: null }),
      })),
    });
    cookiesMock.mockResolvedValue({ set: vi.fn() });

    await expect(
      switchWorkspace({
        companyId: "550e8400-e29b-41d4-a716-446655440000",
      }),
    ).rejects.toThrow("Você não possui acesso a esta empresa.");
  });

  it("lists workspaces for a multi-company user", async () => {
    requireUserMock.mockResolvedValue({ id: "user-1" });
    const from = vi
      .fn()
      .mockImplementationOnce(() => ({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        not: vi.fn().mockReturnThis(),
        is: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({
          data: [
            { company_id: "c-1", role: "owner" },
            { company_id: "c-2", role: "manager" },
          ],
          error: null,
        }),
      }))
      .mockImplementationOnce(() => ({
        select: vi.fn().mockReturnThis(),
        in: vi.fn().mockResolvedValue({
          data: [
            { id: "c-1", name: "A", slug: "a", status: "active", active: true },
            { id: "c-2", name: "B", slug: "b", status: "trial", active: true },
          ],
          error: null,
        }),
      }));
    createClientMock.mockResolvedValue({ from });

    const result = await listMyWorkspaces();

    expect(result).toHaveLength(2);
    expect(result[1]).toEqual(
      expect.objectContaining({
        company_id: "c-2",
        role: "manager",
      }),
    );
  });
});
