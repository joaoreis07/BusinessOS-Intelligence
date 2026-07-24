import Link from "next/link";

export default function NotFoundPage() {
  return (
    <main className="grid min-h-screen place-items-center px-4 text-center">
      <div>
        <p className="text-sm font-semibold text-[var(--primary)]">Erro 404</p>
        <h1 className="mt-3 text-4xl font-bold">Página não encontrada</h1>
        <p className="mt-4 text-[var(--muted)]">
          O endereço pode ter mudado ou não está mais disponível.
        </p>
        <Link
          href="/"
          className="mt-7 inline-flex h-11 items-center rounded-xl bg-[var(--primary)] px-5 font-semibold text-white"
        >
          Ir para o início
        </Link>
      </div>
    </main>
  );
}
