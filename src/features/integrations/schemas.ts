import { z } from "zod";

export const integrationProviderSchema = z.enum([
  "google_calendar",
  "whatsapp",
  "email",
  "google_meet",
  "outlook",
  "apple_calendar",
  "mercado_pago",
  "zapier",
  "custom",
]);

export const integrationConnectSchema = z.object({
  provider: integrationProviderSchema,
  credentials: z.record(z.string(), z.string().min(1)).refine(
    (value) => Object.keys(value).length <= 20,
    "Credenciais demais.",
  ),
  settings: z.record(z.string(), z.unknown()).default({}),
});

export const integrationSettingsSchema = z.object({
  provider: integrationProviderSchema,
  settings: z.record(z.string(), z.unknown()),
});

export type IntegrationProvider = z.infer<typeof integrationProviderSchema>;
