import type { TestimonialsSectionDTO } from "../types";
import type { CrmIntegrationContext, TestimonialsFeedDTO } from "./types";

export function resolveTestimonialsFeed(
  section: TestimonialsSectionDTO,
  crm: CrmIntegrationContext,
): TestimonialsFeedDTO {
  const useCrmSource = crm.syncReviewsEnabled && crm.testimonialsSource === "crm";

  return {
    module: useCrmSource ? "crm" : "landing",
    sourceLabel: useCrmSource ? "Avaliações de clientes" : "Depoimentos",
    syncEnabled: crm.syncReviewsEnabled,
    items: section.items,
  };
}
