import { z } from "zod";

import { publicSlugSchema } from "../landing/schemas";

export const appointmentStatusSchema = z.enum([
  "pending",
  "confirmed",
  "in_progress",
  "completed",
  "cancelled",
  "no_show",
]);

export const appointmentIdSchema = z.uuid();

export const appointmentSchema = z.object({
  serviceId: z.uuid(),
  customerId: z.uuid(),
  startsAt: z.iso.datetime({ offset: true }),
  notes: z.string().trim().max(2_000).optional().nullable(),
  idempotencyKey: z.string().trim().min(16).max(200).optional(),
});

export const appointmentStatusUpdateSchema = z.object({
  id: appointmentIdSchema,
  status: appointmentStatusSchema,
  idempotencyKey: z.string().trim().min(16).max(200).optional(),
});

export const rescheduleAppointmentSchema = z.object({
  id: appointmentIdSchema,
  startsAt: z.iso.datetime({ offset: true }),
  idempotencyKey: z.string().trim().min(16).max(200).optional(),
});

export const publicBookingSchema = z.object({
  companySlug: publicSlugSchema,
  serviceId: z.uuid(),
  startsAt: z.iso.datetime({ offset: true }),
  customer: z.object({
    name: z.string().trim().min(2).max(120),
    email: z.email().optional().nullable(),
    phone: z.string().trim().min(8).max(32),
  }),
  objective: z.string().trim().max(500).optional().nullable(),
  notes: z.string().trim().max(2_000).optional().nullable(),
  idempotencyKey: z.string().trim().min(16).max(200).optional(),
});

export const availabilityQuerySchema = z.object({
  companySlug: publicSlugSchema,
  serviceId: z.uuid(),
  date: z.iso.date(),
});

export const availabilityRuleSchema = z.object({
  weekday: z.number().int().min(0).max(6),
  startTime: z.string().regex(/^\d{2}:\d{2}$/),
  endTime: z.string().regex(/^\d{2}:\d{2}$/),
  enabled: z.boolean().default(true),
});

export const publicAvailabilityActionSchema = z.object({
  slug: publicSlugSchema,
  serviceId: z.uuid(),
  date: z.iso.date(),
});

export const publicBookingActionSchema = z.object({
  slug: publicSlugSchema,
  serviceId: z.uuid(),
  startsAt: z.iso.datetime({ offset: true }),
  customerName: z.string().trim().min(2).max(120),
  customerPhone: z.string().trim().min(8).max(32),
  customerEmail: z
    .union([z.literal(""), z.email()])
    .optional()
    .transform((value) => (value ? value : null)),
  objective: z.string().trim().max(500).optional().nullable(),
  notes: z.string().trim().max(2_000).optional().nullable(),
});

export const cancelAppointmentSchema = z.object({
  id: appointmentIdSchema,
  reason: z.string().trim().min(1, "Informe o motivo do cancelamento.").max(500),
  idempotencyKey: z.string().trim().min(16).max(200).optional(),
});

export const appointmentPanelViewSchema = z.enum(["list", "day", "week", "month"]);

export const appointmentTimeframeSchema = z.enum(["all", "upcoming", "past"]);

export const listAppointmentsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  from: z.iso.date().optional(),
  to: z.iso.date().optional(),
  anchorDate: z.iso.date().optional(),
  status: z
    .union([appointmentStatusSchema, z.array(appointmentStatusSchema)])
    .optional()
    .transform((value) => {
      if (!value) return undefined;
      return Array.isArray(value) ? value : [value];
    }),
  serviceId: z.uuid().optional(),
  customerId: z.uuid().optional(),
  q: z.string().trim().max(120).optional(),
  timeframe: appointmentTimeframeSchema.default("all"),
  view: appointmentPanelViewSchema.default("list"),
  sort: z.enum(["starts_at_asc", "starts_at_desc", "created_at_desc"]).default("starts_at_asc"),
});

export type ListAppointmentsQuery = z.infer<typeof listAppointmentsQuerySchema>;
export type AppointmentStatus = z.infer<typeof appointmentStatusSchema>;
export type AppointmentPanelView = z.infer<typeof appointmentPanelViewSchema>;
export type AppointmentTimeframe = z.infer<typeof appointmentTimeframeSchema>;
