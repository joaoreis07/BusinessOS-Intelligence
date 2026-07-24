import { beforeEach, describe, expect, it, vi } from "vitest";

const getCurrentUserMock = vi.fn();
const createClientMock = vi.fn();
const cookiesMock = vi.fn();

vi.mock("@/lib/auth/guards", () => ({
  getCurrentUser: getCurrentUserMock,
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: createClientMock,
}));

vi.mock("next/headers", () => ({
  cookies: cookiesMock,
}));

describe("tenancy context", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
  });

  it("returns null for unauthenticated user", async () => {
    getCurrentUserMock.mockResolvedValue(null);
    const { getCompanyContext } = await import("@/lib/tenancy/context");
    await expect(getCompanyContext()).resolves.toBeNull();
  });

  it("falls back to first membership when cookie company is invalid", async () => {
    getCurrentUserMock.mockResolvedValue({ id: "user-1" });
    cookiesMock.mockResolvedValue({
      get: vi.fn(() => ({ value: "missing-company" })),
    });

    const from = vi
      .fn()
      .mockImplementationOnce(() => ({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        not: vi.fn().mockReturnThis(),
        is: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue({ data: [], error: null }),
      }))
      .mockImplementationOnce(() => ({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        not: vi.fn().mockReturnThis(),
        is: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue({
          data: [{ company_id: "company-1", role: "owner" }],
          error: null,
        }),
      }))
      .mockImplementationOnce(() => ({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockResolvedValue({
          data: {
            id: "company-1",
            name: "Empresa A",
            slug: "empresa-a",
            status: "active",
            active: true,
          },
          error: null,
        }),
      }))
      .mockImplementationOnce(() => ({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockResolvedValue({
          data: { timezone: "America/Sao_Paulo" },
          error: null,
        }),
      }));

    createClientMock.mockResolvedValue({ from });
    const { getCompanyContext } = await import("@/lib/tenancy/context");
    const context = await getCompanyContext();
    expect(context?.companyId).toBe("company-1");
    expect(context?.role).toBe("owner");
  });

  it("returns null when company is blocked", async () => {
    getCurrentUserMock.mockResolvedValue({ id: "user-1" });
    cookiesMock.mockResolvedValue({ get: vi.fn(() => undefined) });
    const from = vi
      .fn()
      .mockImplementationOnce(() => ({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        not: vi.fn().mockReturnThis(),
        is: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue({
          data: [{ company_id: "company-1", role: "owner" }],
          error: null,
        }),
      }))
      .mockImplementationOnce(() => ({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockResolvedValue({
          data: {
            id: "company-1",
            name: "Empresa A",
            slug: "empresa-a",
            status: "blocked",
            active: true,
          },
          error: null,
        }),
      }));
    createClientMock.mockResolvedValue({ from });
    const { getCompanyContext } = await import("@/lib/tenancy/context");
    await expect(getCompanyContext()).resolves.toBeNull();
  });

  it("requireCompanyContext blocks role bypass attempts", async () => {
    getCurrentUserMock.mockResolvedValue({ id: "user-1" });
    cookiesMock.mockResolvedValue({ get: vi.fn(() => undefined) });
    const from = vi
      .fn()
      .mockImplementationOnce(() => ({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        not: vi.fn().mockReturnThis(),
        is: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue({
          data: [{ company_id: "company-1", role: "viewer" }],
          error: null,
        }),
      }))
      .mockImplementationOnce(() => ({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockResolvedValue({
          data: {
            id: "company-1",
            name: "Empresa A",
            slug: "empresa-a",
            status: "active",
            active: true,
          },
          error: null,
        }),
      }))
      .mockImplementationOnce(() => ({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockResolvedValue({
          data: { timezone: "America/Sao_Paulo" },
          error: null,
        }),
      }));
    createClientMock.mockResolvedValue({ from });
    const { requireCompanyContext } = await import("@/lib/tenancy/context");
    await expect(requireCompanyContext(["owner", "admin"])).rejects.toThrow(
      "Você não possui permissão para esta ação.",
    );
  });
});
