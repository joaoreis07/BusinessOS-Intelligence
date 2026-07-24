import Link from "next/link";
import { CalendarClock, ShieldAlert } from "lucide-react";
import { SchedulingSettingsPanel } from "@/components/scheduling/scheduling-settings-panel";
import { Card } from "@/components/ui/card";
import { getSchedulingConfiguration } from "@/features/scheduling/settings/server";
import { hasCompanyPermission } from "@/lib/permissions/company-permissions";
import { requireCompanyContext } from "@/lib/tenancy/context";

export default async function SchedulingSettingsPage() {
  const context = await requireCompanyContext();
  const canConfigure = hasCompanyPermission(context.role, "scheduling:configure");

  if (!canConfigure) {
    return (
      <div className="space-y-6">
        <header>
          <h1 className="text-3xl font-bold">Agendamento</h1>
          <p className="mt-2 text-[var(--muted)]">
            Configurações de horários, bloqueios e regras do agendamento.
          </p>
        </header>
        <Card className="flex flex-col items-center gap-4 py-16 text-center">
          <ShieldAlert className="text-[var(--muted)]" size={40} aria-hidden="true" />
          <div>
            <p className="font-semibold">Acesso restrito</p>
            <p className="mt-2 max-w-md text-sm text-[var(--muted)]">
              Apenas proprietários, administradores e gestores podem configurar o agendamento.
            </p>
          </div>
        </Card>
      </div>
    );
  }

  const configuration = await getSchedulingConfiguration();
  const panelKey = configuration.blockedPeriods.map((block) => block.id).join("|") || "empty";

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="inline-flex items-center gap-2 text-sm font-medium text-[var(--primary)]">
            <CalendarClock size={16} aria-hidden="true" />
            Configurações do workspace
          </p>
          <h1 className="mt-2 text-3xl font-bold">Agendamento</h1>
          <p className="mt-2 max-w-2xl text-[var(--muted)]">
            Defina horários de funcionamento, bloqueios e regras gerais usadas pela agenda e pelo
            fluxo público.
          </p>
        </div>
        <Link
          href="/dashboard/configuracoes"
          className="text-sm font-medium text-[var(--primary)] hover:underline"
        >
          Voltar para configurações
        </Link>
      </header>

      <SchedulingSettingsPanel key={panelKey} configuration={configuration} />
    </div>
  );
}
