import type {
  PlatformActivityLogDTO,
  PlatformCompanyListItemDTO,
  PlatformMetricsDTO,
  PlatformSubscriptionListItemDTO,
  PlatformUserListItemDTO,
} from "./types";

export function mapPlatformMetrics(input: {
  total_companies?: number | null;
  active_companies?: number | null;
  trial_companies?: number | null;
  total_subscriptions?: number | null;
  monthly_revenue_cents?: number | null;
}): PlatformMetricsDTO {
  const mrrCents = Number(input.monthly_revenue_cents ?? 0);
  return {
    companies: Number(input.total_companies ?? 0),
    activeCompanies: Number(input.active_companies ?? 0),
    trialCompanies: Number(input.trial_companies ?? 0),
    totalSubscriptions: Number(input.total_subscriptions ?? 0),
    mrrCents,
    arrCents: mrrCents * 12,
  };
}

export function mapPlatformCompany(row: {
  id: string;
  name: string;
  slug: string;
  status: string;
  active: boolean;
  created_at: string;
}): PlatformCompanyListItemDTO {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    status: row.status,
    active: row.active,
    createdAt: row.created_at,
  };
}

export function mapPlatformUser(
  row: {
    id: string;
    full_name: string;
    phone: string | null;
    created_at: string;
  },
  platformRole: string | null,
): PlatformUserListItemDTO {
  return {
    id: row.id,
    fullName: row.full_name,
    phone: row.phone,
    createdAt: row.created_at,
    platformRole,
  };
}

export function mapPlatformSubscription(row: {
  id: string;
  status: string;
  company_id: string;
  current_period_ends_at: string | null;
  next_payment_at: string | null;
  companies: { name: string; slug: string } | Array<{ name: string; slug: string }> | null;
  plans: { name: string } | Array<{ name: string }> | null;
}): PlatformSubscriptionListItemDTO {
  const company = Array.isArray(row.companies) ? row.companies[0] : row.companies;
  const plan = Array.isArray(row.plans) ? row.plans[0] : row.plans;
  return {
    id: row.id,
    companyId: row.company_id,
    companyName: company?.name ?? "Empresa",
    companySlug: company?.slug ?? "",
    planName: plan?.name ?? "Plano",
    status: row.status,
    currentPeriodEndsAt: row.current_period_ends_at,
    nextPaymentAt: row.next_payment_at,
  };
}

export function mapPlatformActivityLog(row: {
  id: string;
  company_id: string | null;
  actor_user_id: string | null;
  action: string;
  module: string;
  entity_type: string | null;
  entity_id: string | null;
  created_at: string;
}): PlatformActivityLogDTO {
  return {
    id: row.id,
    companyId: row.company_id,
    actorUserId: row.actor_user_id,
    action: row.action,
    module: row.module,
    entityType: row.entity_type,
    entityId: row.entity_id,
    createdAt: row.created_at,
  };
}
