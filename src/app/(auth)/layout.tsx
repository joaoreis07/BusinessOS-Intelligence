import Link from "next/link";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="grid min-h-screen bg-white lg:grid-cols-2">
      <section className="flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          <Link href="/" className="text-lg font-bold text-[var(--primary)]">
            BusinessOS
          </Link>
          <div className="mt-10">{children}</div>
        </div>
      </section>
      <aside className="hidden bg-[var(--primary)] p-12 text-white lg:flex lg:flex-col lg:justify-end">
        <p className="max-w-xl text-4xl font-semibold leading-tight">
          Menos tarefas administrativas. Mais tempo para seus clientes.
        </p>
        <p className="mt-5 max-w-lg text-white/75">
          Uma plataforma para organizar agenda, relacionamento e resultados do
          seu negócio.
        </p>
      </aside>
    </main>
  );
}
