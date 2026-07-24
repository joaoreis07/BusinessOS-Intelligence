import Link from "next/link";
import { ArrowRight, CalendarDays, ChartNoAxesCombined, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function Home() {
  return (
    <main>
      <header className="border-b bg-white">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
          <Link href="/" className="text-lg font-bold text-[var(--primary)]">
            BusinessOS
          </Link>
          <nav className="flex items-center gap-2">
            <Link
              href="/login"
              className="rounded-xl px-4 py-2 text-sm font-semibold hover:bg-[var(--surface-subtle)]"
            >
              Entrar
            </Link>
            <Link
              href="/cadastro"
              className="rounded-xl bg-[var(--primary)] px-4 py-2 text-sm font-semibold text-white"
            >
              Começar
            </Link>
          </nav>
        </div>
      </header>

      <section className="mx-auto grid min-h-[calc(100vh-4rem)] max-w-6xl items-center gap-12 px-4 py-20 lg:grid-cols-[1.1fr_0.9fr]">
        <div>
          <Badge>Gestão completa para negócios de serviços</Badge>
          <h1 className="mt-6 max-w-3xl text-5xl font-bold tracking-tight md:text-6xl">
            Seu negócio organizado em um único lugar.
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-[var(--muted)]">
            Landing page, agenda online, clientes, financeiro e indicadores para
            você dedicar mais tempo ao atendimento e menos à administração.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/cadastro"
              className="inline-flex h-12 items-center gap-2 rounded-xl bg-[var(--primary)] px-6 font-semibold text-white"
            >
              Criar minha conta <ArrowRight size={18} />
            </Link>
            <Link
                href="/vitta-demo"
              className="inline-flex h-12 items-center rounded-xl border bg-white px-6 font-semibold"
            >
              Ver página de exemplo
            </Link>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          {[
            {
              icon: CalendarDays,
              title: "Agenda inteligente",
              text: "Disponibilidade, bloqueios e agendamentos sem conflito.",
            },
            {
              icon: Users,
              title: "CRM integrado",
              text: "Histórico e relacionamento de cada cliente.",
            },
            {
              icon: ChartNoAxesCombined,
              title: "Visão financeira",
              text: "Receitas, despesas e indicadores claros.",
            },
          ].map((item, index) => (
            <article
              key={item.title}
              className={`rounded-2xl border bg-white p-6 ${index === 2 ? "sm:col-span-2" : ""}`}
            >
              <item.icon className="text-[var(--primary)]" />
              <h2 className="mt-6 text-lg font-semibold">{item.title}</h2>
              <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
                {item.text}
              </p>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
