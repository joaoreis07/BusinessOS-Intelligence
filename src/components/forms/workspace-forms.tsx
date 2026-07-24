"use client";

import { useActionState } from "react";
import {
  createCustomerAction,
  createServiceAction,
  createTransactionAction,
  updateCompanyAction,
  updateLandingAction,
} from "@/app/(workspace)/dashboard/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

function Feedback({ state }: { state: { error?: string; success?: string } }) {
  if (state.error) return <p role="alert" className="text-sm text-[var(--danger)]">{state.error}</p>;
  if (state.success) return <p role="status" className="text-sm text-[var(--success)]">{state.success}</p>;
  return null;
}

export function CustomerForm() {
  const [state, action, pending] = useActionState(createCustomerAction, {});
  return (
    <form action={action} className="grid gap-3 md:grid-cols-2">
      <Input name="name" aria-label="Nome completo" placeholder="Nome completo" required />
      <Input name="phone" aria-label="Telefone ou WhatsApp" placeholder="Telefone / WhatsApp" required />
      <Input name="email" aria-label="E-mail" type="email" placeholder="E-mail (opcional)" />
      <Input name="objective" aria-label="Objetivo" placeholder="Objetivo (opcional)" />
      <Feedback state={state} />
      <Button type="submit" disabled={pending} className="md:col-span-2 md:w-fit">
        {pending ? "Salvando..." : "Adicionar cliente"}
      </Button>
    </form>
  );
}

export function ServiceForm() {
  const [state, action, pending] = useActionState(createServiceAction, {});
  return (
    <form action={action} className="grid gap-3 md:grid-cols-2">
      <Input name="name" aria-label="Nome do serviço" placeholder="Nome do serviço" required />
      <Input name="description" aria-label="Descrição do serviço" placeholder="Descrição" />
      <Input name="durationMinutes" aria-label="Duração em minutos" type="number" min="15" step="15" placeholder="Duração em minutos" required />
      <Input name="price" aria-label="Valor em reais" type="number" min="0.01" step="0.01" placeholder="Valor em reais" required />
      <Feedback state={state} />
      <Button type="submit" disabled={pending} className="md:col-span-2 md:w-fit">
        {pending ? "Salvando..." : "Criar serviço"}
      </Button>
    </form>
  );
}

export function TransactionForm() {
  const [state, action, pending] = useActionState(createTransactionAction, {});
  return (
    <form action={action} className="grid gap-3 md:grid-cols-4">
      <select name="type" aria-label="Tipo de movimentação" className="h-11 rounded-xl border bg-white px-3 text-sm">
        <option value="income">Receita</option>
        <option value="expense">Despesa</option>
      </select>
      <Input name="description" aria-label="Descrição da movimentação" placeholder="Descrição" required />
      <Input name="amount" aria-label="Valor em reais" type="number" min="0.01" step="0.01" placeholder="Valor em reais" required />
      <select name="status" aria-label="Status da movimentação" className="h-11 rounded-xl border bg-white px-3 text-sm">
        <option value="paid">Pago</option>
        <option value="pending">Pendente</option>
      </select>
      <Feedback state={state} />
      <Button type="submit" disabled={pending} className="md:col-span-4 md:w-fit">
        {pending ? "Salvando..." : "Registrar movimentação"}
      </Button>
    </form>
  );
}

export function CompanyForm({
  company,
}: {
  company: {
    name: string;
    description: string | null;
    whatsapp: string | null;
    email: string | null;
    city: string | null;
    state: string | null;
  };
}) {
  const [state, action, pending] = useActionState(updateCompanyAction, {});
  return (
    <form action={action} className="grid gap-4 md:grid-cols-2">
      <label className="space-y-1.5 text-sm font-medium">
        <span>Nome da empresa</span>
        <Input name="name" defaultValue={company.name} required />
      </label>
      <label className="space-y-1.5 text-sm font-medium">
        <span>WhatsApp</span>
        <Input name="whatsapp" defaultValue={company.whatsapp ?? ""} />
      </label>
      <label className="space-y-1.5 text-sm font-medium">
        <span>E-mail</span>
        <Input name="email" type="email" defaultValue={company.email ?? ""} />
      </label>
      <label className="space-y-1.5 text-sm font-medium">
        <span>Cidade</span>
        <Input name="city" defaultValue={company.city ?? ""} />
      </label>
      <label className="space-y-1.5 text-sm font-medium">
        <span>Estado</span>
        <Input name="state" maxLength={2} defaultValue={company.state ?? ""} />
      </label>
      <label className="space-y-1.5 text-sm font-medium md:col-span-2">
        <span>Descrição</span>
        <textarea
          name="description"
          defaultValue={company.description ?? ""}
          className="min-h-28 w-full rounded-xl border bg-white p-3 text-sm"
        />
      </label>
      <Feedback state={state} />
      <Button type="submit" disabled={pending} className="md:col-span-2 md:w-fit">
        {pending ? "Salvando..." : "Salvar configurações"}
      </Button>
    </form>
  );
}

export function LandingForm({
  landing,
}: {
  landing: {
    hero_title?: string | null;
    hero_subtitle?: string | null;
    about_title?: string | null;
    about_body?: string | null;
  };
}) {
  const [state, action, pending] = useActionState(updateLandingAction, {});
  return (
    <form action={action} className="space-y-4">
      <label className="block space-y-1.5 text-sm font-medium">
        <span>Título principal</span>
        <Input name="heroTitle" defaultValue={landing.hero_title ?? ""} required />
      </label>
      <label className="block space-y-1.5 text-sm font-medium">
        <span>Descrição principal</span>
        <textarea name="heroSubtitle" defaultValue={landing.hero_subtitle ?? ""} required className="min-h-24 w-full rounded-xl border bg-white p-3 text-sm" />
      </label>
      <label className="block space-y-1.5 text-sm font-medium">
        <span>Título da seção sobre</span>
        <Input name="aboutTitle" defaultValue={landing.about_title ?? ""} required />
      </label>
      <label className="block space-y-1.5 text-sm font-medium">
        <span>Texto sobre a empresa</span>
        <textarea name="aboutBody" defaultValue={landing.about_body ?? ""} required className="min-h-36 w-full rounded-xl border bg-white p-3 text-sm" />
      </label>
      <Feedback state={state} />
      <Button type="submit" disabled={pending}>
        {pending ? "Publicando..." : "Salvar e publicar"}
      </Button>
    </form>
  );
}
