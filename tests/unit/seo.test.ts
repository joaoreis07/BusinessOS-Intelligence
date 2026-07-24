import { describe, expect, it } from "vitest";
import {
  buildPageJsonLdGraph,
  buildPageMetadata,
  buildRobotsDirective,
  buildSeoContext,
  buildSitemapEntries,
  mergeSitemapEntries,
  resolvePageUrl,
  resolveSiteUrl,
  resolveSocialPreview,
  toMetadataSitemap,
  type SeoPageInput,
} from "@/features/seo";
import { DEFAULT_FAVICON_PATH } from "@/features/seo/icons";

function buildBaseSeoInput(overrides: Partial<SeoPageInput> = {}): SeoPageInput {
  return {
    kind: "service",
    tenant: {
      name: "Clínica Saúde",
      slug: "clinica-saude",
      customDomain: null,
    },
    page: {
      path: "/clinica-saude/servicos/consulta",
      canonicalUrl: null,
      title: "Consulta Dermatológica",
      description: "Avaliação completa da pele",
      keywords: "dermatologia, consulta",
      author: "Dra. Ana",
      publisher: "Clínica Saúde",
      category: "Dermatologia",
      locale: "pt_BR",
    },
    indexing: {
      isPreview: false,
      robotsIndex: true,
    },
    openGraph: {
      title: "Consulta Dermatológica",
      description: "Avaliação completa da pele",
      imageUrl: "https://cdn.example.com/service.png",
      type: "website",
      siteName: "Clínica Saúde",
    },
    twitter: {
      card: "summary_large_image",
    },
    branding: {
      logoUrl: null,
      bannerUrl: null,
    },
    contacts: {
      email: "contato@clinica.com",
      phone: "+5511999999999",
      address: {
        street: "Rua A",
        city: "São Paulo",
        state: "SP",
        zip: "01000-000",
        country: "BR",
      },
    },
    structuredData: {
      schemaType: "MedicalBusiness",
      bookingHref: "/clinica-saude/agendar?service=consulta",
      breadcrumbs: [
        { name: "Clínica Saúde", url: "https://app.example.com/clinica-saude" },
        { name: "Serviços", url: "https://app.example.com/clinica-saude/servicos" },
        { name: "Consulta", url: "https://app.example.com/clinica-saude/servicos/consulta" },
      ],
    },
    ...overrides,
  };
}

describe("generic seo context", () => {
  it("supports multiple page kinds without landing coupling", () => {
    const kinds = ["blog", "blog-article", "service", "professional", "booking", "article", "template"] as const;

    for (const kind of kinds) {
      const context = buildSeoContext(buildBaseSeoInput({ kind }));
      expect(context.kind).toBe(kind);
      expect(context.title).toBe("Consulta Dermatológica");
    }
  });

  it("builds independent metadata per tenant", () => {
    const contextA = buildSeoContext(
      buildBaseSeoInput({
        tenant: { name: "Clínica A", slug: "clinica-a", customDomain: null },
        page: {
          ...buildBaseSeoInput().page,
          path: "/clinica-a",
          canonicalUrl: "https://app.example.com/clinica-a",
        },
      }),
    );
    const contextB = buildSeoContext(
      buildBaseSeoInput({
        tenant: { name: "Clínica B", slug: "clinica-b", customDomain: null },
        page: {
          ...buildBaseSeoInput().page,
          path: "/clinica-b",
          canonicalUrl: "https://app.example.com/clinica-b",
        },
      }),
    );

    expect(contextA.canonicalUrl).not.toBe(contextB.canonicalUrl);
    expect(contextA.publisher).toBe("Clínica Saúde");
  });
});

describe("generic seo metadata", () => {
  it("builds page metadata from seo context", () => {
    const metadata = buildPageMetadata(buildSeoContext(buildBaseSeoInput()));
    const openGraph = metadata.openGraph as { title?: string; type?: string };
    const twitter = metadata.twitter as { card?: string };

    expect(metadata.title).toBe("Consulta Dermatológica");
    expect(metadata.publisher).toBe("Clínica Saúde");
    expect(openGraph.title).toBe("Consulta Dermatológica");
    expect(openGraph.type).toBe("website");
    expect(twitter.card).toBe("summary_large_image");
    expect(metadata.robots).toEqual(buildRobotsDirective({ robotsIndex: true }));
  });

  it("uses default favicon when no custom logo exists", () => {
    const metadata = buildPageMetadata(buildSeoContext(buildBaseSeoInput()));
    const icons = metadata.icons as { icon?: Array<{ url: string }> };
    expect(icons.icon?.[0]?.url).toBe(DEFAULT_FAVICON_PATH);
  });
});

describe("generic seo json-ld", () => {
  it("resolves builders by page kind", () => {
    const serviceGraph = buildPageJsonLdGraph(buildSeoContext(buildBaseSeoInput({ kind: "service" })));
    const articleGraph = buildPageJsonLdGraph(
      buildSeoContext(buildBaseSeoInput({ kind: "blog-article" })),
    );

    expect(serviceGraph["@graph"].some((node) => node["@type"] === "MedicalBusiness")).toBe(true);
    expect(articleGraph["@graph"].some((node) => node["@type"] === "Article")).toBe(true);
  });

  it("uses custom breadcrumbs when provided", () => {
    const graph = buildPageJsonLdGraph(buildSeoContext(buildBaseSeoInput()));
    const breadcrumb = graph["@graph"].find((node) => node["@type"] === "BreadcrumbList");
    const items = breadcrumb?.itemListElement as Array<{ position: number; name: string }>;

    expect(items).toHaveLength(3);
    expect(items[2]?.name).toBe("Consulta");
  });
});

describe("generic seo sitemap", () => {
  it("builds sitemap entries for arbitrary public paths", () => {
    const entries = buildSitemapEntries(
      [
        {
          path: "/clinica-a/blog/post-1",
          publishedAt: "2026-07-01T00:00:00.000Z",
          customDomain: null,
          canonicalUrl: null,
          robotsIndex: true,
        },
        {
          path: "/clinica-b/profissionais/dra-ana",
          publishedAt: "2026-07-02T00:00:00.000Z",
          customDomain: "www.clinica-b.com",
          canonicalUrl: null,
          robotsIndex: true,
        },
      ],
      "https://app.example.com",
    );

    expect(entries[0]?.url).toBe("https://app.example.com/clinica-a/blog/post-1");
    expect(entries[1]?.url).toBe("https://www.clinica-b.com/clinica-b/profissionais/dra-ana");
  });

  it("merges sitemap groups without duplicate urls", () => {
    const merged = mergeSitemapEntries([
      buildSitemapEntries(
        [
          {
            path: "/clinica-a",
            publishedAt: null,
            customDomain: null,
            canonicalUrl: "https://app.example.com/clinica-a",
            robotsIndex: true,
          },
        ],
        "https://app.example.com",
      ),
      buildSitemapEntries(
        [
          {
            path: "/clinica-a",
            publishedAt: null,
            customDomain: null,
            canonicalUrl: "https://app.example.com/clinica-a",
            robotsIndex: true,
          },
        ],
        "https://app.example.com",
      ),
    ]);

    expect(merged).toHaveLength(1);
    expect(toMetadataSitemap(merged)[0]?.url).toBe("https://app.example.com/clinica-a");
  });
});

describe("generic seo site url helpers", () => {
  it("resolves page url from path and site url", () => {
    expect(
      resolvePageUrl({
        path: "/clinica-saude/blog",
        siteUrl: "https://app.example.com",
        canonicalUrl: null,
      }),
    ).toBe("https://app.example.com/clinica-saude/blog");
  });

  it("normalizes custom domain without protocol", () => {
    expect(
      resolveSiteUrl({ appBaseUrl: "https://app.example.com", customDomain: "www.clinica.com" }),
    ).toBe("https://www.clinica.com");
  });
});

describe("generic seo social preview", () => {
  it("structures future og generation without enabling it", () => {
    const preview = resolveSocialPreview(buildSeoContext(buildBaseSeoInput()));
    expect(preview.autoGenerateEnabled).toBe(false);
    expect(preview.futureEndpoint).toBeNull();
  });
});
