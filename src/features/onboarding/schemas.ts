import { z } from "zod";

export const onboardingBusinessTypeOptions = [
  { value: "nutrition", label: "Nutrição" },
  { value: "health", label: "Saúde e bem-estar" },
  { value: "beauty", label: "Beleza e estética" },
  { value: "consulting", label: "Consultoria" },
  { value: "services", label: "Outros serviços" },
] as const;

const businessTypeSchema = z.enum([
  "nutrition",
  "health",
  "beauty",
  "consulting",
  "services",
]);

export const onboardingDefaults = {
  timezone: "America/Sao_Paulo",
  locale: "pt-BR",
  countryCode: "BR",
  currency: "BRL",
  logoPath: null,
  primaryColor: "#173f7a",
} as const;

export const onboardingSchema = z.object({
  companyName: z.string().trim().min(2).max(160),
  slug: z
    .string()
    .trim()
    .min(3)
    .max(63)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  businessType: businessTypeSchema,
  timezone: z.string().trim().min(3).max(120).default(onboardingDefaults.timezone),
  locale: z.string().trim().min(2).max(10).default(onboardingDefaults.locale),
  countryCode: z.string().trim().length(2).default(onboardingDefaults.countryCode),
  currency: z.string().trim().length(3).default(onboardingDefaults.currency),
  logoPath: z.string().trim().max(500).optional().nullable().default(null),
  primaryColor: z
    .string()
    .trim()
    .regex(/^#[0-9A-Fa-f]{6}$/)
    .default(onboardingDefaults.primaryColor),
});

export type OnboardingInput = z.infer<typeof onboardingSchema>;

export function parseOnboardingInput(input: {
  companyName: string;
  slug: string;
  businessType: string;
  timezone?: string;
  locale?: string;
  countryCode?: string;
  currency?: string;
  logoPath?: string | null;
  primaryColor?: string;
}) {
  return onboardingSchema.parse({
    ...onboardingDefaults,
    ...input,
    logoPath: input.logoPath?.trim() ? input.logoPath.trim() : null,
  });
}
