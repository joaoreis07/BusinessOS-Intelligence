import type { PreviewLandingDTO, PublicLandingDTO } from "../types";
import { buildLandingJsonLdGraph } from "../seo/adapter";

type LandingJsonLdProps = {
  landing: PublicLandingDTO | PreviewLandingDTO;
};

export function LandingJsonLd({ landing }: LandingJsonLdProps) {
  if (landing.mode === "preview") return null;

  const payload = buildLandingJsonLdGraph(landing);
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(payload) }}
    />
  );
}
