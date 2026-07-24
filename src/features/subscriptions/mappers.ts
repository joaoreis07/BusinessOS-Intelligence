import type {
  PlanDTO,
  PlanFeatureDTO,
  SubscriptionDTO,
  SubscriptionPaymentDTO,
  SubscriptionStatus,
} from "./types";
import type { PlanKey } from "./schemas";

type PlanRow = {
  code: string;
  name: string;
  description: string | null;
  price: number | string;
  currency: string;
  billing_interval: "month" | "year";
  trial_days: number;
  display_order?: number;
  plan_features?: Array<{
    feature_key: string;
    enabled: boolean;
    limits: Record<string, unknown> | null;
  }> | null;
};

type SubscriptionRow = {
  id: string;
  status: SubscriptionStatus;
  provider: string;
  trial_ends_at: string | null;
  current_period_starts_at: string;
  current_period_ends_at: string | null;
  next_payment_at: string | null;
  cancel_at_period_end: boolean;
  cancelled_at: string | null;
  grace_ends_at: string | null;
  plan_id: string;
};

type PaymentRow = {
  id: string;
  amount: number | string;
  currency: string;
  status: SubscriptionPaymentDTO["status"];
  due_at: string | null;
  paid_at: string | null;
  created_at: string;
};

export function mapPlanFeature(row: NonNullable<PlanRow["plan_features"]>[number]): PlanFeatureDTO {
  return {
    key: row.feature_key,
    enabled: row.enabled,
    limits: (row.limits ?? {}) as Record<string, unknown>,
  };
}

export function mapPlan(row: PlanRow): PlanDTO {
  return {
    code: row.code as PlanKey,
    name: row.name,
    description: row.description,
    priceCents: Math.round(Number(row.price) * 100),
    currency: row.currency,
    billingInterval: row.billing_interval,
    trialDays: row.trial_days,
    displayOrder: row.display_order ?? 0,
    features: (row.plan_features ?? []).filter((feature) => feature.enabled).map(mapPlanFeature),
  };
}

export function mapSubscription(row: SubscriptionRow, plan: PlanDTO): SubscriptionDTO {
  return {
    id: row.id,
    status: row.status,
    plan,
    trialEndsAt: row.trial_ends_at,
    currentPeriodStartsAt: row.current_period_starts_at,
    currentPeriodEndsAt: row.current_period_ends_at,
    nextPaymentAt: row.next_payment_at,
    cancelAtPeriodEnd: row.cancel_at_period_end,
    cancelledAt: row.cancelled_at,
    graceEndsAt: row.grace_ends_at,
    provider: row.provider,
  };
}

export function mapSubscriptionPayment(row: PaymentRow): SubscriptionPaymentDTO {
  return {
    id: row.id,
    amountCents: Math.round(Number(row.amount) * 100),
    currency: row.currency,
    status: row.status,
    dueAt: row.due_at,
    paidAt: row.paid_at,
    createdAt: row.created_at,
  };
}
