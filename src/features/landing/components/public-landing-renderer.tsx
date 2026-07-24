import type { PreviewLandingDTO, PublicLandingDTO } from "../types";
import { toLandingRenderContext } from "../registry/landing-context";
import { resolveRenderableSections } from "../registry/resolve-sections";
import { LandingTheme } from "./ui/landing-theme";
import { PreviewBanner } from "./preview-banner";
import { SectionRenderer } from "./section-renderer";

export type PublicLandingRendererProps = {
  landing: PublicLandingDTO | PreviewLandingDTO;
};

export function PublicLandingRenderer({ landing }: PublicLandingRendererProps) {
  const context = toLandingRenderContext(landing);
  const sections = resolveRenderableSections(landing.sections);

  return (
    <LandingTheme branding={landing.branding}>
      <a
        href="#landing-main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-[var(--landing-primary)] focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-white focus:outline-none"
      >
        Pular para o conteúdo
      </a>
      {landing.mode === "preview" ? <PreviewBanner landing={landing} /> : null}
      <main id="landing-main" aria-label={`Página de ${landing.companyName}`}>
        {sections.length === 0 ? (
          <section
            aria-label="Conteúdo em configuração"
            className="px-4 py-16 text-center sm:px-6"
          >
            <h2 className="font-serif text-2xl font-semibold">Página em configuração</h2>
            <p className="mx-auto mt-3 max-w-xl text-sm leading-7 text-[var(--landing-muted)]">
              A landing de {landing.companyName} ainda não possui seções visíveis. Volte em breve.
            </p>
          </section>
        ) : (
          sections.map((section) => (
            <SectionRenderer
              key={`${section.type}-${section.displayOrder}`}
              section={section}
              context={context}
            />
          ))
        )}
      </main>
    </LandingTheme>
  );
}
