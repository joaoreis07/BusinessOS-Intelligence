import type { PreviewLandingDTO } from "../types";

type PreviewBannerProps = {
  landing: PreviewLandingDTO;
};

export function PreviewBanner({ landing }: PreviewBannerProps) {
  return (
    <aside
      role="status"
      aria-live="polite"
      className="border-b border-amber-300/40 bg-amber-50 px-4 py-3 text-center text-sm text-amber-950"
    >
      <strong>Modo preview</strong>
      {landing.isPublished ? " — rascunho visível" : " — página não publicada"}
      {" · "}
      Expira em {new Date(landing.previewExpiresAt).toLocaleString("pt-BR")}
    </aside>
  );
}
