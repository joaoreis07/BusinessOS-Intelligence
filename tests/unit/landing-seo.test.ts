import { describe, expect, it } from "vitest";
import {
  buildLandingJsonLd,
  buildLandingJsonLdGraph,
  buildLandingMetadata,
  buildLandingRobots,
  buildLandingSeoContext,
  buildLandingSitemapEntries,
  buildPreviewRobots,
  buildPublishedRobots,
  buildUnavailableMetadata,
  getAppBaseUrl,
  resolveLandingPageUrl,
  resolveSiteUrl,
  resolveSocialPreview,
  toMetadataSitemap,
} from "@/features/landing/seo";
import { DEFAULT_FAVICON_PATH } from "@/features/seo/icons";
import { buildPreviewLanding, buildPublicLanding } from "./landing-fixtures";

describe("landing seo context", () => {
  it("builds independent seo context per company", () => {
    const landingA = buildPublicLanding({
      slug: "clinica-a",
      companyName: "Clínica A",
      seo: {
        ...buildPublicLanding().seo,
        canonicalUrl: "https://app.example.com/clinica-a",
      },
    });
    const landingB = buildPublicLanding({
      slug: "clinica-b",
      companyName: "Clínica B",
      seo: {
        ...buildPublicLanding().seo,
        canonicalUrl: "https://app.example.com/clinica-b",
      },
    });

    const contextA = buildLandingSeoContext(landingA);
    const contextB = buildLandingSeoContext(landingB);

    expect(contextA.canonicalUrl).not.toBe(contextB.canonicalUrl);
    expect(contextA.publisher).toBe("Clínica A");
    expect(contextB.publisher).toBe("Clínica B");
  });

  it("uses custom domain when configured", () => {
    const context = buildLandingSeoContext(
      buildPublicLanding({
        customDomain: "www.clinica.com.br",
        seo: {
          ...buildPublicLanding().seo,
          canonicalUrl: null,
        },
      }),
    );

    expect(context.siteUrl).toBe("https://www.clinica.com.br");
    expect(context.canonicalUrl).toBe("https://www.clinica.com.br/clinica-saude");
  });

  it("exposes author publisher and category metadata fields", () => {
    const context = buildLandingSeoContext(buildPublicLanding());

    expect(context.author).toBe("Dra. Ana");
    expect(context.publisher).toBe("Clínica Saúde");
    expect(context.category).toBe("Dermatologia");
  });
});

describe("landing seo metadata", () => {
  it("builds dynamic metadata for published landing", () => {
    const landing = buildPublicLanding();
    const metadata = buildLandingMetadata(landing);

    expect(metadata.title).toBe(landing.seo.title);
    expect(metadata.description).toBe(landing.seo.metaDescription);
    expect(metadata.keywords).toBeUndefined();
    expect(metadata.authors).toEqual([{ name: "Dra. Ana" }]);
    expect(metadata.publisher).toBe("Clínica Saúde");
    expect(metadata.category).toBe("Dermatologia");
    expect(metadata.robots).toEqual(buildPublishedRobots());
    expect(metadata.alternates?.canonical).toBe(landing.seo.canonicalUrl);
  });

  it("builds open graph metadata", () => {
    const landing = buildPublicLanding({
      seo: {
        ...buildPublicLanding().seo,
        ogTitle: "OG Clínica",
        ogDescription: "Agende com confiança",
        ogImageUrl: "https://cdn.example.com/og.png",
      },
    });
    const metadata = buildLandingMetadata(landing);
    const openGraph = metadata.openGraph as {
      title?: string;
      description?: string;
      type?: string;
      locale?: string;
      siteName?: string;
      images?: Array<{ url: string }>;
    };

    expect(openGraph.title).toBe("OG Clínica");
    expect(openGraph.description).toBe("Agende com confiança");
    expect(openGraph.type).toBe("website");
    expect(openGraph.locale).toBe("pt_BR");
    expect(openGraph.siteName).toBe("Clínica Saúde");
    expect(openGraph.images?.[0]?.url).toBe("https://cdn.example.com/og.png");
  });

  it("builds twitter card metadata", () => {
    const landing = buildPublicLanding({
      seo: {
        ...buildPublicLanding().seo,
        twitterCard: "summary_large_image",
        ogImageUrl: "https://cdn.example.com/og.png",
      },
    });
    const metadata = buildLandingMetadata(landing);
    const twitter = metadata.twitter as {
      card?: string;
      title?: string;
      images?: string[];
    };

    expect(twitter.card).toBe("summary_large_image");
    expect(twitter.title).toBe(landing.seo.title);
    expect(twitter.images).toEqual(["https://cdn.example.com/og.png"]);
  });

  it("uses custom logo as favicon when available", () => {
    const metadata = buildLandingMetadata(
      buildPublicLanding({
        branding: {
          ...buildPublicLanding().branding,
          logoUrl: "https://cdn.example.com/logo.png",
        },
      }),
    );
    const icons = metadata.icons as {
      icon?: Array<{ url: string }>;
      apple?: Array<{ url: string }>;
    };

    expect(icons.icon?.[0]?.url).toBe("https://cdn.example.com/logo.png");
    expect(icons.apple?.[0]?.url).toBe("https://cdn.example.com/logo.png");
  });

  it("falls back to default favicon without custom logo", () => {
    const metadata = buildLandingMetadata(buildPublicLanding());
    const icons = metadata.icons as {
      icon?: Array<{ url: string }>;
      apple?: Array<{ url: string }>;
    };
    expect(icons.icon?.[0]?.url).toBe(DEFAULT_FAVICON_PATH);
    expect(icons.apple).toBeUndefined();
  });

  it("disables indexing for preview mode", () => {
    const metadata = buildLandingMetadata(buildPreviewLanding());
    expect(metadata.robots).toEqual(buildPreviewRobots());
  });

  it("builds unavailable metadata without indexing", () => {
    const metadata = buildUnavailableMetadata("clinica-saude", "Empresa indisponível");
    expect(metadata.robots).toEqual({ index: false, follow: false });
    expect(metadata.title).toBe("Empresa indisponível");
  });
});

describe("landing seo robots", () => {
  it("indexes published landing when robotsIndex is true", () => {
    expect(
      buildLandingRobots({ isPreview: false, robotsIndex: true }),
    ).toEqual(buildPublishedRobots());
  });

  it("blocks preview and unpublished robots directives", () => {
    expect(buildLandingRobots({ isPreview: true, robotsIndex: true })).toEqual(
      buildPreviewRobots(),
    );
    expect(buildLandingRobots({ isPreview: false, robotsIndex: false })).toEqual(
      buildPreviewRobots(),
    );
  });
});

describe("landing seo json-ld", () => {
  it("builds graph with website organization local business and breadcrumb", () => {
    const graph = buildLandingJsonLdGraph(buildPublicLanding());
    const types = graph["@graph"].map((node) => node["@type"]);

    expect(graph["@context"]).toBe("https://schema.org");
    expect(types).toContain("WebSite");
    expect(types).toContain("Organization");
    expect(types).toContain("LocalBusiness");
    expect(types).toContain("BreadcrumbList");
  });

  it("adds faq page schema when faq section exists", () => {
    const graph = buildLandingJsonLdGraph(
      buildPublicLanding({
        sections: [
          ...buildPublicLanding().sections,
          {
            type: "faq",
            enabled: true,
            displayOrder: 50,
            title: "Perguntas",
            items: [{ question: "Como agendar?", answer: "Pelo site." }],
          },
        ],
      }),
    );

    expect(graph["@graph"].some((node) => node["@type"] === "FAQPage")).toBe(true);
  });

  it("keeps legacy local business json-ld export", () => {
    const jsonLd = buildLandingJsonLd(buildPublicLanding()) as Record<string, unknown>;
    const potentialAction = jsonLd.potentialAction as { target?: string } | undefined;
    expect(jsonLd["@type"]).toBe("LocalBusiness");
    expect(jsonLd.name).toBe("Clínica Saúde");
    expect(potentialAction?.target).toContain("/clinica-saude/agendar");
  });
});

describe("landing seo sitemap", () => {
  it("builds canonical sitemap entries per tenant", () => {
    const entries = buildLandingSitemapEntries(
      [
        {
          slug: "clinica-a",
          publishedAt: "2026-07-01T00:00:00.000Z",
          customDomain: null,
          canonicalUrl: null,
          robotsIndex: true,
        },
        {
          slug: "clinica-b",
          publishedAt: "2026-07-02T00:00:00.000Z",
          customDomain: "www.clinica-b.com",
          canonicalUrl: null,
          robotsIndex: true,
        },
      ],
      "https://app.example.com",
    );

    expect(entries).toHaveLength(2);
    expect(entries[0]?.url).toBe("https://app.example.com/clinica-a");
    expect(entries[1]?.url).toBe("https://www.clinica-b.com/clinica-b");
    expect(entries[0]?.lastModified.toISOString()).toBe("2026-07-01T00:00:00.000Z");
  });

  it("skips entries with robotsIndex disabled", () => {
    const entries = buildLandingSitemapEntries(
      [
        {
          slug: "hidden",
          publishedAt: null,
          customDomain: null,
          canonicalUrl: null,
          robotsIndex: false,
        },
      ],
      getAppBaseUrl(),
    );

    expect(entries).toHaveLength(0);
  });

  it("maps entries to next metadata sitemap format", () => {
    const sitemap = toMetadataSitemap(
      buildLandingSitemapEntries(
        [
          {
            slug: "clinica-a",
            publishedAt: "2026-07-01T00:00:00.000Z",
            customDomain: null,
            canonicalUrl: "https://app.example.com/clinica-a",
            robotsIndex: true,
          },
        ],
        "https://app.example.com",
      ),
    );

    expect(sitemap[0]).toMatchObject({
      url: "https://app.example.com/clinica-a",
      changeFrequency: "weekly",
      priority: 0.8,
    });
  });
});

describe("landing seo site url helpers", () => {
  it("resolves canonical page url with explicit canonical", () => {
    expect(
      resolveLandingPageUrl({
        path: "/clinica",
        siteUrl: "https://app.example.com",
        canonicalUrl: "https://custom.example.com/clinica",
      }),
    ).toBe("https://custom.example.com/clinica");
  });

  it("normalizes custom domain without protocol", () => {
    expect(resolveSiteUrl({ appBaseUrl: "https://app.example.com", customDomain: "www.clinica.com" })).toBe(
      "https://www.clinica.com",
    );
  });
});

describe("landing seo social preview", () => {
  it("structures future og image generation without enabling it", () => {
    const preview = resolveSocialPreview(buildLandingSeoContext(buildPublicLanding()));

    expect(preview.autoGenerateEnabled).toBe(false);
    expect(preview.templateKey).toBeNull();
    expect(preview.futureEndpoint).toBeNull();
    expect(preview.fallbackImageUrl).toBe(buildPublicLanding().branding.bannerUrl);
  });
});
