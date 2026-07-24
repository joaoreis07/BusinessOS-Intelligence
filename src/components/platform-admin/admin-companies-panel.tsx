"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useMemo, useState, useTransition } from "react";
import { ChevronLeft, ChevronRight, Loader2, Search } from "lucide-react";

import {
  updateCompanyStatusAction,
  type PlatformAdminActionState,
} from "@/app/(platform)/admin/actions";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  COMPANY_STATUS_LABELS,
  companyStatusTone,
} from "@/features/platform-admin/panel/status";
import type { AdminCompaniesQuery } from "@/features/platform-admin/schemas";
import type { PaginatedPlatformCompaniesDTO } from "@/features/platform-admin/types";
import { cn } from "@/lib/utils";

type AdminCompaniesPanelProps = {
  data: PaginatedPlatformCompaniesDTO;
  query: AdminCompaniesQuery;
};

const STATUS_OPTIONS: Array<{ value: "" | AdminCompaniesQuery["status"]; label: string }> = [
  { value: "", label: "Todos os status" },
  { value: "trial", label: COMPANY_STATUS_LABELS.trial },
  { value: "active", label: COMPANY_STATUS_LABELS.active },
  { value: "inactive", label: COMPANY_STATUS_LABELS.inactive },
  { value: "blocked", label: COMPANY_STATUS_LABELS.blocked },
  { value: "cancelled", label: COMPANY_STATUS_LABELS.cancelled },
];

export function AdminCompaniesPanel({ data, query }: AdminCompaniesPanelProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<PlatformAdminActionState>({});
  const [searchDraft, setSearchDraft] = useState(query.search);

  const pageLinks = useMemo(() => {
    const links: number[] = [];
    for (let page = 1; page <= data.totalPages; page += 1) links.push(page);
    return links;
  }, [data.totalPages]);

  function pushQuery(next: Partial<AdminCompaniesQuery>) {
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

  function changeStatus(companyId: string, status: AdminCompaniesQuery["status"]) {
    if (!status) return;
    startTransition(async () => {
      const result = await updateCompanyStatusAction({ companyId, status });
      setMessage(result);
      if (result.success) router.refresh();
    });
  }

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-3xl font-bold">Empresas</h1>
        <p className="mt-2 text-[var(--muted)]">
          {data.total} empresa(s) na plataforma.
        </p>
      </header>

      <Card className="space-y-4 p-4">
        <form onSubmit={submitSearch} className="flex flex-col gap-3 md:flex-row">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[var(--muted)]" />
            <Input
              value={searchDraft}
              onChange={(event) => setSearchDraft(event.target.value)}
              placeholder="Buscar por nome ou slug"
              className="pl-9"
            />
          </div>
          <select
            value={query.status ?? ""}
            onChange={(event) =>
              pushQuery({
                status: (event.target.value || undefined) as AdminCompaniesQuery["status"],
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
          <Button type="submit" disabled={pending}>
            {pending ? <Loader2 className="size-4 animate-spin" /> : "Buscar"}
          </Button>
        </form>
        {message.error ? (
          <p role="alert" className="text-sm text-[var(--danger)]">{message.error}</p>
        ) : null}
        {message.success ? (
          <p role="status" className="text-sm text-[var(--success)]">{message.success}</p>
        ) : null}
      </Card>

      <Card className="overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="border-b bg-[var(--surface-subtle)] text-left">
              <tr>
                <th className="px-4 py-3 font-medium">Empresa</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Ativa</th>
                <th className="px-4 py-3 font-medium">Criada em</th>
                <th className="px-4 py-3 font-medium">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {data.items.map((company) => (
                <tr key={company.id}>
                  <td className="px-4 py-3">
                    <p className="font-medium">{company.name}</p>
                    <p className="text-[var(--muted)]">/{company.slug}</p>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={cn(
                        "rounded-full px-2.5 py-1 text-xs font-medium",
                        companyStatusTone(company.status),
                      )}
                    >
                      {COMPANY_STATUS_LABELS[company.status] ?? company.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">{company.active ? "Sim" : "Não"}</td>
                  <td className="px-4 py-3">
                    {new Date(company.createdAt).toLocaleDateString("pt-BR")}
                  </td>
                  <td className="px-4 py-3">
                    <select
                      defaultValue={company.status}
                      disabled={pending}
                      onChange={(event) =>
                        changeStatus(
                          company.id,
                          event.target.value as AdminCompaniesQuery["status"],
                        )
                      }
                      className="rounded-lg border bg-white px-2 py-1 text-sm"
                    >
                      {STATUS_OPTIONS.filter((option) => option.value).map((option) => (
                        <option key={option.value} value={option.value ?? ""}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {data.items.length === 0 ? (
          <p className="p-5 text-sm text-[var(--muted)]">Nenhuma empresa encontrada.</p>
        ) : null}
      </Card>

      {data.totalPages > 1 ? (
        <div className="flex items-center justify-center gap-2">
          <Button
            variant="ghost"
            disabled={data.page <= 1 || pending}
            onClick={() => pushQuery({ page: data.page - 1 })}
          >
            <ChevronLeft className="size-4" />
          </Button>
          {pageLinks.map((page) => (
            <Button
              key={page}
              variant={page === data.page ? "primary" : "ghost"}
              disabled={pending}
              onClick={() => pushQuery({ page })}
            >
              {page}
            </Button>
          ))}
          <Button
            variant="ghost"
            disabled={data.page >= data.totalPages || pending}
            onClick={() => pushQuery({ page: data.page + 1 })}
          >
            <ChevronRight className="size-4" />
          </Button>
        </div>
      ) : null}
    </div>
  );
}
