import Link from "next/link";
import type { LandingRenderContext } from "../../registry/types";
import type { LandingSectionDTO } from "../../types";
import { resolveBookingAction } from "../../integrations/scheduling";
import { BookingActionButton } from "./booking-action-button";

const NAV_ITEMS = [
  { id: "landing-about", label: "Sobre" },
  { id: "landing-services", label: "Serviços" },
  { id: "landing-testimonials", label: "Depoimentos" },
  { id: "landing-contact", label: "Contato" },
] as const;

type LandingHeaderProps = {
  context: LandingRenderContext;
  sections: LandingSectionDTO[];
};

function hasSection(sections: LandingSectionDTO[], sectionId: string) {
  const type = sectionId.replace("landing-", "");
  return sections.some((section) => section.type === type && section.enabled);
}

export function LandingHeader({ context, sections }: LandingHeaderProps) {
  const bookingAction = resolveBookingAction(context, {
    label: "Agendar",
  });
  const navItems = NAV_ITEMS.filter((item) => hasSection(sections, item.id));

  return (
    <header className="sticky top-0 z-40 border-b border-[var(--landing-primary)]/10 bg-[var(--landing-background)]/90 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
        <Link
          href={`/${context.slug}`}
          className="group flex min-w-0 items-center gap-3 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--landing-primary)]"
        >
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[var(--landing-primary)] font-serif text-lg font-semibold text-white">
            {(context.professionalName ?? context.companyName).charAt(0)}
          </span>
          <span className="min-w-0">
            <span className="block truncate text-sm font-semibold text-[var(--landing-foreground)]">
              {context.professionalName ?? context.companyName}
            </span>
            {context.specialty ? (
              <span className="block truncate text-xs text-[var(--landing-muted)]">
                {context.specialty}
              </span>
            ) : null}
          </span>
        </Link>

        <nav aria-label="Seções da página" className="hidden items-center gap-1 md:flex">
          {navItems.map((item) => (
            <a
              key={item.id}
              href={`#${item.id}`}
              className="rounded-lg px-3 py-2 text-sm font-medium text-[var(--landing-muted)] transition-colors hover:bg-[var(--landing-accent)]/40 hover:text-[var(--landing-primary)]"
            >
              {item.label}
            </a>
          ))}
        </nav>

        <BookingActionButton
          action={bookingAction}
          variant="primary"
          className="h-10 shrink-0 px-4 text-sm shadow-sm"
        />
      </div>
    </header>
  );
}
