"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useMemo, useState, useTransition } from "react";
import { ChevronLeft, ChevronRight, Plus, Search } from "lucide-react";

import {
  createCustomerAction,
  type CustomersActionState,
} from "@/app/(workspace)/dashboard/clientes/actions";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  CUSTOMER_STATUS_LABELS,
  customerStatusTone,
} from "@/features/customers/panel/status";
import type { CustomerPanelCapabilitiesDTO, PaginatedCustomersDTO } from "@/features/customers/types";
import type { CustomerStatus, ListCustomersQuery } from "@/features/customers/schemas";
import { cn } from "@/lib/utils";

type CustomersPanelProps = {
  data: PaginatedCustomersDTO;
  capabilities: CustomerPanelCapabilitiesDTO;
  query: ListCustomersQuery;
};

const STATUS_OPTIONS: Array<{ value: "" | CustomerStatus; label: string }> = [
  { value: "", label: "Todos os status" },
  { value: "new", label: CUSTOMER_STATUS_LABELS.new },
  { value: "active", label: CUSTOMER_STATUS_LABELS.active },
  { value: "following", label: CUSTOMER_STATUS_LABELS.following },
  { value: "inactive", label: CUSTOMER_STATUS_LABELS.inactive },
];

const emptyForm = {
  name: "",
  phone: "",
  email: "",
  objectives: "",
  status: "new" as CustomerStatus,
};

function Feedback({ state }: { state: CustomersActionState }) {
  if (state.error) {
    return (
      <p role="alert" className="text-sm text-[var(--danger)]">
        {state.error}
      </p>
    );
  }
  if (state.success) {
    return (
      <p role="status" className="text-sm text-[var(--success)]">
        {state.success}
      </p>
    );
  }
  return null;
}

export function CustomersPanel({ data, capabilities, query }: CustomersPanelProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<CustomersActionState>({});
  const [showCreate, setShowCreate] = useState(false);
  const [createForm, setCreateForm] = useState(emptyForm);
  const [searchDraft, setSearchDraft] = useState(query.q ?? "");

  const statusValue = query.status ?? "";

  const pageLinks = useMemo(() => {
    const links: number[] = [];
    for (let page = 1; page <= data.totalPages; page += 1) {
      links.push(page);
    }
    return links;
  }, [data.totalPages]);

  function pushQuery(next: Partial<ListCustomersQuery>) {
    const params = new URLSearchParams(searchParams.toString());
    Object.entries(next).forEach(([key, value]) => {
      if (value === undefined || value === "" || value === null) {
        params.delete(key);
      } else {
        params.set(key, String(value));
      }
    });
    router.push(`${pathname}?${params.toString()}`);
  }

  function submitSearch(event: React.FormEvent) {
    event.preventDefault();
    pushQuery({ q: searchDraft.trim() || undefined, page: 1 });
  }

  function submitCreate() {
    if (!capabilities.canManage) return;
    startTransition(async () => {
      const result = await createCustomerAction({
        ...createForm,
        email: createForm.email || null,
        objectives: createForm.objectives || null,
      });
      setMessage(result);
      if (!result.error) {
        setCreateForm(emptyForm);
        setShowCreate(false);
        router.refresh();
      }
    });
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold">Clientes</h1>
          <p className="mt-2 text-[var(--muted)]">
            Cadastros, histórico de relacionamento, observações e filtros por status.
          </p>
        </div>
        {capabilities.canManage ? (
          <Button type="button" onClick={() => setShowCreate((value) => !value)}>
            <Plus size={16} />
            Novo cliente
          </Button>
        ) : null}
      </header>

      <Card className="space-y-4 p-5">
        <form onSubmit={submitSearch} className="flex flex-col gap-3 lg:flex-row lg:items-end">
          <label className="flex-1 space-y-1.5 text-sm font-medium">
            <span>Buscar</span>
            <div className="relative">
              <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-[var(--muted)]" />
              <Input
                value={searchDraft}
                onChange={(event) => setSearchDraft(event.target.value)}
                placeholder="Nome, e-mail ou telefone"
                className="pl-9"
              />
            </div>
          </label>
          <label className="space-y-1.5 text-sm font-medium lg:w-52">
            <span>Status</span>
            <select
              value={statusValue}
              onChange={(event) =>
                pushQuery({
                  status: (event.target.value || undefined) as CustomerStatus | undefined,
                  page: 1,
                })
              }
              className="h-11 w-full rounded-xl border bg-white px-3 text-sm"
            >
              {STATUS_OPTIONS.map((option) => (
                <option key={option.label} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
          <div className="flex gap-2">
            <Button type="submit">Filtrar</Button>
            {query.q || query.status ? (
              <Button type="button" variant="secondary" onClick={() => router.push(pathname)}>
                Limpar
              </Button>
            ) : null}
          </div>
        </form>
      </Card>

      {showCreate && capabilities.canManage ? (
        <Card className="space-y-4 p-5">
          <h2 className="text-lg font-semibold">Cadastrar cliente</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field
              label="Nome"
              value={createForm.name}
              onChange={(value) => setCreateForm({ ...createForm, name: value })}
            />
            <Field
              label="Telefone"
              value={createForm.phone}
              onChange={(value) => setCreateForm({ ...createForm, phone: value })}
            />
            <Field
              label="E-mail"
              value={createForm.email}
              onChange={(value) => setCreateForm({ ...createForm, email: value })}
            />
            <label className="space-y-1.5 text-sm font-medium">
              <span>Status</span>
              <select
                value={createForm.status}
                onChange={(event) =>
                  setCreateForm({
                    ...createForm,
                    status: event.target.value as CustomerStatus,
                  })
                }
                className="h-11 w-full rounded-xl border bg-white px-3 text-sm"
              >
                {STATUS_OPTIONS.filter((option) => option.value).map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="space-y-1.5 text-sm font-medium sm:col-span-2">
              <span>Objetivo</span>
              <textarea
                value={createForm.objectives}
                onChange={(event) =>
                  setCreateForm({ ...createForm, objectives: event.target.value })
                }
                rows={3}
                className="w-full rounded-xl border px-3 py-2 text-sm"
              />
            </label>
          </div>
          <div className="flex gap-2">
            <Button type="button" disabled={pending} onClick={submitCreate}>
              {pending ? "Salvando..." : "Criar cliente"}
            </Button>
            <Button type="button" variant="secondary" onClick={() => setShowCreate(false)}>
              Cancelar
            </Button>
          </div>
        </Card>
      ) : null}

      <Card className="overflow-hidden">
        {data.items.length ? (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="border-b bg-[var(--surface-subtle)] text-left text-[var(--muted)]">
                <tr>
                  <th className="px-4 py-3 font-medium">Cliente</th>
                  <th className="px-4 py-3 font-medium">Contato</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Origem</th>
                  <th className="px-4 py-3 font-medium">Cadastro</th>
                </tr>
              </thead>
              <tbody>
                {data.items.map((customer) => (
                  <tr key={customer.id} className="border-b hover:bg-[var(--surface-subtle)]">
                    <td className="px-4 py-4">
                      <Link href={`/dashboard/clientes/${customer.id}`} className="font-semibold hover:underline">
                        {customer.name}
                      </Link>
                      {customer.objectives ? (
                        <p className="mt-1 line-clamp-1 text-xs text-[var(--muted)]">
                          {customer.objectives}
                        </p>
                      ) : null}
                    </td>
                    <td className="px-4 py-4">
                      <p>{customer.phone}</p>
                      {customer.email ? (
                        <p className="text-xs text-[var(--muted)]">{customer.email}</p>
                      ) : null}
                    </td>
                    <td className="px-4 py-4">
                      <span
                        className={cn(
                          "inline-flex rounded-full px-2 py-0.5 text-xs font-semibold",
                          customerStatusTone(customer.status),
                        )}
                      >
                        {CUSTOMER_STATUS_LABELS[customer.status]}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-[var(--muted)]">
                      {customer.acquisitionSource ?? "Manual"}
                    </td>
                    <td className="px-4 py-4 text-[var(--muted)]">
                      {new Intl.DateTimeFormat("pt-BR").format(new Date(customer.createdAt))}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="px-6 py-16 text-center text-[var(--muted)]">
            Nenhum cliente encontrado com os filtros atuais.
          </div>
        )}
      </Card>

      {data.totalPages > 1 ? (
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-[var(--muted)]">
            {data.total} cliente{data.total === 1 ? "" : "s"}
          </p>
          <div className="flex items-center gap-1">
            <Button
              type="button"
              variant="ghost"
              disabled={query.page <= 1}
              onClick={() => pushQuery({ page: Math.max(1, query.page - 1) })}
            >
              <ChevronLeft size={16} />
            </Button>
            {pageLinks.map((page) => (
              <Button
                key={page}
                type="button"
                variant={page === query.page ? "primary" : "ghost"}
                onClick={() => pushQuery({ page })}
              >
                {page}
              </Button>
            ))}
            <Button
              type="button"
              variant="ghost"
              disabled={query.page >= data.totalPages}
              onClick={() => pushQuery({ page: Math.min(data.totalPages, query.page + 1) })}
            >
              <ChevronRight size={16} />
            </Button>
          </div>
        </div>
      ) : null}

      <Feedback state={message} />
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="space-y-1.5 text-sm font-medium">
      <span>{label}</span>
      <Input value={value} onChange={(event) => onChange(event.target.value)} required={label === "Nome" || label === "Telefone"} />
    </label>
  );
}
