import { beforeEach, describe, expect, it, vi } from "vitest";
import { completeOnboarding, hasCompletedOnboarding } from "@/features/onboarding";

const { createClientMock, requireUserMock } = vi.hoisted(() => ({
  createClientMock: vi.fn(),
  requireUserMock: vi.fn(),
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: createClientMock,
}));

vi.mock("@/lib/auth/guards", () => ({
  requireUser: requireUserMock,
}));

describe("onboarding server", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("calls onboarding rpc with normalized codes", async () => {
    const rpc = vi.fn().mockResolvedValue({ data: "company-1", error: null });
    createClientMock.mockResolvedValue({ rpc });

    const result = await completeOnboarding({
      companyName: "Empresa",
      slug: "empresa",
      businessType: "health",
      timezone: "America/Sao_Paulo",
      locale: "pt-BR",
      countryCode: "br",
      currency: "brl",
      logoPath: null,
      primaryColor: "#111111",
    });

    expect(result).toBe("company-1");
    expect(rpc).toHaveBeenCalledWith(
      "complete_company_onboarding",
      expect.objectContaining({
        selected_country_code: "BR",
        selected_currency: "BRL",
      }),
    );
  });

  it("throws when onboarding rpc fails", async () => {
    createClientMock.mockResolvedValue({
      rpc: vi.fn().mockResolvedValue({
        data: null,
        error: { message: "rpc failed" },
      }),
    });

    await expect(
      completeOnboarding({
        companyName: "Empresa",
        slug: "empresa",
        businessType: "health",
        timezone: "America/Sao_Paulo",
        locale: "pt-BR",
        countryCode: "BR",
        currency: "BRL",
        logoPath: null,
        primaryColor: "#111111",
      }),
    ).rejects.toThrow("rpc failed");
  });

  it("hasCompletedOnboarding returns true for member user", async () => {
    requireUserMock.mockResolvedValue({ id: "user-1" });
    createClientMock.mockResolvedValue({
      from: vi.fn(() => ({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        not: vi.fn().mockReturnThis(),
        is: vi.fn().mockResolvedValue({
          count: 1,
          error: null,
        }),
      })),
    });

    await expect(hasCompletedOnboarding()).resolves.toBe(true);
  });
});
