import { z } from "zod";

export const serviceSchema = z.object({
  name: z.string().trim().min(2).max(120),
  description: z.string().trim().max(2_000).optional().nullable(),
  category: z.string().trim().max(80).optional().nullable(),
  durationMinutes: z.number().int().min(5).max(1_440),
  priceCents: z.number().int().nonnegative(),
  active: z.boolean().default(true),
  publiclyVisible: z.boolean().default(true),
  displayOrder: z.number().int().min(0).optional(),
});

export const serviceUpdateSchema = serviceSchema.partial();

export const serviceIdSchema = z.uuid();

export const serviceReorderSchema = z
  .array(
    z.object({
      id: serviceIdSchema,
      displayOrder: z.number().int().min(0),
    }),
  )
  .min(1)
  .max(200);

export type ServiceInput = z.infer<typeof serviceSchema>;
