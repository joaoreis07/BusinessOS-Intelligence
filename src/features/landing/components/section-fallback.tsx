import type { LandingSectionDTO } from "../types";
import type { LandingRenderContext } from "../registry/types";

export type SectionFallbackProps = {
  section: LandingSectionDTO;
  context: LandingRenderContext;
};

export function SectionFallback({ section }: SectionFallbackProps) {
  if (process.env.NODE_ENV === "production") return null;

  return (
    <section
      aria-label="Seção não registrada"
      data-section-type={section.type}
      className="border border-dashed border-amber-400/50 bg-amber-50 px-4 py-6 text-center text-sm text-amber-900"
    >
      Seção não registrada: <strong>{section.type}</strong>
    </section>
  );
}
