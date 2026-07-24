import { z } from "zod";

export const planKeySchema = z.enum(["starter_monthly", "pro_monthly", "premium_monthly"]);

export type PlanKey = z.infer<typeof planKeySchema>;

export const checkoutSchema = z.object({
  plan: planKeySchema,
  successUrl: z.url(),
  cancelUrl: z.url(),
});

export const billingPortalSchema = z.object({
  returnUrl: z.url(),
});

export const listSubscriptionPaymentsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(50).default(10),
});

export type ListSubscriptionPaymentsQuery = z.infer<typeof listSubscriptionPaymentsQuerySchema>;
