import type { SubscriptionStatus, PaymentStatus } from "../types";

export const SUBSCRIPTION_STATUS_LABELS: Record<SubscriptionStatus, string> = {
  trial: "Trial",
  active: "Ativa",
  pending: "Pendente",
  past_due: "Inadimplente",
  cancelled: "Cancelada",
  suspended: "Suspensa",
  expired: "Expirada",
};

export const PAYMENT_STATUS_LABELS: Record<PaymentStatus, string> = {
  pending: "Pendente",
  approved: "Aprovado",
  failed: "Falhou",
  refunded: "Estornado",
  cancelled: "Cancelado",
};

export const PLAN_FEATURE_LABELS: Record<string, string> = {
  landing: "Landing page",
  appointments: "Agendamentos",
  crm: "CRM",
  financial: "Financeiro",
  advanced_reports: "Relatórios avançados",
  automations: "Automações",
  advanced_integrations: "Integrações avançadas",
  ai: "Inteligência Artificial",
};

export function subscriptionStatusTone(status: SubscriptionStatus) {
  if (status === "active" || status === "trial") return "bg-emerald-50 text-emerald-700";
  if (status === "past_due" || status === "suspended") return "bg-rose-50 text-rose-700";
  if (status === "cancelled" || status === "expired") return "bg-slate-100 text-slate-600";
  return "bg-amber-50 text-amber-800";
}

export function paymentStatusTone(status: PaymentStatus) {
  if (status === "approved") return "bg-emerald-50 text-emerald-700";
  if (status === "failed") return "bg-rose-50 text-rose-700";
  if (status === "refunded" || status === "cancelled") return "bg-slate-100 text-slate-600";
  return "bg-amber-50 text-amber-800";
}

export function isSubscriptionAtRisk(status: SubscriptionStatus) {
  return status === "past_due" || status === "suspended" || status === "expired";
}

export function comparePlanOrder(currentCode: string, targetCode: string, plans: Array<{ code: string; displayOrder: number }>) {
  const current = plans.find((plan) => plan.code === currentCode)?.displayOrder ?? 0;
  const target = plans.find((plan) => plan.code === targetCode)?.displayOrder ?? 0;
  if (target > current) return "upgrade";
  if (target < current) return "downgrade";
  return "current";
}
