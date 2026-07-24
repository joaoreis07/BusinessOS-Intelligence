import type { Metadata } from "next";

export type SeoPageKind =
  | "landing"
  | "blog"
  | "blog-article"
  | "service"
  | "professional"
  | "booking"
  | "article"
  | "template";

export type SeoLocale = "pt_BR" | "en_US";

export type SeoOpenGraphType = "website" | "article";

export type SeoTwitterCard = "summary" | "summary_large_image";

export type RobotsDirective = Metadata["robots"];

export type SeoAddressInput = {
  street?: string | null;
  city?: string | null;
  state?: string | null;
  zip?: string | null;
  country?: string;
};

export type SeoContactInput = {
  email?: string | null;
  phone?: string | null;
  whatsapp?: string | null;
  address?: SeoAddressInput;
};

export type SeoSocialInput = {
  instagram?: string | null;
  facebook?: string | null;
  linkedin?: string | null;
  website?: string | null;
};

export type SeoFaqItemInput = {
  question: string;
  answer: string;
};

export type SeoBreadcrumbItemInput = {
  name: string;
  url: string;
};

export type SeoStructuredDataInput = {
  schemaType?: string;
  bookingHref?: string | null;
  faqItems?: SeoFaqItemInput[];
  breadcrumbs?: SeoBreadcrumbItemInput[];
};

export type SeoPageInput = {
  kind: SeoPageKind;
  tenant: {
    name: string;
    slug: string;
    customDomain?: string | null;
  };
  page: {
    path: string;
    canonicalUrl?: string | null;
    title: string;
    description?: string | null;
    keywords?: string | null;
    author?: string | null;
    publisher?: string | null;
    category?: string | null;
    locale?: SeoLocale;
  };
  indexing: {
    isPreview?: boolean;
    robotsIndex: boolean;
  };
  openGraph: {
    title?: string | null;
    description?: string | null;
    imageUrl?: string | null;
    type?: SeoOpenGraphType;
    siteName?: string | null;
  };
  twitter: {
    card?: SeoTwitterCard;
  };
  branding: {
    logoUrl?: string | null;
    bannerUrl?: string | null;
  };
  contacts?: SeoContactInput;
  social?: SeoSocialInput;
  structuredData?: SeoStructuredDataInput;
};

export type SeoContext = {
  input: SeoPageInput;
  kind: SeoPageKind;
  isPreview: boolean;
  isIndexable: boolean;
  siteUrl: string;
  pageUrl: string;
  canonicalUrl: string;
  title: string;
  description: string | undefined;
  keywords: string | undefined;
  author: string | undefined;
  publisher: string | undefined;
  category: string | undefined;
  locale: SeoLocale;
  structuredData: SeoStructuredDataInput;
  openGraph: {
    title: string;
    description: string | undefined;
    imageUrl: string | undefined;
    imageAlt: string;
    type: SeoOpenGraphType;
    url: string;
    siteName: string;
    locale: SeoLocale;
  };
  twitter: {
    card: SeoTwitterCard;
    title: string;
    description: string | undefined;
    imageUrl: string | undefined;
  };
  icons: {
    faviconUrl: string;
    appleTouchIconUrl: string | null;
    isCustom: boolean;
  };
  robots: RobotsDirective;
};

export type SocialPreviewConfig = {
  autoGenerateEnabled: boolean;
  templateKey: string | null;
  fallbackImageUrl: string | null;
  futureEndpoint: string | null;
};

export type SitemapSourceRow = {
  path: string;
  publishedAt: string | null;
  customDomain: string | null;
  canonicalUrl: string | null;
  robotsIndex: boolean;
  changeFrequency?: "always" | "hourly" | "daily" | "weekly" | "monthly" | "yearly" | "never";
  priority?: number;
};

export type SitemapEntry = {
  path: string;
  url: string;
  lastModified: Date;
  changeFrequency: NonNullable<SitemapSourceRow["changeFrequency"]>;
  priority: number;
};

export type JsonLdNode = Record<string, unknown>;

export type JsonLdGraph = {
  "@context": "https://schema.org";
  "@graph": JsonLdNode[];
};

export type JsonLdBuilder = (context: SeoContext) => JsonLdNode | null;
