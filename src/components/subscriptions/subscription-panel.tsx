"use client";

import { useState, useTransition } from "react";
import { CreditCard, Loader2, ShieldAlert } from "lucide-react";

import {
  cancelSubscriptionAction,
  createCheckoutAction,
  openBillingPortalAction,
  type SubscriptionActionState,
} from "@/app/(workspace)/dashboard/assinatura/actions";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  comparePlanOrder,
  isSubscriptionAtRisk,
  PAYMENT_STATUS_LABELS,
  PLAN_FEATURE_LABELS,
  paymentStatusTone,
  SUBSCRIPTION_STATUS_LABELS,
  subscriptionStatusTone,
} from "@/features/subscriptions/panel/status";
import type { PlanKey } from "@/features/subscriptions/schemas";
import type {
  SubscriptionPageDTO,
  SubscriptionPanelCapabilitiesDTO,
} from "@/features/subscriptions/types";
import { cn, formatCurrencyFromCents } from "@/lib/utils";

type SubscriptionPanelProps = SubscriptionPageDTO & {
  capabilities: SubscriptionPanelCapabilitiesDTO;
  checkoutNotice?: string | null;
};

function Feedback({ state }: { state: SubscriptionActionState }) {
  if (state.error) {
    return <p role="alert" className="text-sm text-[var(--danger)]">{state.error}</p>;
  }
  if (state.success) {
    return <p role="status" className="text-sm text-[var(--success)]">{state.success}</p>;
  }
  return null;
}

export function SubscriptionPanel({
  subscription,
  plans,
  payments,
  capabilities,
  checkoutNotice,
}: SubscriptionPanelProps) {
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<SubscriptionActionState>({});

  const currentPlanCode = subscription?.plan.code;

  function changePlan(plan: PlanKey) {
    if (!capabilities.canManage) return;
    startTransition(async () => {
      const result = await createCheckoutAction(plan);
      if (result?.error) setMessage(result);
    });
  }

  function openPortal() {
    if (!capabilities.canManage) return;
    startTransition(async () => {
      const result = await openBillingPortalAction();
      if (result?.error) setMessage(result);
    });
  }

  function cancelPlan() {
    if (!capabilities.canManage) return;
    if (!window.confirm("Cancelar assinatura ao final do período atual?")) return;
    startTransition(async () => {
      const result = await cancelSubscriptionAction();
      setMessage(result);
    });
  }

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-3xl font-bold">Minha assinatura</h1>
        <p className="mt-2 text-[var(--muted)]">
          Planos, trial, renovação, histórico de pagamentos e gestão via Mercado Pago.
        </p>
      </header>

      {checkoutNotice ? (
        <Card className="border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">
          {checkoutNotice}
        </Card>
      ) : null}

      {subscription && isSubscriptionAtRisk(subscription.status) ? (
        <Card className="flex items-start gap-3 border-rose-200 bg-rose-50 p-4">
          <ShieldAlert className="mt-0.5 text-rose-700" size={18} />
          <div>
            <p className="font-semibold text-rose-800">Atenção: situação de cobrança</p>
            <p className="mt-1 text-sm text-rose-700">
              Sua assinatura está {SUBSCRIPTION_STATUS_LABELS[subscription.status].toLowerCase()}.
              {subscription.graceEndsAt
                ? ` Período de tolerância até ${formatDate(subscription.graceEndsAt)}.`
                : " Regularize o pagamento para evitar suspensão."}
            </p>
          </div>
        </Card>
      ) : null}

      <Card className="space-y-5 p-5">
        {subscription ? (
          <>
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <div className="flex flex-wrap items-center gap-3">
                  <h2 className="text-2xl font-bold">{subscription.plan.name}</h2>
                  <span
                    className={cn(
                      "inline-flex rounded-full px-2.5 py-1 text-xs font-semibold",
                      subscriptionStatusTone(subscription.status),
                    )}
                  >
                    {SUBSCRIPTION_STATUS_LABELS[subscription.status]}
                  </span>
                </div>
                <p className="mt-3 text-[var(--muted)]">
                  {formatCurrencyFromCents(subscription.plan.priceCents)} /{" "}
                  {subscription.plan.billingInterval === "year" ? "ano" : "mês"}
                </p>
                {subscription.status === "trial" && subscription.trialEndsAt ? (
                  <p className="mt-2 text-sm text-amber-700">
                    Trial até {formatDate(subscription.trialEndsAt)}
                  </p>
                ) : null}
                {subscription.cancelAtPeriodEnd ? (
                  <p className="mt-2 text-sm text-[var(--muted)]">
                    Cancelamento agendado para o fim do período.
                  </p>
                ) : null}
              </div>
              <dl className="grid gap-3 text-sm sm:grid-cols-2">
                <Metric label="Próxima renovação" value={formatDate(subscription.currentPeriodEndsAt)} />
                <Metric label="Próximo pagamento" value={formatDate(subscription.nextPaymentAt)} />
                <Metric label="Início do período" value={formatDate(subscription.currentPeriodStartsAt)} />
                <Metric label="Provedor" value={subscription.provider} />
              </dl>
            </div>

            {capabilities.canManage ? (
              <div className="flex flex-wrap gap-2 border-t pt-4">
                <Button type="button" variant="secondary" disabled={pending} onClick={openPortal}>
                  <CreditCard size={16} />
                  Portal de cobrança
                </Button>
                {!subscription.cancelAtPeriodEnd ? (
                  <Button type="button" variant="danger" disabled={pending} onClick={cancelPlan}>
                    Cancelar assinatura
                  </Button>
                ) : null}
              </div>
            ) : null}
          </>
        ) : (
          <div>
            <h2 className="text-xl font-semibold">Nenhuma assinatura ativa</h2>
            <p className="mt-2 text-[var(--muted)]">
              Escolha um plano abaixo para iniciar o checkout via Mercado Pago.
            </p>
          </div>
        )}
      </Card>

      <section className="space-y-4">
        <h2 className="text-xl font-semibold">Planos disponíveis</h2>
        <div className="grid gap-4 lg:grid-cols-3">
          {plans.map((plan) => {
            const relation = currentPlanCode
              ? comparePlanOrder(currentPlanCode, plan.code, plans)
              : "upgrade";
            const isCurrent = relation === "current";

            return (
              <Card key={plan.code} className={cn("flex flex-col p-5", isCurrent && "ring-2 ring-[var(--primary)]")}>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="text-lg font-semibold">{plan.name}</h3>
                    <p className="mt-1 text-sm text-[var(--muted)]">{plan.description}</p>
                  </div>
                  {isCurrent ? (
                    <span className="rounded-full bg-[var(--surface-subtle)] px-2 py-0.5 text-xs font-semibold">
                      Atual
                    </span>
                  ) : null}
                </div>
                <p className="mt-4 text-2xl font-bold">
                  {formatCurrencyFromCents(plan.priceCents)}
                  <span className="text-sm font-normal text-[var(--muted)]"> / mês</span>
                </p>
                {plan.trialDays ? (
                  <p className="mt-1 text-sm text-[var(--muted)]">{plan.trialDays} dias de trial</p>
                ) : null}
                <ul className="mt-4 space-y-2 text-sm">
                  {plan.features.map((feature) => (
                    <li key={feature.key}>• {PLAN_FEATURE_LABELS[feature.key] ?? feature.key}</li>
                  ))}
                </ul>
                {capabilities.canManage && !isCurrent ? (
                  <Button
                    type="button"
                    className="mt-5 w-full"
                    disabled={pending}
                    onClick={() => changePlan(plan.code)}
                  >
                    {pending ? (
                      <>
                        <Loader2 className="animate-spin" size={16} />
                        Redirecionando...
                      </>
                    ) : relation === "downgrade" ? (
                      "Fazer downgrade"
                    ) : currentPlanCode ? (
                      "Fazer upgrade"
                    ) : (
                      "Assinar plano"
                    )}
                  </Button>
                ) : null}
              </Card>
            );
          })}
        </div>
      </section>

      <Card className="overflow-hidden">
        <div className="border-b px-5 py-4">
          <h2 className="text-lg font-semibold">Histórico de pagamentos</h2>
        </div>
        {payments.items.length ? (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="border-b bg-[var(--surface-subtle)] text-left text-[var(--muted)]">
                <tr>
                  <th className="px-4 py-3 font-medium">Data</th>
                  <th className="px-4 py-3 font-medium">Valor</th>
                  <th className="px-4 py-3 font-medium">Vencimento</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {payments.items.map((payment) => (
                  <tr key={payment.id} className="border-b">
                    <td className="px-4 py-4">{formatDate(payment.createdAt)}</td>
                    <td className="px-4 py-4 font-semibold">
                      {formatCurrencyFromCents(payment.amountCents)}
                    </td>
                    <td className="px-4 py-4 text-[var(--muted)]">{formatDate(payment.dueAt)}</td>
                    <td className="px-4 py-4">
                      <span
                        className={cn(
                          "inline-flex rounded-full px-2 py-0.5 text-xs font-semibold",
                          paymentStatusTone(payment.status),
                        )}
                      >
                        {PAYMENT_STATUS_LABELS[payment.status]}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="px-6 py-12 text-center text-sm text-[var(--muted)]">
            Nenhum pagamento registrado ainda.
          </div>
        )}
      </Card>

      <Feedback state={message} />
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-[var(--muted)]">{label}</dt>
      <dd className="mt-1 font-semibold">{value}</dd>
    </div>
  );
}

function formatDate(value: string | null | undefined) {
  if (!value) return "A definir";
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "medium",
    timeStyle: value.includes("T") ? "short" : undefined,
  }).format(new Date(value));
}
