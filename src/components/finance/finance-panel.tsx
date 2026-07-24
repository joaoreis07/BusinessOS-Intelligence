"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useMemo, useState, useTransition } from "react";
import { ChevronLeft, ChevronRight, Loader2, Pencil, Plus, Search, Trash2 } from "lucide-react";

import {
  createFinancialEntryAction,
  deleteFinancialEntryAction,
  markFinancialEntryPaidAction,
  updateFinancialEntryAction,
  type FinanceActionState,
} from "@/app/(workspace)/dashboard/financeiro/actions";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  FINANCIAL_KIND_LABELS,
  FINANCIAL_STATUS_LABELS,
  financialKindTone,
  financialStatusTone,
} from "@/features/finance/panel/status";
import type {
  FinancePanelCapabilitiesDTO,
  FinancialCategoryDTO,
  PaginatedFinancialEntriesDTO,
} from "@/features/finance/types";
import type { FinancialKind, FinancialStatus, ListFinancialEntriesQuery } from "@/features/finance/schemas";
import { cn, formatCurrencyFromCents } from "@/lib/utils";

type FinancePanelProps = {
  data: PaginatedFinancialEntriesDTO;
  categories: FinancialCategoryDTO[];
  capabilities: FinancePanelCapabilitiesDTO;
  query: ListFinancialEntriesQuery;
};

const KIND_OPTIONS: Array<{ value: "" | FinancialKind; label: string }> = [
  { value: "", label: "Todos os tipos" },
  { value: "income", label: FINANCIAL_KIND_LABELS.income },
  { value: "expense", label: FINANCIAL_KIND_LABELS.expense },
];

const STATUS_OPTIONS: Array<{ value: "" | FinancialStatus; label: string }> = [
  { value: "", label: "Todos os status" },
  { value: "pending", label: FINANCIAL_STATUS_LABELS.pending },
  { value: "paid", label: FINANCIAL_STATUS_LABELS.paid },
  { value: "overdue", label: FINANCIAL_STATUS_LABELS.overdue },
  { value: "cancelled", label: FINANCIAL_STATUS_LABELS.cancelled },
];

const emptyCreateForm = {
  kind: "income" as FinancialKind,
  description: "",
  amount: "",
  dueDate: new Date().toISOString().slice(0, 10),
  status: "pending" as "pending" | "paid",
  categoryId: "",
};

function Feedback({ state }: { state: FinanceActionState }) {
  if (state.error) {
    return <p role="alert" className="text-sm text-[var(--danger)]">{state.error}</p>;
  }
  if (state.success) {
    return <p role="status" className="text-sm text-[var(--success)]">{state.success}</p>;
  }
  return null;
}

export function FinancePanel({
  data,
  categories,
  capabilities,
  query,
}: FinancePanelProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<FinanceActionState>({});
  const [showCreate, setShowCreate] = useState(false);
  const [createForm, setCreateForm] = useState(emptyCreateForm);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [searchDraft, setSearchDraft] = useState(query.q ?? "");
  const [fromDraft, setFromDraft] = useState(query.from);
  const [toDraft, setToDraft] = useState(query.to);

  const selected = data.items.find((item) => item.id === selectedId) ?? null;
  const [editForm, setEditForm] = useState({
    description: "",
    amount: "",
    dueDate: "",
    status: "pending" as FinancialStatus,
    categoryId: "",
  });

  const filteredCategories = useMemo(
    () => categories.filter((category) => category.kind === createForm.kind),
    [categories, createForm.kind],
  );

  const pageLinks = useMemo(() => {
    const links: number[] = [];
    for (let page = 1; page <= data.totalPages; page += 1) links.push(page);
    return links;
  }, [data.totalPages]);

  function pushQuery(next: Partial<ListFinancialEntriesQuery>) {
    const params = new URLSearchParams(searchParams.toString());
    Object.entries(next).forEach(([key, value]) => {
      if (value === undefined || value === "" || value === null) params.delete(key);
      else params.set(key, String(value));
    });
    router.push(`${pathname}?${params.toString()}`);
  }

  function openEdit(entry: (typeof data.items)[number]) {
    setSelectedId(entry.id);
    setEditForm({
      description: entry.description,
      amount: String(entry.amountCents / 100),
      dueDate: entry.dueDate,
      status: entry.status,
      categoryId: entry.categoryId,
    });
    setMessage({});
  }

  function submitFilters(event: React.FormEvent) {
    event.preventDefault();
    pushQuery({
      from: fromDraft,
      to: toDraft,
      q: searchDraft.trim() || undefined,
      page: 1,
    });
  }

  function submitCreate() {
    if (!capabilities.canManage) return;
    startTransition(async () => {
      const result = await createFinancialEntryAction({
        ...createForm,
        amount: Number(createForm.amount),
        categoryId: createForm.categoryId || undefined,
      });
      setMessage(result);
      if (!result.error) {
        setCreateForm(emptyCreateForm);
        setShowCreate(false);
        router.refresh();
      }
    });
  }

  function submitEdit() {
    if (!selected || !capabilities.canManage) return;
    startTransition(async () => {
      const result = await updateFinancialEntryAction({
        id: selected.id,
        description: editForm.description,
        amount: Number(editForm.amount),
        dueDate: editForm.dueDate,
        status: editForm.status,
        categoryId: editForm.categoryId,
      });
      setMessage(result);
      if (!result.error) router.refresh();
    });
  }

  function markPaid(id: string) {
    if (!capabilities.canManage) return;
    startTransition(async () => {
      const result = await markFinancialEntryPaidAction(id);
      setMessage(result);
      if (!result.error) router.refresh();
    });
  }

  function removeEntry(id: string) {
    if (!capabilities.canManage) return;
    if (!window.confirm("Remover esta movimentação?")) return;
    startTransition(async () => {
      const result = await deleteFinancialEntryAction(id);
      setMessage(result);
      if (!result.error) {
        setSelectedId(null);
        router.refresh();
      }
    });
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold">Financeiro</h1>
          <p className="mt-2 text-[var(--muted)]">
            Receitas, despesas, pendências e resultado do período selecionado.
          </p>
        </div>
        {capabilities.canManage ? (
          <Button type="button" onClick={() => setShowCreate((value) => !value)}>
            <Plus size={16} />
            Nova movimentação
          </Button>
        ) : null}
      </header>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <SummaryCard label="Receitas pagas" value={data.summary.incomeCents} tone="success" />
        <SummaryCard label="Despesas pagas" value={data.summary.expenseCents} tone="danger" />
        <SummaryCard label="Resultado" value={data.summary.profitCents} tone="neutral" />
        <SummaryCard label="Pendentes" value={data.summary.pendingCents} tone="warning" />
      </section>

      <Card className="space-y-4 p-5">
        <form onSubmit={submitFilters} className="grid gap-3 lg:grid-cols-5">
          <Field label="De" type="date" value={fromDraft} onChange={setFromDraft} />
          <Field label="Até" type="date" value={toDraft} onChange={setToDraft} />
          <label className="space-y-1.5 text-sm font-medium lg:col-span-2">
            <span>Buscar</span>
            <div className="relative">
              <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-[var(--muted)]" />
              <Input
                value={searchDraft}
                onChange={(event) => setSearchDraft(event.target.value)}
                placeholder="Descrição"
                className="pl-9"
              />
            </div>
          </label>
          <div className="flex items-end gap-2">
            <Button type="submit">Filtrar</Button>
            <Button type="button" variant="secondary" onClick={() => router.push(pathname)}>
              Limpar
            </Button>
          </div>
          <label className="space-y-1.5 text-sm font-medium">
            <span>Tipo</span>
            <select
              value={query.kind ?? ""}
              onChange={(event) =>
                pushQuery({
                  kind: (event.target.value || undefined) as FinancialKind | undefined,
                  page: 1,
                })
              }
              className="h-11 w-full rounded-xl border bg-white px-3 text-sm"
            >
              {KIND_OPTIONS.map((option) => (
                <option key={option.label} value={option.value}>{option.label}</option>
              ))}
            </select>
          </label>
          <label className="space-y-1.5 text-sm font-medium">
            <span>Status</span>
            <select
              value={query.status ?? ""}
              onChange={(event) =>
                pushQuery({
                  status: (event.target.value || undefined) as FinancialStatus | undefined,
                  page: 1,
                })
              }
              className="h-11 w-full rounded-xl border bg-white px-3 text-sm"
            >
              {STATUS_OPTIONS.map((option) => (
                <option key={option.label} value={option.value}>{option.label}</option>
              ))}
            </select>
          </label>
        </form>
      </Card>

      {showCreate && capabilities.canManage ? (
        <Card className="space-y-4 p-5">
          <h2 className="text-lg font-semibold">Registrar movimentação</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="space-y-1.5 text-sm font-medium">
              <span>Tipo</span>
              <select
                value={createForm.kind}
                onChange={(event) =>
                  setCreateForm({
                    ...createForm,
                    kind: event.target.value as FinancialKind,
                    categoryId: "",
                  })
                }
                className="h-11 w-full rounded-xl border bg-white px-3 text-sm"
              >
                <option value="income">{FINANCIAL_KIND_LABELS.income}</option>
                <option value="expense">{FINANCIAL_KIND_LABELS.expense}</option>
              </select>
            </label>
            <Field label="Valor (R$)" value={createForm.amount} onChange={(value) => setCreateForm({ ...createForm, amount: value })} />
            <Field label="Descrição" value={createForm.description} onChange={(value) => setCreateForm({ ...createForm, description: value })} />
            <Field label="Vencimento" type="date" value={createForm.dueDate} onChange={(value) => setCreateForm({ ...createForm, dueDate: value })} />
            <label className="space-y-1.5 text-sm font-medium">
              <span>Categoria</span>
              <select
                value={createForm.categoryId}
                onChange={(event) => setCreateForm({ ...createForm, categoryId: event.target.value })}
                className="h-11 w-full rounded-xl border bg-white px-3 text-sm"
              >
                <option value="">Padrão da empresa</option>
                {filteredCategories.map((category) => (
                  <option key={category.id} value={category.id}>{category.name}</option>
                ))}
              </select>
            </label>
            <label className="space-y-1.5 text-sm font-medium">
              <span>Status</span>
              <select
                value={createForm.status}
                onChange={(event) =>
                  setCreateForm({
                    ...createForm,
                    status: event.target.value as "pending" | "paid",
                  })
                }
                className="h-11 w-full rounded-xl border bg-white px-3 text-sm"
              >
                <option value="pending">Pendente</option>
                <option value="paid">Pago</option>
              </select>
            </label>
          </div>
          <div className="flex gap-2">
            <Button type="button" disabled={pending} onClick={submitCreate}>
              {pending ? "Salvando..." : "Registrar"}
            </Button>
            <Button type="button" variant="secondary" onClick={() => setShowCreate(false)}>
              Cancelar
            </Button>
          </div>
        </Card>
      ) : null}

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_22rem]">
        <Card className="overflow-hidden">
          {data.items.length ? (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="border-b bg-[var(--surface-subtle)] text-left text-[var(--muted)]">
                  <tr>
                    <th className="px-4 py-3 font-medium">Descrição</th>
                    <th className="px-4 py-3 font-medium">Tipo</th>
                    <th className="px-4 py-3 font-medium">Valor</th>
                    <th className="px-4 py-3 font-medium">Vencimento</th>
                    <th className="px-4 py-3 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {data.items.map((entry) => (
                    <tr
                      key={entry.id}
                      className={cn(
                        "cursor-pointer border-b hover:bg-[var(--surface-subtle)]",
                        selectedId === entry.id && "bg-[var(--accent)]",
                      )}
                      onClick={() => openEdit(entry)}
                    >
                      <td className="px-4 py-4">
                        <p className="font-medium">{entry.description}</p>
                        {entry.categoryName ? (
                          <p className="text-xs text-[var(--muted)]">{entry.categoryName}</p>
                        ) : null}
                      </td>
                      <td className="px-4 py-4">{FINANCIAL_KIND_LABELS[entry.kind]}</td>
                      <td className={cn("px-4 py-4 font-semibold", financialKindTone(entry.kind))}>
                        {entry.kind === "income" ? "+" : "-"}
                        {formatCurrencyFromCents(entry.amountCents)}
                      </td>
                      <td className="px-4 py-4 text-[var(--muted)]">
                        {new Intl.DateTimeFormat("pt-BR").format(new Date(entry.dueDate))}
                      </td>
                      <td className="px-4 py-4">
                        <span className={cn("inline-flex rounded-full px-2 py-0.5 text-xs font-semibold", financialStatusTone(entry.status))}>
                          {FINANCIAL_STATUS_LABELS[entry.status]}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="px-6 py-16 text-center text-[var(--muted)]">
              Nenhuma movimentação encontrada no período.
            </div>
          )}
        </Card>

        <aside className="rounded-2xl border bg-white p-5 shadow-sm">
          {selected ? (
            <div className="space-y-4">
              <div>
                <p className="text-sm text-[var(--muted)]">Detalhe</p>
                <h2 className="text-xl font-semibold">{selected.description}</h2>
              </div>
              {capabilities.canManage ? (
                <>
                  <div className="grid gap-3">
                    <Field label="Descrição" value={editForm.description} onChange={(value) => setEditForm({ ...editForm, description: value })} />
                    <Field label="Valor (R$)" value={editForm.amount} onChange={(value) => setEditForm({ ...editForm, amount: value })} />
                    <Field label="Vencimento" type="date" value={editForm.dueDate} onChange={(value) => setEditForm({ ...editForm, dueDate: value })} />
                    <label className="space-y-1.5 text-sm font-medium">
                      <span>Status</span>
                      <select
                        value={editForm.status}
                        onChange={(event) =>
                          setEditForm({ ...editForm, status: event.target.value as FinancialStatus })
                        }
                        className="h-11 w-full rounded-xl border bg-white px-3 text-sm"
                      >
                        {(Object.keys(FINANCIAL_STATUS_LABELS) as FinancialStatus[]).map((status) => (
                          <option key={status} value={status}>
                            {FINANCIAL_STATUS_LABELS[status]}
                          </option>
                        ))}
                      </select>
                    </label>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button type="button" disabled={pending} onClick={submitEdit}>
                      {pending ? <Loader2 className="animate-spin" size={16} /> : <Pencil size={16} />}
                      Salvar
                    </Button>
                    {selected.status !== "paid" ? (
                      <Button type="button" variant="secondary" disabled={pending} onClick={() => markPaid(selected.id)}>
                        Marcar pago
                      </Button>
                    ) : null}
                    <Button type="button" variant="danger" disabled={pending} onClick={() => removeEntry(selected.id)}>
                      <Trash2 size={16} />
                      Remover
                    </Button>
                  </div>
                </>
              ) : (
                <dl className="space-y-3 text-sm">
                  <Detail label="Valor" value={formatCurrencyFromCents(selected.amountCents)} />
                  <Detail label="Status" value={FINANCIAL_STATUS_LABELS[selected.status]} />
                  <Detail label="Vencimento" value={new Intl.DateTimeFormat("pt-BR").format(new Date(selected.dueDate))} />
                </dl>
              )}
            </div>
          ) : (
            <p className="py-16 text-center text-sm text-[var(--muted)]">
              Selecione uma movimentação para editar ou marcar como paga.
            </p>
          )}
        </aside>
      </div>

      {data.totalPages > 1 ? (
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-[var(--muted)]">{data.total} movimentação(ões)</p>
          <div className="flex items-center gap-1">
            <Button type="button" variant="ghost" disabled={query.page <= 1} onClick={() => pushQuery({ page: Math.max(1, query.page - 1) })}>
              <ChevronLeft size={16} />
            </Button>
            {pageLinks.map((page) => (
              <Button key={page} type="button" variant={page === query.page ? "primary" : "ghost"} onClick={() => pushQuery({ page })}>
                {page}
              </Button>
            ))}
            <Button type="button" variant="ghost" disabled={query.page >= data.totalPages} onClick={() => pushQuery({ page: Math.min(data.totalPages, query.page + 1) })}>
              <ChevronRight size={16} />
            </Button>
          </div>
        </div>
      ) : null}

      <Feedback state={message} />
    </div>
  );
}

function SummaryCard({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: "success" | "danger" | "neutral" | "warning";
}) {
  const toneClass =
    tone === "success"
      ? "text-[var(--success)]"
      : tone === "danger"
        ? "text-[var(--danger)]"
        : tone === "warning"
          ? "text-amber-700"
          : "text-[var(--foreground)]";

  return (
    <Card>
      <p className="text-sm text-[var(--muted)]">{label}</p>
      <p className={cn("mt-2 text-2xl font-bold", toneClass)}>{formatCurrencyFromCents(value)}</p>
    </Card>
  );
}

function Field({
  label,
  value,
  onChange,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
}) {
  return (
    <label className="space-y-1.5 text-sm font-medium">
      <span>{label}</span>
      <Input type={type} value={value} onChange={(event) => onChange(event.target.value)} required={label !== "Categoria"} />
    </label>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-[var(--muted)]">{label}</dt>
      <dd className="font-medium">{value}</dd>
    </div>
  );
}
