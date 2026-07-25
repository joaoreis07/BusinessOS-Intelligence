import { describe, expect, it } from "vitest";
import { onboardingSchema, parseOnboardingInput } from "@/features/onboarding";

describe("onboardingSchema", () => {
  it("accepts minimal onboarding payload with defaults", () => {
    const parsed = parseOnboardingInput({
      companyName: "Vitta Studio",
      slug: "vitta-studio",
      businessType: "health",
    });

    expect(parsed.timezone).toBe("America/Sao_Paulo");
    expect(parsed.locale).toBe("pt-BR");
    expect(parsed.countryCode).toBe("BR");
    expect(parsed.currency).toBe("BRL");
    expect(parsed.primaryColor).toBe("#173f7a");
    expect(parsed.logoPath).toBeNull();
  });

  it("accepts full onboarding payload", () => {
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
      primaryColor: "blue",
    });
    expect(parsed.success).toBe(false);
  });
});
