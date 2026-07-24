"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { ArrowLeft, Loader2, Pencil, Trash2 } from "lucide-react";

import {
  addCustomerNoteAction,
  deleteCustomerAction,
  updateCustomerAction,
  updateCustomerStatusAction,
  type CustomersActionState,
} from "@/app/(workspace)/dashboard/clientes/actions";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  CUSTOMER_STATUS_LABELS,
  customerStatusTone,
} from "@/features/customers/panel/status";
import type { CustomerStatus } from "@/features/customers/schemas";
import type { CustomerDetailDTO, CustomerPanelCapabilitiesDTO } from "@/features/customers/types";
import { APPOINTMENT_STATUS_LABELS } from "@/features/scheduling/panel/status";
import type { AppointmentStatus } from "@/features/scheduling/schemas";
import { cn, formatCurrencyFromCents } from "@/lib/utils";

type CustomerProfilePanelProps = {
  customer: CustomerDetailDTO;
  capabilities: CustomerPanelCapabilitiesDTO;
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

export function CustomerProfilePanel({ customer, capabilities }: CustomerProfilePanelProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<CustomersActionState>({});
  const [editing, setEditing] = useState(false);
  const [noteDraft, setNoteDraft] = useState("");
  const [form, setForm] = useState({
    name: customer.name,
    phone: customer.phone,
    email: customer.email ?? "",
    whatsapp: customer.whatsapp ?? "",
    objectives: customer.objectives ?? "",
    profession: customer.profession ?? "",
    city: customer.city ?? "",
    state: customer.state ?? "",
    status: customer.status,
  });

  function submitEdit() {
    if (!capabilities.canManage) return;
    startTransition(async () => {
      const result = await updateCustomerAction({
        id: customer.id,
        ...form,
        email: form.email || null,
        whatsapp: form.whatsapp || null,
        objectives: form.objectives || null,
        profession: form.profession || null,
        city: form.city || null,
        state: form.state || null,
      });
      setMessage(result);
      if (!result.error) {
        setEditing(false);
        router.refresh();
      }
    });
  }

  function submitNote() {
    if (!capabilities.canManage || !noteDraft.trim()) return;
    startTransition(async () => {
      const result = await addCustomerNoteAction({
        customerId: customer.id,
        content: noteDraft.trim(),
      });
      setMessage(result);
      if (!result.error) {
        setNoteDraft("");
        router.refresh();
      }
    });
  }

  function removeCustomer() {
    if (!capabilities.canManage) return;
    if (!window.confirm(`Remover o cliente "${customer.name}"?`)) return;
    startTransition(async () => {
      const result = await deleteCustomerAction(customer.id);
      setMessage(result);
      if (!result.error) {
        router.push("/dashboard/clientes");
        router.refresh();
      }
    });
  }

  function changeStatus(status: CustomerStatus) {
    if (!capabilities.canManage) return;
    startTransition(async () => {
      const result = await updateCustomerStatusAction({ id: customer.id, status });
      setMessage(result);
      if (!result.error) {
        setForm((current) => ({ ...current, status }));
        router.refresh();
      }
    });
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="space-y-3">
          <Link
            href="/dashboard/clientes"
            className="inline-flex items-center gap-2 text-sm text-[var(--muted)] hover:text-[var(--foreground)]"
          >
            <ArrowLeft size={16} />
            Voltar para clientes
          </Link>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-3xl font-bold">{customer.name}</h1>
              <span
                className={cn(
                  "inline-flex rounded-full px-2.5 py-1 text-xs font-semibold",
                  customerStatusTone(customer.status),
                )}
              >
                {CUSTOMER_STATUS_LABELS[customer.status]}
              </span>
            </div>
            <p className="mt-2 text-[var(--muted)]">
              {customer.phone}
              {customer.email ? ` · ${customer.email}` : ""}
            </p>
            <p className="mt-1 text-sm text-[var(--muted)]">
              Origem: {customer.acquisitionSource ?? "Manual"} · Cadastro em{" "}
              {new Intl.DateTimeFormat("pt-BR").format(new Date(customer.createdAt))}
            </p>
          </div>
        </div>

        {capabilities.canManage ? (
          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="secondary" onClick={() => setEditing((value) => !value)}>
              <Pencil size={16} />
              {editing ? "Cancelar edição" : "Editar"}
            </Button>
            <Button type="button" variant="danger" disabled={pending} onClick={removeCustomer}>
              <Trash2 size={16} />
              Remover
            </Button>
          </div>
        ) : null}
      </header>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_22rem]">
        <div className="space-y-6">
          <Card className="space-y-4 p-5">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-lg font-semibold">Perfil</h2>
              {capabilities.canManage ? (
                <select
                  value={form.status}
                  onChange={(event) => changeStatus(event.target.value as CustomerStatus)}
                  className="h-9 rounded-lg border px-2 text-sm"
                >
                  {(Object.keys(CUSTOMER_STATUS_LABELS) as CustomerStatus[]).map((status) => (
                    <option key={status} value={status}>
                      {CUSTOMER_STATUS_LABELS[status]}
                    </option>
                  ))}
                </select>
              ) : null}
            </div>

            {editing && capabilities.canManage ? (
              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="Nome" value={form.name} onChange={(value) => setForm({ ...form, name: value })} />
                <Field label="Telefone" value={form.phone} onChange={(value) => setForm({ ...form, phone: value })} />
                <Field label="E-mail" value={form.email} onChange={(value) => setForm({ ...form, email: value })} />
                <Field label="WhatsApp" value={form.whatsapp} onChange={(value) => setForm({ ...form, whatsapp: value })} />
                <Field label="Profissão" value={form.profession} onChange={(value) => setForm({ ...form, profession: value })} />
                <Field label="Cidade" value={form.city} onChange={(value) => setForm({ ...form, city: value })} />
                <Field label="Estado" value={form.state} onChange={(value) => setForm({ ...form, state: value })} />
                <label className="space-y-1.5 text-sm font-medium sm:col-span-2">
                  <span>Objetivo</span>
                  <textarea
                    value={form.objectives}
                    onChange={(event) => setForm({ ...form, objectives: event.target.value })}
                    rows={3}
                    className="w-full rounded-xl border px-3 py-2 text-sm"
                  />
                </label>
                <Button type="button" disabled={pending} onClick={submitEdit}>
                  {pending ? "Salvando..." : "Salvar perfil"}
                </Button>
              </div>
            ) : (
              <dl className="grid gap-4 sm:grid-cols-2">
                <Detail label="Telefone" value={customer.phone} />
                <Detail label="E-mail" value={customer.email ?? "—"} />
                <Detail label="WhatsApp" value={customer.whatsapp ?? "—"} />
                <Detail label="Profissão" value={customer.profession ?? "—"} />
                <Detail label="Cidade" value={customer.city ?? "—"} />
                <Detail label="Estado" value={customer.state ?? "—"} />
                <Detail label="Objetivo" value={customer.objectives ?? "—"} className="sm:col-span-2" />
              </dl>
            )}
          </Card>

          <Card className="space-y-4 p-5">
            <h2 className="text-lg font-semibold">Histórico de agendamentos</h2>
            {customer.appointments.length ? (
              <div className="divide-y">
                {customer.appointments.map((appointment) => (
                  <div key={appointment.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
                    <div>
                      <p className="font-medium">{appointment.serviceName}</p>
                      <p className="text-sm text-[var(--muted)]">
                        {new Intl.DateTimeFormat("pt-BR", {
                          dateStyle: "medium",
                          timeStyle: "short",
                        }).format(new Date(appointment.startsAt))}
                      </p>
                    </div>
                    <Link
                      href={`/dashboard/agenda?selected=${appointment.id}`}
                      className="rounded-full bg-[var(--surface-subtle)] px-2.5 py-1 text-xs font-semibold hover:bg-[var(--accent)]"
                    >
                      {APPOINTMENT_STATUS_LABELS[appointment.status as AppointmentStatus] ??
                        appointment.status}
                    </Link>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-[var(--muted)]">Nenhum agendamento registrado.</p>
            )}
          </Card>

          <Card className="space-y-4 p-5">
            <h2 className="text-lg font-semibold">Movimentações financeiras</h2>
            {customer.financialEntries.length ? (
              <div className="divide-y">
                {customer.financialEntries.map((entry) => (
                  <div key={entry.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
                    <div>
                      <p className="font-medium">{entry.description ?? "Movimentação"}</p>
                      <p className="text-sm text-[var(--muted)]">
                        {new Intl.DateTimeFormat("pt-BR").format(new Date(entry.dueDate))}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">
                        {entry.kind === "expense" ? "-" : "+"}
                        {formatCurrencyFromCents(entry.amountCents)}
                      </p>
                      <p className="text-xs text-[var(--muted)]">{entry.status}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-[var(--muted)]">Nenhuma movimentação vinculada.</p>
            )}
          </Card>
        </div>

        <aside className="space-y-4">
          <Card className="space-y-4 p-5">
            <h2 className="text-lg font-semibold">Observações</h2>
            {customer.notes.length ? (
              <div className="space-y-3">
                {customer.notes.map((note) => (
                  <div key={note.id} className="rounded-xl border bg-[var(--surface-subtle)] p-3">
                    <p className="text-sm">{note.content}</p>
                    <p className="mt-2 text-xs text-[var(--muted)]">
                      {new Intl.DateTimeFormat("pt-BR", {
                        dateStyle: "medium",
                        timeStyle: "short",
                      }).format(new Date(note.createdAt))}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-[var(--muted)]">Nenhuma observação registrada.</p>
            )}

            {capabilities.canManage ? (
              <div className="space-y-3 border-t pt-4">
                <label className="block space-y-1.5 text-sm font-medium">
                  <span>Nova observação</span>
                  <textarea
                    value={noteDraft}
                    onChange={(event) => setNoteDraft(event.target.value)}
                    rows={4}
                    className="w-full rounded-xl border px-3 py-2 text-sm"
                    placeholder="Registre contexto, preferências ou follow-up."
                  />
                </label>
                <Button type="button" disabled={pending || !noteDraft.trim()} onClick={submitNote}>
                  {pending ? (
                    <>
                      <Loader2 className="animate-spin" size={16} />
                      Salvando...
                    </>
                  ) : (
                    "Adicionar observação"
                  )}
                </Button>
              </div>
            ) : null}
          </Card>
        </aside>
      </div>

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
      <Input value={value} onChange={(event) => onChange(event.target.value)} />
    </label>
  );
}

function Detail({
  label,
  value,
  className,
}: {
  label: string;
  value: string;
  className?: string;
}) {
  return (
    <div className={className}>
      <dt className="text-sm text-[var(--muted)]">{label}</dt>
      <dd className="mt-1 font-medium">{value}</dd>
    </div>
  );
}
