import { describe, expect, it } from "vitest";
import { onboardingSchema } from "@/features/onboarding";

describe("onboardingSchema", () => {
  it("accepts valid onboarding payload", () => {
    const parsed = onboardingSchema.safeParse({
      companyName: "Vitta Studio",
      slug: "vitta-studio",
      businessType: "health",
      timezone: "America/Sao_Paulo",
      locale: "pt-BR",
      countryCode: "BR",
      currency: "BRL",
      logoPath: "/logos/vitta.png",
      primaryColor: "#123ABC",
    });
    expect(parsed.success).toBe(true);
  });

  it("rejects invalid slug and color", () => {
    const parsed = onboardingSchema.safeParse({
      companyName: "Empresa X",
      slug: "Empresa Inválida",
      businessType: "health",
      timezone: "America/Sao_Paulo",
      locale: "pt-BR",
      countryCode: "BR",
      currency: "BRL",
      primaryColor: "blue",
    });
    expect(parsed.success).toBe(false);
  });
});
