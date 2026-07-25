import Image from "next/image";
import { Quote, Star } from "lucide-react";
import type { TestimonialsSectionDTO } from "../../../types";
import { resolveTestimonialsFeed } from "../../../integrations/crm";
import type { SectionComponentProps } from "../../../registry/types";
import { LandingBadge } from "../../ui/landing-badge";
import { LandingSectionShell } from "../../ui/landing-section-shell";

export type TestimonialsSectionProps = SectionComponentProps<TestimonialsSectionDTO>;

function RatingStars({ rating }: { rating: number | null }) {
  if (!rating) return null;
  return (
    <div className="flex gap-0.5" aria-label={`Avaliação ${rating} de 5`}>
      {Array.from({ length: 5 }).map((_, index) => (
        <Star
          key={index}
          size={16}
          className={
            index < rating
              ? "fill-[var(--landing-primary)] text-[var(--landing-primary)]"
              : "text-[var(--landing-muted)]/30"
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

  const [featured, ...others] = feed.items;

  return (
    <LandingSectionShell
      id="landing-testimonials"
      ariaLabel="Depoimentos"
      dataSectionType="testimonials"
      className="bg-[var(--landing-surface-subtle)] py-16 sm:py-24"
      data-business-module="crm"
      data-testimonials-source={feed.module}
      data-testimonials-sync={feed.syncEnabled ? "true" : "false"}
    >
      <div className="mx-auto max-w-3xl text-center">
        <LandingBadge>Depoimentos</LandingBadge>
        {section.title ? (
          <h2 className="mt-4 font-serif text-3xl font-semibold sm:text-4xl lg:text-5xl">
            {section.title}
          </h2>
        ) : null}
      </div>

      {featured ? (
        <figure className="relative mx-auto mt-10 max-w-4xl overflow-hidden rounded-[2rem] border border-[var(--landing-primary)]/10 bg-white p-8 shadow-[0_20px_50px_rgba(24,57,43,0.08)] sm:p-10">
          <Quote
            size={42}
            className="absolute right-6 top-6 text-[var(--landing-accent)]"
            aria-hidden
          />
          <RatingStars rating={featured.rating} />
          <blockquote className="mt-5 font-serif text-2xl leading-10 text-[var(--landing-foreground)] sm:text-3xl">
            &ldquo;{featured.quote}&rdquo;
          </blockquote>
          <figcaption className="mt-8 flex items-center gap-4">
            {featured.photoUrl ? (
              <div className="relative h-14 w-14 overflow-hidden rounded-full">
                <Image
                  src={featured.photoUrl}
                  alt=""
                  fill
                  unoptimized
                  className="object-cover"
                  sizes="56px"
                />
              </div>
            ) : (
              <span className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-[var(--landing-accent)] font-semibold text-[var(--landing-primary)]">
                {featured.customerName.charAt(0)}
              </span>
            )}
            <div>
              <cite className="font-semibold not-italic text-[var(--landing-foreground)]">
                {featured.customerName}
              </cite>
              <p className="text-sm text-[var(--landing-muted)]">Paciente</p>
            </div>
          </figcaption>
        </figure>
      ) : null}

      {others.length ? (
        <div className="mt-6 grid gap-4 md:grid-cols-2">
          {others.map((testimonial) => (
            <figure
              key={testimonial.id}
              className="rounded-2xl border border-[var(--landing-primary)]/10 bg-white/90 p-6"
            >
              <RatingStars rating={testimonial.rating} />
              <blockquote className="mt-4 text-sm leading-7 text-[var(--landing-muted)] sm:text-base">
                &ldquo;{testimonial.quote}&rdquo;
              </blockquote>
              <figcaption className="mt-4 font-semibold text-[var(--landing-foreground)]">
                {testimonial.customerName}
              </figcaption>
            </figure>
          ))}
        </div>
      ) : null}
    </LandingSectionShell>
  );
}
