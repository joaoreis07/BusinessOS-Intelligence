import Link from "next/link";
import {
  Building2,
  CalendarDays,
  ChartNoAxesCombined,
  CircleDollarSign,
  ContactRound,
  CreditCard,
  Globe2,
  LogOut,
  ShieldCheck,
  UserPlus,
  Settings,
  Sparkles,
  Wrench,
} from "lucide-react";
import { logoutAction } from "@/app/(auth)/actions";
import { listMyWorkspaces } from "@/features/workspace";
import type { CompanyContext } from "@/lib/tenancy/context";
import { CompanySwitcher } from "@/components/workspace/company-switcher";

const baseNavigation = [
  { href: "/dashboard", label: "Visão geral", icon: ChartNoAxesCombined },
  { href: "/dashboard/agenda", label: "Agenda", icon: CalendarDays },
  { href: "/dashboard/clientes", label: "Clientes", icon: ContactRound },
  { href: "/dashboard/financeiro", label: "Financeiro", icon: CircleDollarSign },
  { href: "/dashboard/landing", label: "Landing page", icon: Globe2 },
  { href: "/dashboard/servicos", label: "Serviços", icon: Wrench },
  { href: "/dashboard/assinatura", label: "Assinatura", icon: CreditCard },
  { href: "/dashboard/membros", label: "Membros", icon: ShieldCheck },
  { href: "/dashboard/convites", label: "Convites", icon: UserPlus },
  { href: "/dashboard/configuracoes", label: "Configurações", icon: Settings },
];

const aiNavigationItem = {
  href: "/dashboard/ia",
  label: "BusinessOS AI",
  icon: Sparkles,
};

export async function WorkspaceShell({
  context,
  aiEnabled = false,
  children,
}: {
  context: CompanyContext;
  aiEnabled?: boolean;
  children: React.ReactNode;
}) {
  const workspaces = await listMyWorkspaces();
  const navigation = aiEnabled
    ? [
        baseNavigation[0],
        aiNavigationItem,
        ...baseNavigation.slice(1),
      ]
    : baseNavigation;
  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[260px_1fr]">
      <aside className="border-r bg-white">
        <div className="flex h-16 items-center gap-3 border-b px-5">
          <span className="grid size-9 place-items-center rounded-xl bg-[var(--primary)] text-white">
            <Building2 size={18} />
          </span>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold">{context.company.name}</p>
            <p className="text-xs text-[var(--muted)]">BusinessOS</p>
          </div>
        </div>
        <nav aria-label="Navegação principal" className="flex gap-1 overflow-x-auto p-3 lg:block">
          {navigation.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex min-w-max items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-[var(--muted)] hover:bg-[var(--surface-subtle)] hover:text-[var(--foreground)]"
            >
              <item.icon size={18} />
              {item.label}
            </Link>
          ))}
        </nav>
      </aside>
      <div className="min-w-0">
        <header className="flex h-16 items-center justify-between border-b bg-white px-4 md:px-6">
          <div>
            <p className="text-xs text-[var(--muted)]">Empresa atual</p>
            <p className="text-sm font-semibold">{context.company.name}</p>
          </div>
          <div className="flex items-center gap-2">
            <CompanySwitcher
              workspaces={workspaces}
              currentCompanyId={context.companyId}
            />
            <form action={logoutAction}>
              <button
                type="submit"
                className="inline-flex h-10 items-center gap-2 rounded-xl px-3 text-sm font-medium hover:bg-[var(--surface-subtle)]"
              >
                <LogOut size={17} />
                Sair
              </button>
            </form>
          </div>
        </header>
        <main className="p-4 md:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
