"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Search } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  SUBSCRIPTION_STATUS_LABELS,
  subscriptionStatusTone,
} from "@/features/platform-admin/panel/status";
import type { AdminSubscriptionsQuery } from "@/features/platform-admin/schemas";
import type { PaginatedPlatformSubscriptionsDTO } from "@/features/platform-admin/types";
import { cn } from "@/lib/utils";

type AdminSubscriptionsPanelProps = {
  data: PaginatedPlatformSubscriptionsDTO;
  query: AdminSubscriptionsQuery;
};

const STATUS_OPTIONS: Array<{ value: "" | AdminSubscriptionsQuery["status"]; label: string }> = [
  { value: "", label: "Todos os status" },
  { value: "trial", label: SUBSCRIPTION_STATUS_LABELS.trial },
  { value: "active", label: SUBSCRIPTION_STATUS_LABELS.active },
  { value: "pending", label: SUBSCRIPTION_STATUS_LABELS.pending },
  { value: "past_due", label: SUBSCRIPTION_STATUS_LABELS.past_due },
  { value: "cancelled", label: SUBSCRIPTION_STATUS_LABELS.cancelled },
  { value: "suspended", label: SUBSCRIPTION_STATUS_LABELS.suspended },
  { value: "expired", label: SUBSCRIPTION_STATUS_LABELS.expired },
];

export function AdminSubscriptionsPanel({ data, query }: AdminSubscriptionsPanelProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [searchDraft, setSearchDraft] = useState(query.search);

  const pageLinks = useMemo(() => {
    const links: number[] = [];
    for (let page = 1; page <= data.totalPages; page += 1) links.push(page);
    return links;
  }, [data.totalPages]);

  function pushQuery(next: Partial<AdminSubscriptionsQuery>) {
    const params = new URLSearchParams(searchParams.toString());
    Object.entries(next).forEach(([key, value]) => {
      if (value === undefined || value === "" || value === null) params.delete(key);
      else params.set(key, String(value));
    });
    router.push(`${pathname}?${params.toString()}`);
  }

  function submitSearch(event: React.FormEvent) {
    event.preventDefault();
    pushQuery({ search: searchDraft.trim() || undefined, page: 1 });
  }

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-3xl font-bold">Assinaturas</h1>
        <p className="mt-2 text-[var(--muted)]">{data.total} assinatura(s) na plataforma.</p>
      </header>

      <Card className="p-4">
        <form onSubmit={submitSearch} className="flex flex-col gap-3 md:flex-row">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[var(--muted)]" />
            <Input
              value={searchDraft}
              onChange={(event) => setSearchDraft(event.target.value)}
              placeholder="Buscar por empresa"
              className="pl-9"
            />
          </div>
          <select
            value={query.status ?? ""}
            onChange={(event) =>
              pushQuery({
                status: (event.target.value || undefined) as AdminSubscriptionsQuery["status"],
                page: 1,
              })
            }
            className="rounded-xl border bg-white px-3 py-2 text-sm"
          >
            {STATUS_OPTIONS.map((option) => (
              <option key={option.label} value={option.value ?? ""}>
                {option.label}
              </option>
            ))}
          </select>
          <Button type="submit">Buscar</Button>
        </form>
      </Card>

      <Card className="overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="border-b bg-[var(--surface-subtle)] text-left">
              <tr>
                <th className="px-4 py-3 font-medium">Empresa</th>
                <th className="px-4 py-3 font-medium">Plano</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Próximo pagamento</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {data.items.map((subscription) => (
                <tr key={subscription.id}>
                  <td className="px-4 py-3">
                    <p className="font-medium">{subscription.companyName}</p>
                    <p className="text-[var(--muted)]">/{subscription.companySlug}</p>
                  </td>
                  <td className="px-4 py-3">{subscription.planName}</td>
                  <td className="px-4 py-3">
                    <span
                      className={cn(
                        "rounded-full px-2.5 py-1 text-xs font-medium",
                        subscriptionStatusTone(subscription.status),
                      )}
                    >
                      {SUBSCRIPTION_STATUS_LABELS[subscription.status] ?? subscription.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {subscription.nextPaymentAt
                      ? new Date(subscription.nextPaymentAt).toLocaleDateString("pt-BR")
                      : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {data.items.length === 0 ? (
          <p className="p-5 text-sm text-[var(--muted)]">Nenhuma assinatura encontrada.</p>
        ) : null}
      </Card>

      {data.totalPages > 1 ? (
        <div className="flex items-center justify-center gap-2">
          <Button
            variant="ghost"
            disabled={data.page <= 1}
            onClick={() => pushQuery({ page: data.page - 1 })}
          >
            <ChevronLeft className="size-4" />
          </Button>
          {pageLinks.map((page) => (
            <Button
              key={page}
              variant={page === data.page ? "primary" : "ghost"}
              onClick={() => pushQuery({ page })}
            >
              {page}
            </Button>
          ))}
          <Button
            variant="ghost"
            disabled={data.page >= data.totalPages}
            onClick={() => pushQuery({ page: data.page + 1 })}
          >
            <ChevronRight className="size-4" />
          </Button>
        </div>
      ) : null}
    </div>
  );
}
