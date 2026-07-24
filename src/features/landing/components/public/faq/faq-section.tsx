"use client";

import { useId, useState } from "react";
import { ChevronDown } from "lucide-react";
import type { FaqSectionDTO } from "../../../types";
import type { SectionComponentProps } from "../../../registry/types";
import { LandingSectionShell } from "../../ui/landing-section-shell";
import { cn } from "@/lib/utils";

export type FaqSectionProps = SectionComponentProps<FaqSectionDTO>;

export function FaqSection({ section }: FaqSectionProps) {
  const baseId = useId();
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  if (!section.items.length) return null;

  return (
    <LandingSectionShell
      id="landing-faq"
      ariaLabel="Perguntas frequentes"
      dataSectionType="faq"
      className="bg-[var(--landing-surface-subtle)] py-16 sm:py-20"
      containerClassName="max-w-3xl"
    >
      {section.title ? (
        <h2 className="text-center font-serif text-3xl font-semibold sm:text-4xl">
          {section.title}
        </h2>
      ) : null}
      <div className="mt-8 space-y-3 sm:mt-10">
        {section.items.map((item, index) => {
          const isOpen = openIndex === index;
          const panelId = `${baseId}-panel-${index}`;
          const buttonId = `${baseId}-button-${index}`;

          return (
            <div
              key={`${item.question}-${index}`}
              className="overflow-hidden rounded-2xl border border-[var(--landing-muted)]/20 bg-[var(--landing-surface)]"
            >
              <button
                id={buttonId}
                type="button"
                className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left font-semibold focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--landing-primary)]"
                aria-expanded={isOpen}
                aria-controls={panelId}
                onClick={() => setOpenIndex(isOpen ? null : index)}
              >
                <span>{item.question}</span>
                <ChevronDown
                  size={18}
                  className={cn("shrink-0 transition-transform duration-200", isOpen && "rotate-180")}
                  aria-hidden
                />
              </button>
              <div
                id={panelId}
                role="region"
                aria-labelledby={buttonId}
                aria-hidden={!isOpen}
                hidden={!isOpen}
                className="border-t border-[var(--landing-muted)]/15 px-5 py-4 text-sm leading-7 text-[var(--landing-muted)]"
              >
                {item.answer}
              </div>
            </div>
          );
        })}
      </div>
    </LandingSectionShell>
  );
}
