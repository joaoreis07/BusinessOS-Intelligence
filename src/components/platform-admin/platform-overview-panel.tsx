import Link from "next/link";

import { Card } from "@/components/ui/card";
import {
  COMPANY_STATUS_LABELS,
  companyStatusTone,
} from "@/features/platform-admin/panel/status";
import type { PlatformOverviewDTO } from "@/features/platform-admin/types";
import { cn, formatCurrencyFromCents } from "@/lib/utils";

export function PlatformOverviewPanel({ data }: { data: PlatformOverviewDTO }) {
  const { metrics, recentCompanies } = data;

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-3xl font-bold">Painel executivo</h1>
        <p className="mt-2 text-[var(--muted)]">
          Indicadores globais da plataforma sem expor dados privados dos tenants.
        </p>
      </header>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <Card>
          <p className="text-sm text-[var(--muted)]">Empresas</p>
          <p className="mt-2 text-2xl font-bold">{metrics.companies}</p>
        </Card>
        <Card>
          <p className="text-sm text-[var(--muted)]">Ativas</p>
          <p className="mt-2 text-2xl font-bold">{metrics.activeCompanies}</p>
        </Card>
        <Card>
          <p className="text-sm text-[var(--muted)]">Em trial</p>
          <p className="mt-2 text-2xl font-bold">{metrics.trialCompanies}</p>
        </Card>
        <Card>
          <p className="text-sm text-[var(--muted)]">Assinaturas</p>
          <p className="mt-2 text-2xl font-bold">{metrics.totalSubscriptions}</p>
        </Card>
        <Card>
          <p className="text-sm text-[var(--muted)]">MRR</p>
          <p className="mt-2 text-2xl font-bold">{formatCurrencyFromCents(metrics.mrrCents)}</p>
        </Card>
        <Card>
          <p className="text-sm text-[var(--muted)]">ARR</p>
          <p className="mt-2 text-2xl font-bold">{formatCurrencyFromCents(metrics.arrCents)}</p>
        </Card>
      </section>

      <Card className="p-0">
        <div className="flex items-center justify-between border-b p-5">
          <h2 className="text-lg font-semibold">Empresas recentes</h2>
          <Link href="/admin/empresas" className="text-sm font-medium text-[var(--primary)]">
            Ver todas
          </Link>
        </div>
        <div className="divide-y">
          {recentCompanies.length === 0 ? (
            <p className="p-5 text-sm text-[var(--muted)]">Nenhuma empresa cadastrada.</p>
          ) : (
            recentCompanies.map((company) => (
              <div key={company.id} className="flex items-center justify-between gap-4 p-4">
                <div>
                  <p className="font-medium">{company.name}</p>
                  <p className="text-sm text-[var(--muted)]">/{company.slug}</p>
                </div>
                <span
                  className={cn(
                    "rounded-full px-2.5 py-1 text-xs font-medium",
                    companyStatusTone(company.status),
                  )}
                >
                  {COMPANY_STATUS_LABELS[company.status] ?? company.status}
                </span>
              </div>
            ))
          )}
        </div>
      </Card>
    </div>
  );
}
