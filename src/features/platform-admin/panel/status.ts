export const COMPANY_STATUS_LABELS: Record<string, string> = {
  trial: "Trial",
  active: "Ativa",
  inactive: "Inativa",
  blocked: "Bloqueada",
  cancelled: "Cancelada",
};

export const SUBSCRIPTION_STATUS_LABELS: Record<string, string> = {
  trial: "Trial",
  active: "Ativa",
  pending: "Pendente",
  past_due: "Inadimplente",
  cancelled: "Cancelada",
  suspended: "Suspensa",
  expired: "Expirada",
};

export function companyStatusTone(status: string) {
  if (status === "active") return "bg-emerald-50 text-emerald-700";
  if (status === "trial") return "bg-sky-50 text-sky-700";
  if (status === "blocked" || status === "cancelled") return "bg-rose-50 text-rose-700";
  return "bg-slate-100 text-slate-600";
}

export function subscriptionStatusTone(status: string) {
  if (status === "active" || status === "trial") return "bg-emerald-50 text-emerald-700";
  if (status === "past_due" || status === "suspended") return "bg-rose-50 text-rose-700";
  return "bg-amber-50 text-amber-800";
}
