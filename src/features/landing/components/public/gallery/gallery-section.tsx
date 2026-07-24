import Image from "next/image";
import type { GallerySectionDTO } from "../../../types";
import type { SectionComponentProps } from "../../../registry/types";
import { LandingSectionShell } from "../../ui/landing-section-shell";

export type GallerySectionProps = SectionComponentProps<GallerySectionDTO>;

export function GallerySection({ section }: GallerySectionProps) {
  const items = section.items.filter((item) => item.enabled);
  if (!items.length) return null;

  return (
    <LandingSectionShell
      id="landing-gallery"
      ariaLabel="Galeria"
      dataSectionType="gallery"
      className="py-16 sm:py-20"
    >
      {section.title ? (
        <h2 className="font-serif text-3xl font-semibold sm:text-4xl">{section.title}</h2>
      ) : null}
      <div className="mt-8 grid grid-cols-2 gap-3 sm:mt-10 sm:gap-4 md:grid-cols-3 lg:grid-cols-4">
        {items.map((item) => (
          <figure
            key={item.id}
            className="group relative aspect-square overflow-hidden rounded-2xl bg-[var(--landing-surface-subtle)]"
          >
            <Image
              src={item.imageUrl}
              alt={item.altText ?? item.caption ?? "Imagem da galeria"}
              fill
              unoptimized
              className="object-cover transition-transform duration-300 group-hover:scale-105"
              sizes="(max-width: 768px) 50vw, 25vw"
            />
            {item.caption ? (
              <figcaption className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-3 text-xs text-white">
                {item.caption}
              </figcaption>
            ) : null}
          </figure>
        ))}
      </div>
    </LandingSectionShell>
  );
}
