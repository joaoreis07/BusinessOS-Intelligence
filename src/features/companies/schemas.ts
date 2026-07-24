import { z } from "zod";

export const companySchema = z.object({
  name: z.string().trim().min(2).max(120),
  slug: z.string().trim().min(3).max(63).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  businessType: z.string().trim().max(80).optional().nullable(),
});

export const updateCompanySchema = companySchema.extend({
  legalName: z.string().trim().max(160).optional().nullable(),
  taxId: z.string().trim().max(32).optional().nullable(),
  email: z.email().optional().nullable(),
  phone: z.string().trim().max(32).optional().nullable(),
  whatsapp: z.string().trim().max(32).optional().nullable(),
  description: z.string().trim().max(1_000).optional().nullable(),
  city: z.string().trim().max(100).optional().nullable(),
  state: z.string().trim().max(2).optional().nullable(),
}).partial();

export type CompanyInput = z.infer<typeof companySchema>;
export type CompanyUpdate = z.infer<typeof updateCompanySchema>;
