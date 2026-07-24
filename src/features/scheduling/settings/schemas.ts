import { z } from "zod";

import { availabilityRuleSchema } from "../schemas";

export const bookingFlowSchema = z.enum([
  "instant_confirmation",
  "manual_approval",
  "payment_required",
]);

export const blockedPeriodTypeSchema = z.enum([
  "vacation",
  "holiday",
  "maintenance",
  "meeting",
  "temporary",
  "custom",
]);

export const timeIntervalSchema = z
  .object({
    startTime: z.string().regex(/^\d{2}:\d{2}$/, "Use o formato HH:MM."),
    endTime: z.string().regex(/^\d{2}:\d{2}$/, "Use o formato HH:MM."),
  })
  .refine((value) => value.startTime < value.endTime, {
    message: "O horário inicial deve ser anterior ao horário final.",
  });

export const weekdayScheduleSchema = z
  .object({
    weekday: z.number().int().min(0).max(6),
    enabled: z.boolean(),
    intervals: z.array(timeIntervalSchema).max(4),
  })
  .superRefine((value, ctx) => {
    if (!value.enabled) return;
    if (value.intervals.length === 0) {
      ctx.addIssue({
        code: "custom",
        message: "Adicione ao menos um intervalo para dias ativos.",
        path: ["intervals"],
      });
      return;
    }

    const sorted = [...value.intervals].sort((left, right) =>
      left.startTime.localeCompare(right.startTime),
    );

    for (let index = 1; index < sorted.length; index += 1) {
      const previous = sorted[index - 1];
      const current = sorted[index];
      if (current && previous && current.startTime < previous.endTime) {
        ctx.addIssue({
          code: "custom",
          message: "Os intervalos do mesmo dia não podem se sobrepor.",
          path: ["intervals"],
        });
        return;
      }
    }
  });

export const weekScheduleSchema = z
  .array(weekdayScheduleSchema)
  .length(7, "Informe os sete dias da semana.");

export const weekScheduleInputSchema = z.object({
  timezone: z.string().min(1).optional(),
  days: weekScheduleSchema,
});

export const schedulingPreferencesSchema = z.object({
  allowCancellation: z.boolean().default(true),
  allowReschedule: z.boolean().default(true),
  requireObjective: z.boolean().default(false),
  requireNotes: z.boolean().default(false),
  defaultDurationMinutes: z.number().int().min(5).max(1440).nullable().optional(),
});

export const schedulingSettingsSchema = z.object({
  bookingEnabled: z.boolean(),
  bookingFlow: bookingFlowSchema,
  minNoticeMinutes: z.number().int().min(0).max(10_080),
  intervalMinutes: z.number().int().min(5).max(1_440),
  horizonDays: z.number().int().min(1).max(730),
  maxAppointmentsPerDay: z
    .union([z.number().int().min(1), z.null()])
    .optional()
    .transform((value) => value ?? null),
  preferences: schedulingPreferencesSchema,
});

export const blockedPeriodSchema = z
  .object({
    startsAt: z.iso.datetime({ offset: true }),
    endsAt: z.iso.datetime({ offset: true }),
    reason: z.string().trim().max(500).optional().nullable(),
    allDay: z.boolean().default(false),
    blockType: blockedPeriodTypeSchema.default("custom"),
    recurrenceRule: z.record(z.string(), z.unknown()).nullable().optional(),
    scope: z.record(z.string(), z.unknown()).optional(),
  })
  .refine((value) => new Date(value.startsAt) < new Date(value.endsAt), {
    message: "A data de início deve ser anterior à data de término.",
  });

export const blockedPeriodIdSchema = z.uuid();

export const businessHoursPayloadSchema = availabilityRuleSchema.array().max(28);

export type BookingFlow = z.infer<typeof bookingFlowSchema>;
export type BlockedPeriodType = z.infer<typeof blockedPeriodTypeSchema>;
export type SchedulingPreferences = z.infer<typeof schedulingPreferencesSchema>;
