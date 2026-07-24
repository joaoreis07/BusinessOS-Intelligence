import type { DashboardAlertDTO, DashboardKpiDTO, DashboardSummaryDTO } from "@/features/dashboard/types";
import { formatCurrencyFromCents } from "@/lib/utils";

import type {
  AiAlertDTO,
  AiDailySummaryDTO,
  AiRecommendationDTO,
  AiWeeklyReportDTO,
} from "./types";

function formatPercent(value: number) {
  return `${Math.abs(Math.round(value))}%`;
}

export function buildAiDailySummary(input: {
  companyName: string;
  data: Pick<DashboardSummaryDTO, "today" | "kpis" | "nextAppointment">;
  capabilities: { scheduling: boolean; customers: boolean; finance: boolean };
}): AiDailySummaryDTO {
  const highlights: AiDailySummaryDTO["highlights"] = [];

  if (input.capabilities.scheduling) {
    highlights.push({
      label: "Atendimentos hoje",
      value: String(input.data.kpis.appointmentsToday),
    });
  }
  if (input.capabilities.customers) {
    highlights.push({
      label: "Clientes ativos",
      value: String(input.data.kpis.activeCustomers),
    });
  }
  if (input.capabilities.finance) {
    highlights.push({
      label: "Receita do mês",
      value: formatCurrencyFromCents(input.data.kpis.monthIncomeCents),
    });
    highlights.push({
      label: "Pendências",
      value: formatCurrencyFromCents(input.data.kpis.pendingCents),
    });
  }

  const paragraphs: string[] = [];

  if (input.capabilities.scheduling) {
    if (input.data.kpis.appointmentsToday === 0) {
      paragraphs.push(
        "Sua agenda está livre hoje. Este é um bom momento para divulgar horários disponíveis ou reativar clientes inativos.",
      );
    } else {
      paragraphs.push(
        `Você tem ${input.data.kpis.appointmentsToday} atendimento(s) programado(s) para hoje.`,
      );
    }

    if (input.data.nextAppointment) {
      paragraphs.push(
        `Próximo atendimento com ${input.data.nextAppointment.customerName} (${input.data.nextAppointment.serviceName}).`,
      );
    }
  }

  if (input.capabilities.customers) {
    paragraphs.push(
      `${input.data.kpis.activeCustomers} cliente(s) ativo(s) compõem sua base atual.`,
    );
  }

  if (input.capabilities.finance) {
    paragraphs.push(
      `A receita acumulada no mês é ${formatCurrencyFromCents(input.data.kpis.monthIncomeCents)} e há ${formatCurrencyFromCents(input.data.kpis.pendingCents)} em valores pendentes.`,
    );
  }

  if (!paragraphs.length) {
    paragraphs.push(
      "Ative os módulos de agenda, clientes e financeiro para receber um resumo mais completo.",
    );
  }

  return {
    headline: `Resumo do dia para ${input.companyName}`,
    paragraphs,
    highlights,
  };
}

export function buildAiAlerts(input: {
  dashboardAlerts: DashboardAlertDTO[];
  inactiveCustomers: number;
  appointmentsToday: number;
  pendingCents: number;
  revenueDeltaPercent: number | null;
}): AiAlertDTO[] {
  const alerts: AiAlertDTO[] = [];

  for (const alert of input.dashboardAlerts) {
    if (alert.id === "all-clear") continue;

    alerts.push({
      id: `dashboard-${alert.id}`,
      category: alert.title.toLowerCase().includes("agendamento")
        ? "scheduling"
        : "finance",
      tone:
        alert.tone === "danger"
          ? "danger"
          : alert.tone === "warning"
            ? "warning"
            : "info",
      title: alert.title,
      description: alert.description,
      href: alert.href,
    });
  }

  if (input.inactiveCustomers > 0) {
    alerts.push({
      id: "inactive-customers",
      category: "customers",
      tone: "warning",
      title: "Clientes inativos",
      description: `${input.inactiveCustomers} cliente(s) estão inativos e podem precisar de reativação.`,
      href: "/dashboard/clientes?status=inactive",
    });
  }

  if (input.appointmentsToday === 0) {
    alerts.push({
      id: "empty-agenda",
      category: "scheduling",
      tone: "info",
      title: "Agenda vazia hoje",
      description: "Não há atendimentos confirmados para hoje.",
      href: "/dashboard/agenda",
    });
  }

  if (input.pendingCents > 0) {
    alerts.push({
      id: "pending-receivables",
      category: "finance",
      tone: "warning",
      title: "Valores pendentes",
      description: `${formatCurrencyFromCents(input.pendingCents)} aguardam confirmação ou recebimento.`,
      href: "/dashboard/financeiro",
    });
  }

  if (input.revenueDeltaPercent !== null && input.revenueDeltaPercent <= -15) {
    alerts.push({
      id: "revenue-drop",
      category: "finance",
      tone: "danger",
      title: "Queda de receita semanal",
      description: `A receita caiu ${formatPercent(input.revenueDeltaPercent)} em relação à semana anterior.`,
      href: "/dashboard/financeiro",
    });
  }

  if (!alerts.length) {
    alerts.push({
      id: "all-clear",
      category: "general",
      tone: "success",
      title: "Operação saudável",
      description: "Nenhum alerta relevante foi identificado para o momento.",
    });
  }

  return alerts.slice(0, 8);
}

export function buildAiRecommendations(input: {
  inactiveCustomers: number;
  appointmentsToday: number;
  pendingCents: number;
  revenueDeltaPercent: number | null;
  capabilities: { scheduling: boolean; customers: boolean; finance: boolean };
}): AiRecommendationDTO[] {
  const recommendations: AiRecommendationDTO[] = [];

  if (input.capabilities.finance && input.pendingCents > 0) {
    recommendations.push({
      id: "collect-pending",
      category: "finance",
      priority: "high",
      title: "Priorize recebimentos pendentes",
      description:
        "Revise lançamentos pendentes e confirme pagamentos para melhorar o fluxo de caixa da semana.",
      actionLabel: "Abrir financeiro",
      href: "/dashboard/financeiro",
    });
  }

  if (input.capabilities.customers && input.inactiveCustomers > 0) {
    recommendations.push({
      id: "reactivate-customers",
      category: "customers",
      priority: input.inactiveCustomers >= 5 ? "high" : "medium",
      title: "Reative clientes inativos",
      description: `Entre em contato com ${input.inactiveCustomers} cliente(s) inativo(s) para retomar o relacionamento.`,
      actionLabel: "Ver clientes inativos",
      href: "/dashboard/clientes?status=inactive",
    });
  }

  if (input.capabilities.scheduling && input.appointmentsToday === 0) {
    recommendations.push({
      id: "promote-open-slots",
      category: "marketing",
      priority: "medium",
      title: "Divulgue horários disponíveis",
      description:
        "Use sua landing page ou WhatsApp para preencher a agenda com novos agendamentos.",
      actionLabel: "Ver landing page",
      href: "/dashboard/landing",
    });
  }

  if (
    input.capabilities.finance &&
    input.revenueDeltaPercent !== null &&
    input.revenueDeltaPercent <= -10
  ) {
    recommendations.push({
      id: "review-pricing",
      category: "finance",
      priority: "medium",
      title: "Analise receita e ticket médio",
      description:
        "A receita semanal caiu. Avalie serviços mais rentáveis e oportunidades de upsell.",
      actionLabel: "Analisar financeiro",
      href: "/dashboard/financeiro",
    });
  }

  if (input.capabilities.scheduling && input.appointmentsToday >= 3) {
    recommendations.push({
      id: "prepare-agenda",
      category: "scheduling",
      priority: "low",
      title: "Prepare a sequência de atendimentos",
      description:
        "Confirme objetivos e histórico dos clientes antes dos próximos atendimentos do dia.",
      actionLabel: "Abrir agenda",
      href: "/dashboard/agenda",
    });
  }

  if (!recommendations.length) {
    recommendations.push({
      id: "keep-momentum",
      category: "scheduling",
      priority: "low",
      title: "Mantenha o ritmo atual",
      description:
        "Continue registrando atendimentos, clientes e receitas para enriquecer os próximos insights.",
      actionLabel: "Abrir dashboard",
      href: "/dashboard",
    });
  }

  return recommendations.slice(0, 6);
}

export function buildAiWeeklyReport(input: {
  weekFrom: string;
  weekTo: string;
  appointmentsTotal: number;
  newCustomers: number;
  weekIncomeCents: number;
  pendingCents: number;
  inactiveCustomers: number;
}): AiWeeklyReportDTO {
  const periodLabel = `${formatShortDate(input.weekFrom)} — ${formatShortDate(input.weekTo)}`;

  return {
    periodLabel,
    sections: [
      {
        title: "Agenda",
        body: `${input.appointmentsTotal} atendimento(s) registrado(s) na semana.`,
      },
      {
        title: "Clientes",
        body: `${input.newCustomers} novo(s) cliente(s) e ${input.inactiveCustomers} inativo(s) no momento.`,
      },
      {
        title: "Financeiro",
        body: `Receita de ${formatCurrencyFromCents(input.weekIncomeCents)} na semana, com ${formatCurrencyFromCents(input.pendingCents)} ainda pendentes.`,
      },
    ],
  };
}

export function calculateRevenueDeltaPercent(currentCents: number, previousCents: number) {
  if (previousCents <= 0) {
    return currentCents > 0 ? 100 : null;
  }
  return ((currentCents - previousCents) / previousCents) * 100;
}

function formatShortDate(date: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "short",
  }).format(new Date(`${date}T12:00:00`));
}
