import { z } from "zod";

export const switchCompanySchema = z.object({
  companyId: z.uuid(),
});

export const workspacePreferencesSchema = z.object({
  locale: z.string().trim().min(2).max(10),
  timezone: z.string().trim().min(3).max(120),
  dateFormat: z.string().trim().min(4).max(20),
  timeFormat: z.enum(["12h", "24h"]),
});
