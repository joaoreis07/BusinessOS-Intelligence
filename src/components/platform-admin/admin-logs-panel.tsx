"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Search } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import type { AdminLogsQuery } from "@/features/platform-admin/schemas";
import type { PaginatedPlatformLogsDTO } from "@/features/platform-admin/types";

type AdminLogsPanelProps = {
  data: PaginatedPlatformLogsDTO;
  query: AdminLogsQuery;
};

export function AdminLogsPanel({ data, query }: AdminLogsPanelProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [searchDraft, setSearchDraft] = useState(query.search);
  const [moduleDraft, setModuleDraft] = useState(query.module ?? "");

  const pageLinks = useMemo(() => {
    const links: number[] = [];
    for (let page = 1; page <= data.totalPages; page += 1) links.push(page);
    return links;
  }, [data.totalPages]);

  function pushQuery(next: Partial<AdminLogsQuery>) {
    const params = new URLSearchParams(searchParams.toString());
    Object.entries(next).forEach(([key, value]) => {
      if (value === undefined || value === "" || value === null) params.delete(key);
      else params.set(key, String(value));
    });
    router.push(`${pathname}?${params.toString()}`);
  }

  function submitSearch(event: React.FormEvent) {
    event.preventDefault();
    pushQuery({
      search: searchDraft.trim() || undefined,
      module: moduleDraft.trim() || undefined,
      page: 1,
    });
  }

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-3xl font-bold">Logs de atividade</h1>
        <p className="mt-2 text-[var(--muted)]">{data.total} evento(s) registrados.</p>
      </header>

      <Card className="p-4">
        <form onSubmit={submitSearch} className="flex flex-col gap-3 md:flex-row">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[var(--muted)]" />
            <Input
              value={searchDraft}
              onChange={(event) => setSearchDraft(event.target.value)}
              placeholder="Buscar ação, módulo ou entidade"
              className="pl-9"
            />
          </div>
          <Input
            value={moduleDraft}
            onChange={(event) => setModuleDraft(event.target.value)}
            placeholder="Filtrar módulo"
            className="md:max-w-xs"
          />
          <Button type="submit">Buscar</Button>
        </form>
      </Card>

      <Card className="overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="border-b bg-[var(--surface-subtle)] text-left">
              <tr>
                <th className="px-4 py-3 font-medium">Quando</th>
                <th className="px-4 py-3 font-medium">Módulo</th>
                <th className="px-4 py-3 font-medium">Ação</th>
                <th className="px-4 py-3 font-medium">Entidade</th>
                <th className="px-4 py-3 font-medium">Empresa</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {data.items.map((log) => (
                <tr key={log.id}>
                  <td className="px-4 py-3 whitespace-nowrap">
                    {new Date(log.createdAt).toLocaleString("pt-BR")}
                  </td>
                  <td className="px-4 py-3">{log.module}</td>
                  <td className="px-4 py-3">{log.action}</td>
                  <td className="px-4 py-3">
                    {log.entityType ? `${log.entityType}${log.entityId ? ` #${log.entityId.slice(0, 8)}` : ""}` : "—"}
                  </td>
                  <td className="px-4 py-3">{log.companyId ? log.companyId.slice(0, 8) : "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {data.items.length === 0 ? (
          <p className="p-5 text-sm text-[var(--muted)]">Nenhum log encontrado.</p>
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
