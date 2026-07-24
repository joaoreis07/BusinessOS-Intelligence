import Link from "next/link";
import { CompanyForm } from "@/components/forms/workspace-forms";
import { Card } from "@/components/ui/card";
import { getActiveCompany, getCompanySettings } from "@/features/companies";
import { requireCompanyContext } from "@/lib/tenancy/context";

export default async function SettingsPage() {
  const { company: contextCompany } = await requireCompanyContext();
  const [company, settings] = await Promise.all([
    getActiveCompany(),
    getCompanySettings(),
  ]);
  if (!company) return null;
  const address = (company.address ?? {}) as Record<string, string>;

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-3xl font-bold">Configurações</h1>
        <p className="mt-2 text-[var(--muted)]">
          Dados da empresa e preferências do ambiente.
        </p>
      </header>
      <Card>
        <h2 className="mb-5 text-lg font-semibold">Perfil da empresa</h2>
        <CompanyForm
          company={{
            name: company.name,
            description: company.description,
            whatsapp: company.whatsapp,
            email: company.email,
            city: address.city ?? null,
            state: address.state ?? null,
          }}
        />
      </Card>
      <Card>
        <h2 className="text-lg font-semibold">Operação</h2>
        <dl className="mt-4 grid gap-4 text-sm md:grid-cols-3">
          <div><dt className="text-[var(--muted)]">Slug público</dt><dd className="mt-1 font-medium">/{contextCompany.slug}</dd></div>
          <div><dt className="text-[var(--muted)]">Fuso horário</dt><dd className="mt-1 font-medium">{settings?.timezone ?? contextCompany.timezone}</dd></div>
          <div><dt className="text-[var(--muted)]">Status</dt><dd className="mt-1 font-medium">{contextCompany.status}</dd></div>
        </dl>
      </Card>
      <Card>
        <h2 className="text-lg font-semibold">Agendamento</h2>
        <p className="mt-2 text-sm text-[var(--muted)]">
          Horários de funcionamento, bloqueios e regras do fluxo de agendamento.
        </p>
        <Link
          href="/dashboard/configuracoes/agendamento"
          className="mt-4 inline-flex h-10 items-center rounded-xl bg-[var(--primary)] px-4 text-sm font-semibold text-white"
        >
          Configurar agendamento
        </Link>
      </Card>
    </div>
  );
}
