import Image from "next/image";
import { Star } from "lucide-react";
import type { TestimonialsSectionDTO } from "../../../types";
import { resolveTestimonialsFeed } from "../../../integrations/crm";
import type { SectionComponentProps } from "../../../registry/types";
import { LandingCard } from "../../ui/landing-card";
import { LandingSectionShell } from "../../ui/landing-section-shell";

export type TestimonialsSectionProps = SectionComponentProps<TestimonialsSectionDTO>;

function RatingStars({ rating }: { rating: number | null }) {
  if (!rating) return null;
  return (
    <div className="mb-3 flex gap-0.5" aria-label={`Avaliação ${rating} de 5`}>
      {Array.from({ length: 5 }).map((_, index) => (
        <Star
          key={index}
          size={14}
          className={
            index < rating
              ? "fill-[var(--landing-primary)] text-[var(--landing-primary)]"
              : "text-[var(--landing-muted)]/40"
          }
          aria-hidden
        />
      ))}
    </div>
  );
}

export function TestimonialsSection({ section, context }: TestimonialsSectionProps) {
  const feed = resolveTestimonialsFeed(section, context.integrations.crm);
  if (!feed.items.length) return null;

  return (
    <LandingSectionShell
      id="landing-testimonials"
      ariaLabel="Depoimentos"
      dataSectionType="testimonials"
      className="py-16 sm:py-20"
      data-business-module="crm"
      data-testimonials-source={feed.module}
      data-testimonials-sync={feed.syncEnabled ? "true" : "false"}
    >
      {section.title ? (
        <h2 className="font-serif text-3xl font-semibold sm:text-4xl">
          {section.title ?? feed.sourceLabel}
        </h2>
      ) : null}
      <div className="mt-8 grid gap-4 sm:mt-10 md:grid-cols-2 lg:grid-cols-3">
        {feed.items.map((testimonial) => (
          <LandingCard key={testimonial.id}>
            <blockquote>
              <RatingStars rating={testimonial.rating} />
              <p className="leading-7 text-[var(--landing-muted)]">
                &ldquo;{testimonial.quote}&rdquo;
              </p>
              <footer className="mt-5 flex items-center gap-3">
                {testimonial.photoUrl ? (
                  <div className="relative h-10 w-10 overflow-hidden rounded-full">
                    <Image
                      src={testimonial.photoUrl}
                      alt=""
                      fill
                      unoptimized
                      className="object-cover"
                      sizes="40px"
                    />
                  </div>
                ) : null}
                <cite className="font-semibold not-italic">{testimonial.customerName}</cite>
              </footer>
            </blockquote>
          </LandingCard>
        ))}
      </div>
    </LandingSectionShell>
  );
}
