import type { PlanKey } from "./schemas";

export type SubscriptionStatus =
  | "trial"
  | "active"
  | "pending"
  | "past_due"
  | "cancelled"
  | "suspended"
  | "expired";

export type PaymentStatus = "pending" | "approved" | "failed" | "refunded" | "cancelled";

export type PlanFeatureDTO = {
  key: string;
  enabled: boolean;
  limits: Record<string, unknown>;
};

export type PlanDTO = {
  code: PlanKey;
  name: string;
  description: string | null;
  priceCents: number;
  currency: string;
  billingInterval: "month" | "year";
  trialDays: number;
  displayOrder: number;
  features: PlanFeatureDTO[];
};

export type SubscriptionDTO = {
  id: string;
  status: SubscriptionStatus;
  plan: PlanDTO;
  trialEndsAt: string | null;
  currentPeriodStartsAt: string;
  currentPeriodEndsAt: string | null;
  nextPaymentAt: string | null;
  cancelAtPeriodEnd: boolean;
  cancelledAt: string | null;
  graceEndsAt: string | null;
  provider: string;
};

export type SubscriptionPaymentDTO = {
  id: string;
  amountCents: number;
  currency: string;
  status: PaymentStatus;
  dueAt: string | null;
  paidAt: string | null;
  createdAt: string;
};

export type PaginatedSubscriptionPaymentsDTO = {
  items: SubscriptionPaymentDTO[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
};

export type SubscriptionPanelCapabilitiesDTO = {
  canManage: boolean;
};

export type SubscriptionPageDTO = {
  subscription: SubscriptionDTO | null;
  plans: PlanDTO[];
  payments: PaginatedSubscriptionPaymentsDTO;
};
