"use client";

import { useMemo, useState, useTransition } from "react";
import { ArrowDown, ArrowUp, Loader2, Pencil, Plus, Trash2, X } from "lucide-react";

import {
  createServiceAction,
  deleteServiceAction,
  reorderServicesAction,
  updateServiceAction,
  type ServicesActionState,
} from "@/app/(workspace)/dashboard/servicos/actions";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import type { ServiceDTO } from "@/features/services/types";
import { cn, formatCurrencyFromCents } from "@/lib/utils";

type ServicesPanelProps = {
  services: ServiceDTO[];
  canManage: boolean;
};

function Feedback({ state }: { state: ServicesActionState }) {
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

const emptyForm = {
  name: "",
  description: "",
  category: "",
  durationMinutes: "30",
  price: "",
  active: true,
  publiclyVisible: true,
};

export function ServicesPanel({ services, canManage }: ServicesPanelProps) {
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<ServicesActionState>({});
  const [showCreate, setShowCreate] = useState(false);
  const [createForm, setCreateForm] = useState(emptyForm);
  const [selected, setSelected] = useState<ServiceDTO | null>(null);
  const [editForm, setEditForm] = useState(emptyForm);

  const sortedServices = useMemo(
    () => [...services].sort((a, b) => a.displayOrder - b.displayOrder || a.name.localeCompare(b.name)),
    [services],
  );

  function openEdit(service: ServiceDTO) {
    setSelected(service);
    setEditForm({
      name: service.name,
      description: service.description ?? "",
      category: service.category ?? "",
      durationMinutes: String(service.durationMinutes),
      price: String(service.priceCents / 100),
      active: service.active,
      publiclyVisible: service.publiclyVisible,
    });
    setMessage({});
  }

  function submitCreate() {
    if (!canManage) return;
    startTransition(async () => {
      const result = await createServiceAction({
        ...createForm,
        durationMinutes: Number(createForm.durationMinutes),
        price: Number(createForm.price),
      });
      setMessage(result);
      if (!result.error) {
        setCreateForm(emptyForm);
        setShowCreate(false);
      }
    });
  }

  function submitEdit() {
    if (!selected || !canManage) return;
    startTransition(async () => {
      const result = await updateServiceAction({
        id: selected.id,
        ...editForm,
        durationMinutes: Number(editForm.durationMinutes),
        price: Number(editForm.price),
      });
      setMessage(result);
      if (!result.error) {
        setSelected(null);
      }
    });
  }

  function removeService(service: ServiceDTO) {
    if (!canManage) return;
    if (!window.confirm(`Remover o serviço "${service.name}"?`)) return;
    startTransition(async () => {
      const result = await deleteServiceAction(service.id);
      setMessage(result);
      if (!result.error) setSelected(null);
    });
  }

  function moveService(service: ServiceDTO, direction: "up" | "down") {
    if (!canManage) return;
    const index = sortedServices.findIndex((item) => item.id === service.id);
    const swapIndex = direction === "up" ? index - 1 : index + 1;
    const swap = sortedServices[swapIndex];
    if (!swap) return;

    startTransition(async () => {
      const result = await reorderServicesAction([
        { id: service.id, displayOrder: swap.displayOrder },
        { id: swap.id, displayOrder: service.displayOrder },
      ]);
      setMessage(result);
    });
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold">Serviços</h1>
          <p className="mt-2 text-[var(--muted)]">
            Gerencie preços, duração, visibilidade pública e ordem na landing e no agendamento.
          </p>
        </div>
        {canManage ? (
          <Button type="button" onClick={() => setShowCreate((value) => !value)}>
            <Plus size={16} />
            Novo serviço
          </Button>
        ) : null}
      </header>

      {showCreate && canManage ? (
        <Card className="space-y-4 p-5">
          <h2 className="text-lg font-semibold">Cadastrar serviço</h2>
          <ServiceFields form={createForm} onChange={setCreateForm} />
          <div className="flex gap-2">
            <Button type="button" disabled={pending} onClick={submitCreate}>
              {pending ? "Salvando..." : "Criar serviço"}
            </Button>
            <Button type="button" variant="secondary" onClick={() => setShowCreate(false)}>
              Cancelar
            </Button>
          </div>
        </Card>
      ) : null}

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_22rem]">
        <Card className="overflow-hidden">
          {sortedServices.length ? (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="border-b bg-[var(--surface-subtle)] text-left text-[var(--muted)]">
                  <tr>
                    <th className="px-4 py-3 font-medium">Serviço</th>
                    <th className="px-4 py-3 font-medium">Duração</th>
                    <th className="px-4 py-3 font-medium">Valor</th>
                    <th className="px-4 py-3 font-medium">Status</th>
                    {canManage ? <th className="px-4 py-3 font-medium">Ordem</th> : null}
                  </tr>
                </thead>
                <tbody>
                  {sortedServices.map((service) => (
                    <tr
                      key={service.id}
                      className={cn(
                        "border-b transition hover:bg-[var(--surface-subtle)]",
                        selected?.id === service.id && "bg-[var(--accent)]",
                      )}
                    >
                      <td className="px-4 py-4">
                        <button
                          type="button"
                          className="text-left"
                          onClick={() => openEdit(service)}
                        >
                          <p className="font-semibold">{service.name}</p>
                          {service.description ? (
                            <p className="mt-1 text-xs text-[var(--muted)]">{service.description}</p>
                          ) : null}
                        </button>
                      </td>
                      <td className="px-4 py-4">{service.durationMinutes} min</td>
                      <td className="px-4 py-4">{formatCurrencyFromCents(service.priceCents)}</td>
                      <td className="px-4 py-4">
                        <div className="flex flex-wrap gap-1.5">
                          <StatusPill active={service.active} label={service.active ? "Ativo" : "Inativo"} />
                          <StatusPill
                            active={service.publiclyVisible}
                            label={service.publiclyVisible ? "Público" : "Interno"}
                          />
                        </div>
                      </td>
                      {canManage ? (
                        <td className="px-4 py-4">
                          <div className="flex gap-1">
                            <Button
                              type="button"
                              variant="ghost"
                              aria-label={`Subir ${service.name}`}
                              onClick={() => moveService(service, "up")}
                            >
                              <ArrowUp size={16} />
                            </Button>
                            <Button
                              type="button"
                              variant="ghost"
                              aria-label={`Descer ${service.name}`}
                              onClick={() => moveService(service, "down")}
                            >
                              <ArrowDown size={16} />
                            </Button>
                          </div>
                        </td>
                      ) : null}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="px-6 py-16 text-center text-[var(--muted)]">
              Nenhum serviço cadastrado ainda.
            </div>
          )}
        </Card>

        <aside className="rounded-2xl border bg-white p-5 shadow-sm">
          {selected ? (
            <div className="space-y-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm text-[var(--muted)]">Editar serviço</p>
                  <h2 className="text-xl font-semibold">{selected.name}</h2>
                </div>
                <button
                  type="button"
                  aria-label="Fechar edição"
                  className="rounded-lg p-2 hover:bg-[var(--surface-subtle)]"
                  onClick={() => setSelected(null)}
                >
                  <X size={16} />
                </button>
              </div>

              {canManage ? (
                <>
                  <ServiceFields form={editForm} onChange={setEditForm} />
                  <div className="flex flex-wrap gap-2">
                    <Button type="button" disabled={pending} onClick={submitEdit}>
                      {pending ? (
                        <>
                          <Loader2 className="animate-spin" size={16} />
                          Salvando...
                        </>
                      ) : (
                        <>
                          <Pencil size={16} />
                          Salvar
                        </>
                      )}
                    </Button>
                    <Button
                      type="button"
                      variant="danger"
                      disabled={pending}
                      onClick={() => removeService(selected)}
                    >
                      <Trash2 size={16} />
                      Remover
                    </Button>
                  </div>
                </>
              ) : (
                <dl className="space-y-3 text-sm">
                  <DetailRow label="Duração" value={`${selected.durationMinutes} min`} />
                  <DetailRow label="Valor" value={formatCurrencyFromCents(selected.priceCents)} />
                  <DetailRow label="Ativo" value={selected.active ? "Sim" : "Não"} />
                  <DetailRow label="Público" value={selected.publiclyVisible ? "Sim" : "Não"} />
                </dl>
              )}
            </div>
          ) : (
            <p className="py-16 text-center text-sm text-[var(--muted)]">
              Selecione um serviço para editar detalhes, visibilidade e ordem.
            </p>
          )}
        </aside>
      </div>

      <Feedback state={message} />
    </div>
  );
}

function ServiceFields({
  form,
  onChange,
}: {
  form: typeof emptyForm;
  onChange: (value: typeof emptyForm) => void;
}) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <Field label="Nome" value={form.name} onChange={(value) => onChange({ ...form, name: value })} />
      <Field label="Categoria" value={form.category} onChange={(value) => onChange({ ...form, category: value })} />
      <Field
        label="Duração (min)"
        type="number"
        value={form.durationMinutes}
        onChange={(value) => onChange({ ...form, durationMinutes: value })}
      />
      <Field
        label="Valor (R$)"
        type="number"
        value={form.price}
        onChange={(value) => onChange({ ...form, price: value })}
      />
      <label className="space-y-1.5 text-sm font-medium sm:col-span-2">
        <span>Descrição</span>
        <textarea
          value={form.description}
          onChange={(event) => onChange({ ...form, description: event.target.value })}
          rows={3}
          className="w-full rounded-xl border px-3 py-2 text-sm"
        />
      </label>
      <label className="inline-flex items-center gap-2 text-sm font-medium">
        <input
          type="checkbox"
          checked={form.active}
          onChange={(event) => onChange({ ...form, active: event.target.checked })}
        />
        Ativo
      </label>
      <label className="inline-flex items-center gap-2 text-sm font-medium">
        <input
          type="checkbox"
          checked={form.publiclyVisible}
          onChange={(event) => onChange({ ...form, publiclyVisible: event.target.checked })}
        />
        Visível na landing e agendamento
      </label>
    </div>
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
      <Input type={type} value={value} onChange={(event) => onChange(event.target.value)} required={label === "Nome"} />
    </label>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-[var(--muted)]">{label}</dt>
      <dd className="font-medium">{value}</dd>
    </div>
  );
}

function StatusPill({ active, label }: { active: boolean; label: string }) {
  return (
    <span
      className={cn(
        "inline-flex rounded-full px-2 py-0.5 text-xs font-semibold",
        active ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-600",
      )}
    >
      {label}
    </span>
  );
}
