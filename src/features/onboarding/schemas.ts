import { z } from "zod";

export const onboardingSchema = z.object({
  companyName: z.string().trim().min(2).max(160),
  slug: z
    .string()
    .trim()
    .min(3)
    .max(63)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  businessType: z.string().trim().min(2).max(80),
  timezone: z.string().trim().min(3).max(120),
  locale: z.string().trim().min(2).max(10),
  countryCode: z.string().trim().length(2),
  currency: z.string().trim().length(3),
  logoPath: z.string().trim().max(500).optional().nullable(),
  primaryColor: z
    .string()
    .trim()
    .regex(/^#[0-9A-Fa-f]{6}$/)
    .default("#18181B"),
});

export type OnboardingInput = z.infer<typeof onboardingSchema>;
