import type { ReactNode } from "react";
import Link from "next/link";
import { AlertTriangle, Ban, FileQuestion } from "lucide-react";

type PublicStateShellProps = {
  title: string;
  description: string;
  icon: ReactNode;
  slug?: string;
};

function PublicStateShell({ title, description, icon, slug }: PublicStateShellProps) {
  return (
    <main
      id="landing-unavailable"
      className="flex min-h-[70vh] items-center justify-center bg-[var(--background)] px-4 py-16"
      aria-label="Página indisponível"
    >
      <div className="w-full max-w-lg rounded-2xl border bg-white p-8 text-center shadow-sm">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[var(--surface-subtle)] text-[var(--primary)]">
          {icon}
        </div>
        <h1 className="mt-5 text-2xl font-bold">{title}</h1>
        <p className="mt-3 text-sm leading-7 text-[var(--muted)]">{description}</p>
        {slug ? (
          <p className="mt-2 text-xs text-[var(--muted)]">
            Referência: <span className="font-mono">{slug}</span>
          </p>
        ) : null}
        <Link
          href="/"
          className="mt-8 inline-flex h-11 items-center rounded-xl bg-[var(--primary)] px-5 text-sm font-semibold text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--primary)]"
        >
          Voltar ao BusinessOS
        </Link>
      </div>
    </main>
  );
}

export function LandingInactivePage({ slug }: { slug: string }) {
  return (
    <PublicStateShell
      slug={slug}
      title="Empresa indisponível"
      description="Esta empresa não está ativa no momento. Tente novamente mais tarde ou entre em contato diretamente."
      icon={<Ban size={24} aria-hidden />}
    />
  );
}

export function LandingUnpublishedPage({ slug }: { slug: string }) {
  return (
    <PublicStateShell
      slug={slug}
      title="Página em preparação"
      description="Esta landing ainda não foi publicada. Se você é o responsável, acesse o workspace para publicá-la."
      icon={<FileQuestion size={24} aria-hidden />}
    />
  );
}

export function LandingPreviewInvalidPage({ slug }: { slug: string }) {
  return (
    <PublicStateShell
      slug={slug}
      title="Preview inválido ou expirado"
      description="O link de visualização não é mais válido. Gere um novo preview no editor da landing."
      icon={<AlertTriangle size={24} aria-hidden />}
    />
  );
}

export function LandingErrorPage({ message }: { message: string }) {
  return (
    <PublicStateShell
      title="Não foi possível carregar a página"
      description={message}
      icon={<AlertTriangle size={24} aria-hidden />}
    />
  );
}

export function LandingEmptyPage({ companyName }: { companyName: string }) {
  return (
    <section
      aria-label="Conteúdo em configuração"
      className="border-t border-[var(--landing-muted)]/20 bg-[var(--landing-surface-subtle)] py-16 text-center"
    >
      <div className="mx-auto max-w-xl px-4">
        <h2 className="font-serif text-2xl font-semibold">Página em configuração</h2>
        <p className="mt-3 text-sm leading-7 text-[var(--landing-muted)]">
          A landing de {companyName} ainda não possui seções visíveis. Volte em breve.
        </p>
      </div>
    </section>
  );
}
