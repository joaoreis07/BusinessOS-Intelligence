import type { JsonLdBuilder, JsonLdGraph, JsonLdNode, SeoContext } from "../types";
import {
  buildArticleSchema,
  buildBreadcrumbListSchema,
  buildFaqPageSchema,
  buildLocalBusinessSchema,
  buildOrganizationSchema,
  buildWebSiteSchema,
} from "./schemas";

export const CORE_JSON_LD_BUILDERS: JsonLdBuilder[] = [
  buildWebSiteSchema,
  buildOrganizationSchema,
  buildBreadcrumbListSchema,
];

export const LOCAL_BUSINESS_JSON_LD_BUILDERS: JsonLdBuilder[] = [
  buildWebSiteSchema,
  buildOrganizationSchema,
  buildLocalBusinessSchema,
  buildBreadcrumbListSchema,
];

export const ARTICLE_JSON_LD_BUILDERS: JsonLdBuilder[] = [
  buildWebSiteSchema,
  buildOrganizationSchema,
  buildArticleSchema,
  buildBreadcrumbListSchema,
];

export function buildJsonLdGraph(
  context: SeoContext,
  builders: JsonLdBuilder[],
): JsonLdGraph {
  const nodes: JsonLdNode[] = [];

  for (const builder of builders) {
    const node = builder(context);
    if (node) nodes.push(node);
  }

  const faqNode = buildFaqPageSchema(context);
  if (faqNode) nodes.push(faqNode);

  return {
    "@context": "https://schema.org",
    "@graph": nodes,
  };
}

export function resolveJsonLdBuilders(kind: SeoContext["kind"]): JsonLdBuilder[] {
  switch (kind) {
    case "article":
    case "blog-article":
      return ARTICLE_JSON_LD_BUILDERS;
    case "landing":
    case "service":
    case "professional":
    case "booking":
      return LOCAL_BUSINESS_JSON_LD_BUILDERS;
    default:
      return CORE_JSON_LD_BUILDERS;
  }
}

export function buildPageJsonLdGraph(context: SeoContext): JsonLdGraph {
  return buildJsonLdGraph(context, resolveJsonLdBuilders(context.kind));
}

export function pickPrimaryJsonLdNode(graph: JsonLdGraph, preferredType?: string) {
  if (preferredType) {
    const preferred = graph["@graph"].find((node) => node["@type"] === preferredType);
    if (preferred) return preferred;
  }
  return graph["@graph"][0] ?? null;
}
