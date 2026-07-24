import { z } from "zod";

export const aiRefreshSchema = z.object({
  refresh: z.boolean().optional(),
});

export type AiRefreshInput = z.infer<typeof aiRefreshSchema>;
