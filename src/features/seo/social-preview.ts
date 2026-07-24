import type { SeoContext, SocialPreviewConfig } from "./types";

export function resolveSocialPreview(context: SeoContext): SocialPreviewConfig {
  return {
    autoGenerateEnabled: false,
    templateKey: null,
    fallbackImageUrl: context.openGraph.imageUrl ?? null,
    futureEndpoint: null,
  };
}
