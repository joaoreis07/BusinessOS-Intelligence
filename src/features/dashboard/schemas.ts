import { z } from "zod";

export const dashboardPeriodSchema = z.object({
  from: z.iso.date(),
  to: z.iso.date(),
});

export type DashboardPeriod = z.infer<typeof dashboardPeriodSchema>;
