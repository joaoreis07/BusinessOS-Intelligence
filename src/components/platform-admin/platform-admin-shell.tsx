import Link from "next/link";
import {
  Building2,
  CreditCard,
  LayoutDashboard,
  LogOut,
  ScrollText,
  Users,
} from "lucide-react";

import { logoutAction } from "@/app/(auth)/actions";

const navigation = [
  { href: "/admin", label: "Visão geral", icon: LayoutDashboard },
  { href: "/admin/empresas", label: "Empresas", icon: Building2 },
  { href: "/admin/usuarios", label: "Usuários", icon: Users },
  { href: "/admin/assinaturas", label: "Assinaturas", icon: CreditCard },
  { href: "/admin/logs", label: "Logs", icon: ScrollText },
];

export function PlatformAdminShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[240px_1fr]">
      <aside className="border-r bg-slate-950 text-white">
        <div className="flex h-16 items-center border-b border-white/10 px-5">
          <p className="text-sm font-semibold">Admin BusinessOS</p>
        </div>
        <nav aria-label="Navegação administrativa" className="flex gap-1 overflow-x-auto p-3 lg:block">
          {navigation.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex min-w-max items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-white/70 hover:bg-white/10 hover:text-white"
            >
              <item.icon size={18} />
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="hidden border-t border-white/10 p-3 lg:block">
          <Link
            href="/dashboard"
            className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-white/70 hover:bg-white/10 hover:text-white"
          >
            Voltar ao workspace
          </Link>
        </div>
      </aside>
      <div className="min-w-0 bg-[var(--background)]">
        <header className="flex h-16 items-center justify-between border-b bg-white px-4 md:px-6">
          <p className="text-sm font-medium text-[var(--muted)]">Painel da plataforma</p>
          <form action={logoutAction}>
            <button
              type="submit"
              className="inline-flex items-center gap-2 text-sm text-[var(--muted)] hover:text-[var(--foreground)]"
            >
              <LogOut size={16} />
              Sair
            </button>
          </form>
        </header>
        <main className="mx-auto max-w-7xl p-4 py-8">{children}</main>
      </div>
    </div>
  );
}
