import { z } from "zod";

export const adminListSchema = z.object({
  search: z.string().trim().max(120).default(""),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(25),
});

export const adminCompaniesQuerySchema = adminListSchema.extend({
  status: z.enum(["trial", "active", "inactive", "blocked", "cancelled"]).optional(),
});

export const adminSubscriptionsQuerySchema = adminListSchema.extend({
  status: z
    .enum(["trial", "active", "pending", "past_due", "cancelled", "suspended", "expired"])
    .optional(),
});

export const adminLogsQuerySchema = adminListSchema.extend({
  module: z.string().trim().max(80).optional(),
});

export const updateCompanyStatusSchema = z.object({
  companyId: z.uuid(),
  status: z.enum(["trial", "active", "inactive", "blocked", "cancelled"]),
  active: z.boolean().optional(),
});

export type AdminListQuery = z.infer<typeof adminListSchema>;
export type AdminCompaniesQuery = z.infer<typeof adminCompaniesQuerySchema>;
export type AdminSubscriptionsQuery = z.infer<typeof adminSubscriptionsQuerySchema>;
export type AdminLogsQuery = z.infer<typeof adminLogsQuerySchema>;
