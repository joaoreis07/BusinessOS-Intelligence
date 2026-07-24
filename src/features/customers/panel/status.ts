import type { CustomerStatus } from "../schemas";

export const CUSTOMER_STATUS_LABELS: Record<CustomerStatus, string> = {
  new: "Novo",
  active: "Ativo",
  following: "Em acompanhamento",
  inactive: "Inativo",
};

export function customerStatusTone(status: CustomerStatus) {
  if (status === "active") return "bg-emerald-50 text-emerald-700";
  if (status === "following") return "bg-sky-50 text-sky-700";
  if (status === "inactive") return "bg-slate-100 text-slate-600";
  return "bg-amber-50 text-amber-800";
}
