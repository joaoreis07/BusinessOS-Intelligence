import { z } from "zod";

import { postgresUuidSchema } from "@/lib/schemas/uuid";
import { publicSlugSchema } from "../../landing/schemas";
import { schedulingPreferencesSchema } from "../settings/schemas";

export const publicAvailabilityRangeSchema = z
  .object({
    companySlug: publicSlugSchema,
    serviceId: postgresUuidSchema,
    dateFrom: z.iso.date(),
    dateTo: z.iso.date(),
  })
  .refine((value) => value.dateFrom <= value.dateTo, {
    message: "A data inicial deve ser anterior ou igual à data final.",
  })
  .refine((value) => {
    const from = new Date(`${value.dateFrom}T00:00:00`);
    const to = new Date(`${value.dateTo}T00:00:00`);
    const diffDays = Math.round((to.getTime() - from.getTime()) / 86_400_000);
    return diffDays <= 30;
  }, {
    message: "O intervalo de consulta deve ter no máximo 31 dias.",
  });

export const publicAvailableDatesActionSchema = z.object({
  slug: publicSlugSchema,
  serviceId: postgresUuidSchema,
  dateFrom: z.iso.date(),
  dateTo: z.iso.date(),
});

export const publicBookingWizardContextSchema = z.object({
  bookingEnabled: z.boolean(),
  bookingFlow: z.enum(["instant_confirmation", "manual_approval", "payment_required"]),
  minNoticeMinutes: z.number().int().min(0),
  horizonDays: z.number().int().min(1),
  intervalMinutes: z.number().int().min(5),
  timezone: z.string().min(1),
  preferences: schedulingPreferencesSchema,
});

type CustomerFieldPreferences = {
  requireObjective?: boolean;
  requireNotes?: boolean;
};

const optionalTextField = z
  .string()
  .trim()
  .max(2_000)
  .optional()
  .nullable()
  .transform((value) => (value ? value : null));

const optionalObjectiveField = z
  .string()
  .trim()
  .max(500)
  .optional()
  .nullable()
  .transform((value) => (value ? value : null));

export function buildPublicCustomerFieldsSchema(
  preferences: CustomerFieldPreferences = {},
) {
  return z.object({
    customerName: z.string().trim().min(2, "Informe seu nome completo.").max(120),
    customerPhone: z
      .string()
      .trim()
      .min(8, "Informe um telefone válido.")
      .max(32),
    customerEmail: z.email("Informe um e-mail válido."),
    objective: preferences.requireObjective
      ? z.string().trim().min(2, "Informe o objetivo do atendimento.").max(500)
      : optionalObjectiveField,
    notes: preferences.requireNotes
      ? z.string().trim().min(1, "Informe uma observação.").max(2_000)
      : optionalTextField,
  });
}

export function buildPublicBookingActionSchema(
  preferences: CustomerFieldPreferences = {},
) {
  return buildPublicCustomerFieldsSchema(preferences).extend({
    slug: publicSlugSchema,
    serviceId: postgresUuidSchema,
    startsAt: z.iso.datetime({ offset: true }),
    idempotencyKey: z.string().trim().min(16).max(200).optional(),
  });
}

export const bookingWizardServiceStepSchema = z.object({
  serviceId: postgresUuidSchema,
});

export const bookingWizardDateStepSchema = z.object({
  date: z.iso.date("Selecione uma data."),
});

export const bookingWizardTimeStepSchema = z.object({
  startsAt: z.iso.datetime({ offset: true }),
});

export type PublicBookingWizardContext = z.infer<typeof publicBookingWizardContextSchema>;
