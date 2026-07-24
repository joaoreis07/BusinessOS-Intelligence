import Image from "next/image";

type HeroImageProps = {
  imageUrl: string | null;
  alt: string;
};

const FALLBACK_IMAGE = "/images/hero.jpg";

export function HeroImage({ imageUrl, alt }: HeroImageProps) {
  const src = imageUrl ?? FALLBACK_IMAGE;
  const isRemote = Boolean(imageUrl);

  return (
    <div className="relative aspect-[4/5] w-full overflow-hidden rounded-3xl bg-white/5 reveal-up">
      <Image
        src={src}
        alt={alt}
        fill
        priority
        unoptimized={isRemote}
        className="object-cover"
        sizes="(max-width: 1024px) 100vw, 50vw"
      />
    </div>
  );
}
