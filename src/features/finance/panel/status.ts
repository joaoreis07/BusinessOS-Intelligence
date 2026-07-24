import type { FinancialKind, FinancialStatus } from "../schemas";

export const FINANCIAL_KIND_LABELS: Record<FinancialKind, string> = {
  income: "Receita",
  expense: "Despesa",
};

export const FINANCIAL_STATUS_LABELS: Record<FinancialStatus, string> = {
  pending: "Pendente",
  paid: "Pago",
  overdue: "Vencido",
  cancelled: "Cancelado",
};

export function financialStatusTone(status: FinancialStatus) {
  if (status === "paid") return "bg-emerald-50 text-emerald-700";
  if (status === "overdue") return "bg-rose-50 text-rose-700";
  if (status === "cancelled") return "bg-slate-100 text-slate-600";
  return "bg-amber-50 text-amber-800";
}

export function financialKindTone(kind: FinancialKind) {
  return kind === "income" ? "text-[var(--success)]" : "text-[var(--danger)]";
}
