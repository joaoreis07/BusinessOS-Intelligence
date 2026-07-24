import { z } from "zod";

export const customerStatusSchema = z.enum(["new", "active", "following", "inactive"]);

export type CustomerStatus = z.infer<typeof customerStatusSchema>;

export const customerSchema = z.object({
  name: z.string().trim().min(2).max(120),
  email: z.email().optional().nullable(),
  phone: z.string().trim().min(8).max(32),
  whatsapp: z.string().trim().max(32).optional().nullable(),
  birthDate: z.iso.date().optional().nullable(),
  city: z.string().trim().max(100).optional().nullable(),
  state: z.string().trim().max(2).optional().nullable(),
  profession: z.string().trim().max(120).optional().nullable(),
  acquisitionSource: z.string().trim().max(80).optional().nullable(),
  objectives: z.string().trim().max(5_000).optional().nullable(),
  status: customerStatusSchema.default("new"),
});

export const customerUpdateSchema = customerSchema.partial();

export const customerIdSchema = z.uuid();

export const customerSearchSchema = z.string().trim().max(120).default("");

export const listCustomersQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  q: z.string().trim().max(120).optional(),
  status: customerStatusSchema.optional(),
  sort: z.enum(["name_asc", "name_desc", "created_at_desc"]).default("name_asc"),
});

export const customerNoteSchema = z.object({
  customerId: z.uuid(),
  content: z.string().trim().min(1).max(10_000),
});

export type CustomerInput = z.infer<typeof customerSchema>;
export type ListCustomersQuery = z.infer<typeof listCustomersQuerySchema>;
