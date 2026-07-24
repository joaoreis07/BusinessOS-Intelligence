import Link from "next/link";
import {
  AlertTriangle,
  CalendarDays,
  CircleDollarSign,
  Clock3,
  Plus,
  Users,
} from "lucide-react";

import { Card } from "@/components/ui/card";
import { CUSTOMER_STATUS_LABELS } from "@/features/customers/panel/status";
import type {
  DashboardCapabilitiesDTO,
  DashboardSummaryDTO,
} from "@/features/dashboard/types";
import { APPOINTMENT_STATUS_LABELS } from "@/features/scheduling/panel/status";
import type { AppointmentStatus } from "@/features/scheduling/schemas";
import { cn, formatCurrencyFromCents } from "@/lib/utils";

type DashboardPanelProps = {
  companyName: string;
  timezone: string;
  data: DashboardSummaryDTO;
  capabilities: DashboardCapabilitiesDTO;
};

export function DashboardPanel({
  companyName,
  timezone,
  data,
  capabilities,
}: DashboardPanelProps) {
  const chartMax = Math.max(
    1,
    ...data.chart.flatMap((point) => [point.incomeCents, point.expenseCents]),
  );

  return (
    <div className="space-y-8">
      <header className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-sm text-[var(--muted)]">Visão geral</p>
          <h1 className="mt-1 text-3xl font-bold">Olá, {companyName}</h1>
          <p className="mt-2 text-[var(--muted)]">
            Acompanhe o que precisa de atenção hoje e no mês corrente.
          </p>
        </div>
        <QuickActions capabilities={capabilities} />
      </header>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {capabilities.scheduling ? (
          <KpiCard
            label="Atendimentos hoje"
            value={String(data.kpis.appointmentsToday)}
            icon={CalendarDays}
          />
        ) : null}
        {capabilities.customers ? (
          <KpiCard
            label="Clientes ativos"
            value={String(data.kpis.activeCustomers)}
            icon={Users}
          />
        ) : null}
        {capabilities.finance ? (
          <>
            <KpiCard
              label="Receita do mês"
              value={formatCurrencyFromCents(data.kpis.monthIncomeCents)}
              icon={CircleDollarSign}
              tone="success"
            />
            <KpiCard
              label="Valores pendentes"
              value={formatCurrencyFromCents(data.kpis.pendingCents)}
              icon={Clock3}
              tone="warning"
            />
          </>
        ) : null}
      </section>

      <div className="grid gap-6 xl:grid-cols-3">
        {capabilities.scheduling ? (
          <>
            <Card className="space-y-4 p-5 xl:col-span-1">
              <div className="flex items-center justify-between gap-3">
                <h2 className="text-lg font-semibold">Próximo atendimento</h2>
                <Link href="/dashboard/agenda" className="text-sm font-medium text-[var(--primary)]">
                  Ver agenda
                </Link>
              </div>
              {data.nextAppointment ? (
                <div>
                  <p className="text-xl font-semibold">{data.nextAppointment.customerName}</p>
                  <p className="mt-1 text-sm text-[var(--muted)]">{data.nextAppointment.serviceName}</p>
                  <p className="mt-3 text-sm">
                    {formatDateTime(data.nextAppointment.startsAt, timezone)}
                  </p>
                  <Link
                    href={`/dashboard/agenda?selected=${data.nextAppointment.id}`}
                    className="mt-4 inline-flex text-sm font-medium text-[var(--primary)] hover:underline"
                  >
                    Abrir agendamento
                  </Link>
                </div>
              ) : (
                <p className="text-sm text-[var(--muted)]">Nenhum atendimento restante para hoje.</p>
              )}
            </Card>

            <Card className="space-y-4 p-5 xl:col-span-2">
              <div className="flex items-center justify-between gap-3">
                <h2 className="text-lg font-semibold">Agenda do dia</h2>
                <span className="text-sm text-[var(--muted)]">{data.today}</span>
              </div>
              {data.todayAgenda.length ? (
                <div className="divide-y">
                  {data.todayAgenda.map((appointment) => (
                    <Link
                      key={appointment.id}
                      href={`/dashboard/agenda?selected=${appointment.id}`}
                      className="flex flex-wrap items-center justify-between gap-3 py-3 text-sm hover:bg-[var(--surface-subtle)]"
                    >
                      <div>
                        <p className="font-medium">{appointment.customerName}</p>
                        <p className="text-[var(--muted)]">{appointment.serviceName}</p>
                      </div>
                      <div className="text-right">
                        <p>{formatTime(appointment.startsAt, timezone)}</p>
                        <span className="mt-1 inline-flex rounded-full bg-[var(--surface-subtle)] px-2 py-0.5 text-xs font-semibold">
                          {APPOINTMENT_STATUS_LABELS[appointment.status as AppointmentStatus] ??
                            appointment.status}
                        </span>
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-[var(--muted)]">Nenhum atendimento agendado para hoje.</p>
              )}
            </Card>
          </>
        ) : null}

        <Card className="space-y-4 p-5">
          <div className="flex items-center gap-2">
            <AlertTriangle size={18} className="text-amber-600" />
            <h2 className="text-lg font-semibold">Alertas</h2>
          </div>
          <div className="space-y-3">
            {data.alerts.map((alert) => (
              <div
                key={alert.id}
                className={cn(
                  "rounded-xl border p-3",
                  alert.tone === "danger" && "border-rose-200 bg-rose-50",
                  alert.tone === "warning" && "border-amber-200 bg-amber-50",
                  alert.tone === "info" && "border-slate-200 bg-slate-50",
                )}
              >
                <p className="font-medium">{alert.title}</p>
                <p className="mt-1 text-sm text-[var(--muted)]">{alert.description}</p>
                {alert.href ? (
                  <Link href={alert.href} className="mt-2 inline-flex text-sm font-medium text-[var(--primary)]">
                    Ver detalhes
                  </Link>
                ) : null}
              </div>
            ))}
          </div>
        </Card>

        {capabilities.customers ? (
          <Card className="space-y-4 p-5">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-lg font-semibold">Clientes recentes</h2>
              <Link href="/dashboard/clientes" className="text-sm font-medium text-[var(--primary)]">
                Ver todos
              </Link>
            </div>
            {data.recentCustomers.length ? (
              <div className="divide-y">
                {data.recentCustomers.map((customer) => (
                  <Link
                    key={customer.id}
                    href={`/dashboard/clientes/${customer.id}`}
                    className="flex items-center justify-between gap-3 py-3 text-sm hover:bg-[var(--surface-subtle)]"
                  >
                    <div>
                      <p className="font-medium">{customer.name}</p>
                      <p className="text-[var(--muted)]">
                        {new Intl.DateTimeFormat("pt-BR").format(new Date(customer.createdAt))}
                      </p>
                    </div>
                    <span className="rounded-full bg-[var(--surface-subtle)] px-2 py-0.5 text-xs font-semibold">
                      {CUSTOMER_STATUS_LABELS[customer.status as keyof typeof CUSTOMER_STATUS_LABELS] ??
                        customer.status}
                    </span>
                  </Link>
                ))}
              </div>
            ) : (
              <p className="text-sm text-[var(--muted)]">Nenhum cliente cadastrado recentemente.</p>
            )}
          </Card>
        ) : null}

        {capabilities.finance ? (
          <Card className="space-y-4 p-5 xl:col-span-2">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-lg font-semibold">Receitas x despesas (7 dias)</h2>
              <Link href="/dashboard/financeiro" className="text-sm font-medium text-[var(--primary)]">
                Ver financeiro
              </Link>
            </div>
            <div className="grid grid-cols-7 gap-2">
              {data.chart.map((point) => (
                <div key={point.date} className="space-y-2 text-center">
                  <div className="flex h-32 items-end justify-center gap-1">
                    <span
                      className="w-3 rounded-t bg-emerald-500"
                      style={{ height: `${Math.max(8, (point.incomeCents / chartMax) * 100)}%` }}
                      title={`Receita ${formatCurrencyFromCents(point.incomeCents)}`}
                    />
                    <span
                      className="w-3 rounded-t bg-rose-400"
                      style={{ height: `${Math.max(8, (point.expenseCents / chartMax) * 100)}%` }}
                      title={`Despesa ${formatCurrencyFromCents(point.expenseCents)}`}
                    />
                  </div>
                  <p className="text-xs text-[var(--muted)]">{point.label}</p>
                </div>
              ))}
            </div>
          </Card>
        ) : null}
      </div>
    </div>
  );
}

function QuickActions({ capabilities }: { capabilities: DashboardCapabilitiesDTO }) {
  const linkClass =
    "inline-flex h-10 items-center justify-center gap-2 rounded-xl border px-4 text-sm font-semibold transition-colors";

  return (
    <div className="flex flex-wrap gap-2">
      {capabilities.scheduling ? (
        <Link href="/dashboard/agenda" className={cn(linkClass, "bg-white hover:bg-[var(--surface-subtle)]")}>
          Agenda
        </Link>
      ) : null}
      {capabilities.customersManage ? (
        <Link
          href="/dashboard/clientes"
          className={cn(linkClass, "border-transparent bg-[var(--primary)] text-white hover:bg-[var(--primary-hover)]")}
        >
          <Plus size={16} />
          Novo cliente
        </Link>
      ) : null}
      {capabilities.financeManage ? (
        <Link href="/dashboard/financeiro" className={cn(linkClass, "bg-white hover:bg-[var(--surface-subtle)]")}>
          Nova movimentação
        </Link>
      ) : null}
    </div>
  );
}

function KpiCard({
  label,
  value,
  icon: Icon,
  tone = "neutral",
}: {
  label: string;
  value: string;
  icon: typeof CalendarDays;
  tone?: "neutral" | "success" | "warning";
}) {
  const toneClass =
    tone === "success"
      ? "text-[var(--success)]"
      : tone === "warning"
        ? "text-amber-700"
        : "text-[var(--foreground)]";

  return (
    <Card>
      <Icon size={20} className="text-[var(--primary)]" />
      <p className="mt-5 text-sm text-[var(--muted)]">{label}</p>
      <p className={cn("mt-1 text-2xl font-bold", toneClass)}>{value}</p>
    </Card>
  );
}

function formatDateTime(iso: string, timezone: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "long",
    timeStyle: "short",
    timeZone: timezone,
  }).format(new Date(iso));
}

function formatTime(iso: string, timezone: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    timeStyle: "short",
    timeZone: timezone,
  }).format(new Date(iso));
}
