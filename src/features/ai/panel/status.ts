import type { AiAlertDTO, AiRecommendationDTO } from "../types";

export const AI_CATEGORY_LABELS: Record<AiAlertDTO["category"], string> = {
  finance: "Financeiro",
  scheduling: "Agenda",
  customers: "Clientes",
  general: "Geral",
};

export const AI_RECOMMENDATION_CATEGORY_LABELS: Record<AiRecommendationDTO["category"], string> = {
  scheduling: "Agenda",
  customers: "Clientes",
  finance: "Financeiro",
  marketing: "Marketing",
};

export const AI_PRIORITY_LABELS: Record<AiRecommendationDTO["priority"], string> = {
  high: "Alta",
  medium: "Média",
  low: "Baixa",
};

export function aiAlertToneClass(tone: AiAlertDTO["tone"]) {
  if (tone === "danger") return "border-rose-200 bg-rose-50 text-rose-900";
  if (tone === "warning") return "border-amber-200 bg-amber-50 text-amber-900";
  if (tone === "success") return "border-emerald-200 bg-emerald-50 text-emerald-900";
  return "border-sky-200 bg-sky-50 text-sky-900";
}

export function aiRecommendationPriorityClass(priority: AiRecommendationDTO["priority"]) {
  if (priority === "high") return "bg-rose-50 text-rose-700";
  if (priority === "medium") return "bg-amber-50 text-amber-800";
  return "bg-slate-100 text-slate-600";
}
