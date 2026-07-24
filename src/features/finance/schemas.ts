import { z } from "zod";

export const financialKindSchema = z.enum(["income", "expense"]);
export const financialStatusSchema = z.enum(["pending", "paid", "overdue", "cancelled"]);

export type FinancialKind = z.infer<typeof financialKindSchema>;
export type FinancialStatus = z.infer<typeof financialStatusSchema>;

export const financialEntrySchema = z.object({
  kind: financialKindSchema,
  description: z.string().trim().min(2).max(200),
  amountCents: z.number().int().positive(),
  dueDate: z.iso.date(),
  paidAt: z.iso.datetime({ offset: true }).optional().nullable(),
  status: financialStatusSchema.default("pending"),
  categoryId: z.uuid(),
  customerId: z.uuid().optional().nullable(),
  serviceId: z.uuid().optional().nullable(),
  appointmentId: z.uuid().optional().nullable(),
});

export const financialEntryUpdateSchema = financialEntrySchema.partial();
export const financialEntryIdSchema = z.uuid();

export const financePeriodSchema = z.object({
  from: z.iso.date(),
  to: z.iso.date(),
});

export const listFinancialEntriesQuerySchema = financePeriodSchema.extend({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  q: z.string().trim().max(120).optional(),
  kind: financialKindSchema.optional(),
  status: financialStatusSchema.optional(),
  sort: z.enum(["due_date_desc", "due_date_asc", "created_at_desc"]).default("due_date_desc"),
});

export type FinancialEntryInput = z.infer<typeof financialEntrySchema>;
export type ListFinancialEntriesQuery = z.infer<typeof listFinancialEntriesQuerySchema>;
