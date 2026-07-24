import type { PreviewLandingDTO, PublicLandingDTO } from "../types";
import { PublicLandingRenderer } from "../components/public-landing-renderer";
import { LandingJsonLd } from "./json-ld";

export type PublicLandingPageViewProps = {
  landing: PublicLandingDTO | PreviewLandingDTO;
};

export function PublicLandingPageView({ landing }: PublicLandingPageViewProps) {
  return (
    <>
      <LandingJsonLd landing={landing} />
      <PublicLandingRenderer landing={landing} />
    </>
  );
}
