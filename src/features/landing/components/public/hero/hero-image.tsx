import Image from "next/image";

type HeroImageProps = {
  imageUrl: string | null;
  alt: string;
};

const FALLBACK_IMAGE = "/landing/vitta-demo/hero.jpg";

export function HeroImage({ imageUrl, alt }: HeroImageProps) {
  const src = imageUrl ?? FALLBACK_IMAGE;
  const isRemote = Boolean(imageUrl?.startsWith("http"));

  return (
    <div className="relative mx-auto w-full max-w-[520px] reveal-up">
      <div className="absolute -left-4 top-8 hidden h-24 w-24 rounded-full bg-[var(--landing-accent)]/70 blur-2xl lg:block" />
      <div className="absolute -right-2 bottom-6 hidden h-28 w-28 rounded-full bg-[var(--landing-primary)]/10 blur-2xl lg:block" />
      <div className="relative aspect-[4/5] overflow-hidden rounded-[2rem] border border-white/70 bg-white shadow-[0_24px_60px_rgba(24,57,43,0.14)]">
        <Image
          src={src}
          alt={alt}
          fill
          priority
          unoptimized={isRemote}
          className="object-cover"
          sizes="(max-width: 1024px) 100vw, 520px"
        />
      </div>
    </div>
  );
}
