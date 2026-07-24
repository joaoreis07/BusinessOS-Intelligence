"use server";

import "server-only";

import { hasCompanyPermission } from "@/lib/permissions/company-permissions";
import type { CompanyRole } from "@/lib/tenancy/context";

import { authenticatedContext, unwrap } from "../_shared/server";
import { mapPlan, mapSubscription, mapSubscriptionPayment } from "./mappers";
import {
  billingPortalSchema,
  checkoutSchema,
  listSubscriptionPaymentsQuerySchema,
} from "./schemas";
import type {
  PaginatedSubscriptionPaymentsDTO,
  PlanDTO,
  SubscriptionDTO,
  SubscriptionPageDTO,
  SubscriptionPanelCapabilitiesDTO,
} from "./types";

const PLAN_SELECT =
  "id, code, name, description, price, currency, billing_interval, trial_days, display_order, plan_features(feature_key, enabled, limits)";

function assertBillingManager(role: string | null | undefined) {
  if (role !== "owner" && role !== "admin") {
    throw new Error("Sem permissão para gerenciar a assinatura.");
  }
}

export function resolveSubscriptionPanelCapabilities(
  role: CompanyRole,
): SubscriptionPanelCapabilitiesDTO {
  return {
    canManage: hasCompanyPermission(role, "subscription:manage"),
  };
}

async function fetchPlanById(
  supabase: Awaited<ReturnType<typeof import("@/lib/supabase/server").createClient>>,
  planId: string,
): Promise<PlanDTO> {
  const row = unwrap(
    await supabase.from("plans").select(PLAN_SELECT).eq("id", planId).single(),
    "Plano da assinatura não encontrado.",
  );
  return mapPlan(row);
}

export async function getSubscription(): Promise<SubscriptionDTO | null> {
  const { companyId, supabase } = await authenticatedContext("subscription:manage");
  const result = await supabase
    .from("subscriptions")
    .select("*")
    .eq("company_id", companyId)
    .maybeSingle();

  if (result.error) throw new Error(result.error.message);
  if (!result.data) return null;

  const plan = await fetchPlanById(supabase, result.data.plan_id);
  return mapSubscription(result.data, plan);
}

export async function listPlans(): Promise<PlanDTO[]> {
  const { supabase } = await authenticatedContext("subscription:manage");
  const rows = unwrap(
    await supabase
      .from("plans")
      .select(PLAN_SELECT)
      .eq("active", true)
      .is("deleted_at", null)
      .order("display_order"),
  );
  return rows.map(mapPlan);
}

export async function listSubscriptionPaymentsPaginated(
  input: unknown,
): Promise<PaginatedSubscriptionPaymentsDTO> {
  const value = listSubscriptionPaymentsQuerySchema.parse(input ?? {});
  const { companyId, supabase } = await authenticatedContext("subscription:manage");

  const from = (value.page - 1) * value.pageSize;
  const to = from + value.pageSize - 1;

  const result = await supabase
    .from("subscription_payments")
    .select("*", { count: "exact" })
    .eq("company_id", companyId)
    .order("created_at", { ascending: false })
    .range(from, to);

  if (result.error) throw new Error(result.error.message);

  const rows = result.data ?? [];
  const total = result.count ?? rows.length;

  return {
    items: rows.map(mapSubscriptionPayment),
    page: value.page,
    pageSize: value.pageSize,
    total,
    totalPages: Math.max(1, Math.ceil(total / value.pageSize)),
  };
}

export async function getSubscriptionPageData(
  paymentsInput: unknown,
): Promise<SubscriptionPageDTO> {
  const [subscription, plans, payments] = await Promise.all([
    getSubscription(),
    listPlans(),
    listSubscriptionPaymentsPaginated(paymentsInput),
  ]);

  return { subscription, plans, payments };
}

export async function createCheckout(input: unknown) {
  const value = checkoutSchema.parse(input);
  const { companyId, role, supabase } = await authenticatedContext("subscription:manage");
  assertBillingManager(role);
  return unwrap(
    await supabase.rpc("create_subscription_checkout", {
      p_company_id: companyId,
      p_plan_key: value.plan,
      p_success_url: value.successUrl,
      p_cancel_url: value.cancelUrl,
    }),
  );
}

export async function createBillingPortal(input: unknown) {
  const value = billingPortalSchema.parse(input);
  const { companyId, role, supabase } = await authenticatedContext("subscription:manage");
  assertBillingManager(role);
  return unwrap(
    await supabase.rpc("create_billing_portal", {
      p_company_id: companyId,
      p_return_url: value.returnUrl,
    }),
  );
}

export async function cancelSubscription() {
  const { companyId, role, supabase } = await authenticatedContext("subscription:manage");
  assertBillingManager(role);
  return unwrap(
    await supabase.rpc("cancel_subscription", { p_company_id: companyId }),
  );
}
