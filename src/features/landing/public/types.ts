import type { PreviewLandingDTO, PublicLandingDTO } from "../types";

export type PublicSlugStatus = "not_found" | "inactive" | "unpublished" | "published";

export type PublicLandingResolution =
  | { status: "preview"; landing: PreviewLandingDTO }
  | { status: "published"; landing: PublicLandingDTO }
  | { status: "inactive"; slug: string }
  | { status: "unpublished"; slug: string }
  | { status: "not_found"; slug: string }
  | { status: "preview_invalid"; slug: string }
  | { status: "error"; slug: string; message: string };
