import Link from "next/link";
import { AlertTriangle, Lightbulb, Sparkles } from "lucide-react";

import { Card } from "@/components/ui/card";
import {
  AI_CATEGORY_LABELS,
  AI_PRIORITY_LABELS,
  AI_RECOMMENDATION_CATEGORY_LABELS,
  aiAlertToneClass,
  aiRecommendationPriorityClass,
} from "@/features/ai/panel/status";
import type { AiPageDTO, AiPanelCapabilitiesDTO } from "@/features/ai/types";
import { cn } from "@/lib/utils";

type AiPanelProps = {
  data: AiPageDTO;
  capabilities: AiPanelCapabilitiesDTO;
};

export function AiPanel({ data, capabilities }: AiPanelProps) {
  if (!capabilities.featureEnabled) {
    return (
      <div className="space-y-6">
        <header>
          <p className="text-sm text-[var(--muted)]">BusinessOS AI</p>
          <h1 className="mt-1 text-3xl font-bold">Inteligência para o seu negócio</h1>
        </header>
        <Card className="space-y-4 p-6">
          <div className="inline-flex size-12 items-center justify-center rounded-2xl bg-violet-50 text-violet-700">
            <Sparkles size={22} />
          </div>
          <div>
            <h2 className="text-xl font-semibold">Disponível no Plano Premium</h2>
            <p className="mt-2 text-[var(--muted)]">
              Resumos inteligentes, alertas, recomendações e relatórios automáticos fazem parte do
              upgrade Premium.
            </p>
          </div>
          <Link href="/dashboard/assinatura" className="inline-flex text-sm font-medium text-[var(--primary)]">
            Ver planos e fazer upgrade
          </Link>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <header>
        <p className="text-sm text-[var(--muted)]">BusinessOS AI</p>
        <h1 className="mt-1 text-3xl font-bold">Insights do seu negócio</h1>
        <p className="mt-2 text-[var(--muted)]">
          Análises automáticas com base nos dados da sua empresa. Sugestões apenas — nenhuma ação é
          executada automaticamente.
        </p>
      </header>

      <Card className="space-y-5 p-6">
        <div className="flex items-center gap-3">
          <span className="grid size-10 place-items-center rounded-xl bg-violet-50 text-violet-700">
            <Sparkles size={18} />
          </span>
          <div>
            <h2 className="text-lg font-semibold">Resumo do dia</h2>
            <p className="text-sm text-[var(--muted)]">{data.dailySummary.headline}</p>
          </div>
        </div>
        {data.dailySummary.highlights.length ? (
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {data.dailySummary.highlights.map((item) => (
              <div key={item.label} className="rounded-xl border bg-[var(--surface-subtle)] p-4">
                <p className="text-sm text-[var(--muted)]">{item.label}</p>
                <p className="mt-1 text-xl font-semibold">{item.value}</p>
              </div>
            ))}
          </div>
        ) : null}
        <div className="space-y-2 text-sm leading-6 text-[var(--foreground)]">
          {data.dailySummary.paragraphs.map((paragraph) => (
            <p key={paragraph}>{paragraph}</p>
          ))}
        </div>
      </Card>

      <div className="grid gap-6 xl:grid-cols-2">
        <Card className="space-y-4 p-6">
          <div className="flex items-center gap-3">
            <AlertTriangle size={18} className="text-amber-600" />
            <h2 className="text-lg font-semibold">Alertas</h2>
          </div>
          <div className="space-y-3">
            {data.alerts.map((alert) => (
              <div
                key={alert.id}
                className={cn("rounded-xl border p-4", aiAlertToneClass(alert.tone))}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wide opacity-70">
                      {AI_CATEGORY_LABELS[alert.category]}
                    </p>
                    <p className="mt-1 font-semibold">{alert.title}</p>
                    <p className="mt-1 text-sm opacity-90">{alert.description}</p>
                  </div>
                </div>
                {alert.href ? (
                  <Link href={alert.href} className="mt-3 inline-flex text-sm font-medium underline">
                    Ver detalhes
                  </Link>
                ) : null}
              </div>
            ))}
          </div>
        </Card>

        <Card className="space-y-4 p-6">
          <div className="flex items-center gap-3">
            <Lightbulb size={18} className="text-violet-600" />
            <h2 className="text-lg font-semibold">Recomendações</h2>
          </div>
          <div className="space-y-3">
            {data.recommendations.map((item) => (
              <div key={item.id} className="rounded-xl border p-4">
                <div className="flex items-center gap-2">
                  <span
                    className={cn(
                      "rounded-full px-2.5 py-1 text-xs font-medium",
                      aiRecommendationPriorityClass(item.priority),
                    )}
                  >
                    {AI_PRIORITY_LABELS[item.priority]}
                  </span>
                  <span className="text-xs text-[var(--muted)]">
                    {AI_RECOMMENDATION_CATEGORY_LABELS[item.category]}
                  </span>
                </div>
                <p className="mt-3 font-semibold">{item.title}</p>
                <p className="mt-1 text-sm text-[var(--muted)]">{item.description}</p>
                {item.href && item.actionLabel ? (
                  <Link href={item.href} className="mt-3 inline-flex text-sm font-medium text-[var(--primary)]">
                    {item.actionLabel}
                  </Link>
                ) : null}
              </div>
            ))}
          </div>
        </Card>
      </div>

      <Card className="space-y-4 p-6">
        <h2 className="text-lg font-semibold">Relatório semanal automático</h2>
        <p className="text-sm text-[var(--muted)]">Período: {data.weeklyReport.periodLabel}</p>
        <div className="grid gap-4 md:grid-cols-3">
          {data.weeklyReport.sections.map((section) => (
            <div key={section.title} className="rounded-xl border bg-[var(--surface-subtle)] p-4">
              <p className="font-semibold">{section.title}</p>
              <p className="mt-2 text-sm text-[var(--muted)]">{section.body}</p>
            </div>
          ))}
        </div>
        <p className="text-xs text-[var(--muted)]">
          Gerado em {new Date(data.generatedAt).toLocaleString("pt-BR")}.
        </p>
      </Card>
    </div>
  );
}
