"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { ExternalLink, Eye, Globe2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import type { EditorLandingDTO } from "../../types";
import {
  createPreviewAction,
  publishLandingAction,
  unpublishLandingAction,
} from "../actions";
import { EDITOR_TABS, findEditorSection, type EditorTabId } from "../types";
import { EditorFeedback } from "./editor-feedback";
import { EditorSectionCard } from "./editor-section-card";
import { MediaUploadField } from "./media-upload-field";
import {
  saveAboutDraftAction,
  saveBrandingDraftAction,
  saveCompanyProfileDraftAction,
  saveContactSectionAction,
  saveCtaDraftAction,
  saveFaqDraftAction,
  saveGallerySectionAction,
  saveHeroDraftAction,
  saveSeoDraftAction,
  saveServicesSectionAction,
  saveTestimonialsSectionAction,
  createTestimonialAction,
  deleteTestimonialAction,
  toggleTestimonialAction,
  createGalleryItemAction,
  deleteGalleryItemAction,
} from "../actions";

type LandingEditorProps = {
  data: EditorLandingDTO;
};

function HiddenSlug({ slug }: { slug: string }) {
  return <input type="hidden" name="slug" value={slug} />;
}

function EnabledField({ defaultChecked }: { defaultChecked: boolean }) {
  return (
    <label className="flex items-center gap-2 text-sm font-medium">
      <input type="checkbox" name="enabled" defaultChecked={defaultChecked} className="h-4 w-4 rounded border" />
      <span>Seção ativa na landing</span>
    </label>
  );
}

function FaqItemsEditor({ initialItems }: { initialItems: { question: string; answer: string }[] }) {
  const [items, setItems] = useState(initialItems);
  return (
    <div className="space-y-4">
      <input type="hidden" name="items" value={JSON.stringify(items)} />
      {items.map((item, index) => (
        <div key={index} className="grid gap-3 rounded-xl border p-4 md:grid-cols-2">
          <label className="space-y-1.5 text-sm font-medium md:col-span-2">
            <span>Pergunta {index + 1}</span>
            <Input
              value={item.question}
              onChange={(e) => {
                const next = [...items];
                next[index] = { ...next[index], question: e.target.value };
                setItems(next);
              }}
            />
          </label>
          <label className="space-y-1.5 text-sm font-medium md:col-span-2">
            <span>Resposta</span>
            <textarea
              value={item.answer}
              onChange={(e) => {
                const next = [...items];
                next[index] = { ...next[index], answer: e.target.value };
                setItems(next);
              }}
              className="min-h-24 w-full rounded-xl border bg-white p-3 text-sm"
            />
          </label>
          <Button
            type="button"
            variant="ghost"
            className="md:col-span-2 md:w-fit"
            onClick={() => setItems(items.filter((_, i) => i !== index))}
          >
            Remover pergunta
          </Button>
        </div>
      ))}
      <Button
        type="button"
        variant="secondary"
        onClick={() => setItems([...items, { question: "", answer: "" }])}
      >
        Adicionar pergunta
      </Button>
    </div>
  );
}

export function LandingEditor({ data }: LandingEditorProps) {
  const [activeTab, setActiveTab] = useState<EditorTabId>("hero");
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [logoPath, setLogoPath] = useState(data.branding.logoUrl);
  const [bannerPath, setBannerPath] = useState(data.branding.bannerUrl);
  const [avatarPath, setAvatarPath] = useState(data.branding.avatarUrl);

  const [previewState, previewAction, previewPending] = useActionState(createPreviewAction, {});
  const [publishState, publishAction, publishPending] = useActionState(publishLandingAction, {});
  const [unpublishState, unpublishAction, unpublishPending] = useActionState(unpublishLandingAction, {});

  const hero = findEditorSection(data, "hero");
  const about = findEditorSection(data, "about");
  const services = findEditorSection(data, "services");
  const gallery = findEditorSection(data, "gallery");
  const testimonials = findEditorSection(data, "testimonials");
  const faq = findEditorSection(data, "faq");
  const cta = findEditorSection(data, "booking");
  const contact = findEditorSection(data, "contact");

  const isSaving = previewPending || publishPending || unpublishPending;

  return (
    <div className="space-y-6" data-landing-editor data-editor-version="1">
      <header className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-3xl font-bold">Editor da Landing</h1>
            <Badge>{data.published ? "Publicada" : "Rascunho"}</Badge>
          </div>
          <p className="mt-2 max-w-2xl text-[var(--muted)]">
            Edite o rascunho, visualize com preview seguro e publique quando estiver pronto.
            Alterações salvas não afetam a página pública até você publicar.
          </p>
          {data.publishedAt ? (
            <p className="mt-1 text-xs text-[var(--muted)]">
              Última publicação: {new Date(data.publishedAt).toLocaleString("pt-BR")}
            </p>
          ) : null}
        </div>
        <div className="flex flex-wrap gap-2">
          <form
            action={previewAction}
            onSubmit={() => {
              setPreviewUrl(null);
            }}
          >
            <HiddenSlug slug={data.slug} />
            <input type="hidden" name="ttlMinutes" value="120" />
            <Button type="submit" variant="secondary" disabled={isSaving}>
              {previewPending ? <Loader2 className="animate-spin" size={16} /> : <Eye size={16} />}
              Gerar preview
            </Button>
          </form>
          {previewState.previewUrl || previewUrl ? (
            <a
              href={previewState.previewUrl ?? previewUrl ?? "#"}
              target="_blank"
              rel="noreferrer noopener"
              className="inline-flex h-10 items-center gap-2 rounded-xl border bg-white px-4 text-sm font-semibold"
              onClick={() => setPreviewUrl(previewState.previewUrl ?? previewUrl)}
            >
              Abrir preview <ExternalLink size={16} />
            </a>
          ) : null}
          {data.published ? (
            <form action={unpublishAction}>
              <HiddenSlug slug={data.slug} />
              <Button type="submit" variant="ghost" disabled={isSaving}>
                Despublicar
              </Button>
            </form>
          ) : null}
          <form action={publishAction}>
            <HiddenSlug slug={data.slug} />
            <Button type="submit" disabled={isSaving}>
              {publishPending ? "Publicando..." : "Publicar landing"}
            </Button>
          </form>
          <Link
            href={`/${data.slug}`}
            target="_blank"
            className="inline-flex h-10 items-center gap-2 rounded-xl border bg-white px-4 text-sm font-semibold"
          >
            Página pública <Globe2 size={16} />
          </Link>
        </div>
      </header>

      <EditorFeedback state={previewState} />
      <EditorFeedback state={publishState} />
      <EditorFeedback state={unpublishState} />

      <div className="grid gap-6 lg:grid-cols-[240px_1fr]">
        <nav aria-label="Seções do editor" className="space-y-1">
          {EDITOR_TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={[
                "flex w-full flex-col rounded-xl border px-4 py-3 text-left transition-colors",
                activeTab === tab.id
                  ? "border-[var(--primary)] bg-[var(--accent)]"
                  : "border-transparent bg-white hover:bg-[var(--surface-subtle)]",
              ].join(" ")}
              aria-current={activeTab === tab.id ? "page" : undefined}
            >
              <span className="text-sm font-semibold">{tab.label}</span>
              <span className="text-xs text-[var(--muted)]">{tab.description}</span>
            </button>
          ))}
        </nav>

        <div className="min-w-0 space-y-6">
          {activeTab === "hero" ? <HeroPanel data={data} hero={hero} bannerPath={bannerPath} setBannerPath={setBannerPath} /> : null}
          {activeTab === "about" ? <AboutPanel data={data} about={about} avatarPath={avatarPath} setAvatarPath={setAvatarPath} /> : null}
          {activeTab === "services" ? <ServicesPanel data={data} services={services} /> : null}
          {activeTab === "gallery" ? <GalleryPanel data={data} gallery={gallery} /> : null}
          {activeTab === "testimonials" ? <TestimonialsPanel data={data} section={testimonials} /> : null}
          {activeTab === "faq" ? <FaqPanel data={data} faq={faq} /> : null}
          {activeTab === "cta" ? <CtaPanel data={data} cta={cta} /> : null}
          {activeTab === "contact" ? <ContactPanel data={data} contact={contact} /> : null}
          {activeTab === "seo" ? <SeoPanel data={data} /> : null}
          {activeTab === "branding" ? (
            <BrandingPanel
              data={data}
              logoPath={logoPath}
              setLogoPath={setLogoPath}
              bannerPath={bannerPath}
              setBannerPath={setBannerPath}
              avatarPath={avatarPath}
              setAvatarPath={setAvatarPath}
            />
          ) : null}
        </div>
      </div>
    </div>
  );
}

function HeroPanel({
  data,
  hero,
  bannerPath,
  setBannerPath,
}: {
  data: EditorLandingDTO;
  hero: ReturnType<typeof findEditorSection<"hero">>;
  bannerPath: string | null;
  setBannerPath: (v: string | null) => void;
}) {
  const [state, action, pending] = useActionState(saveHeroDraftAction, {});
  return (
    <EditorSectionCard title="Hero" description="Primeira impressão da sua landing page.">
      <form action={action} className="space-y-4">
        <HiddenSlug slug={data.slug} />
        <EnabledField defaultChecked={hero?.enabled ?? true} />
        <label className="block space-y-1.5 text-sm font-medium">
          <span>Título</span>
          <Input name="title" defaultValue={hero?.title ?? ""} />
        </label>
        <label className="block space-y-1.5 text-sm font-medium">
          <span>Subtítulo</span>
          <textarea name="subtitle" defaultValue={hero?.subtitle ?? ""} className="min-h-24 w-full rounded-xl border bg-white p-3 text-sm" />
        </label>
        <label className="block space-y-1.5 text-sm font-medium">
          <span>Texto do botão</span>
          <Input name="ctaLabel" defaultValue={hero?.ctaLabel ?? "Agendar atendimento"} />
        </label>
        <MediaUploadField
          slug={data.slug}
          label="banner"
          kind="banner"
          currentUrl={bannerPath}
          onUploaded={(result) => {
            setBannerPath(result.publicUrl);
          }}
        />
        <input type="hidden" name="displayOrder" value={hero?.displayOrder ?? 10} />
        <EditorFeedback state={state} />
        <Button type="submit" disabled={pending}>{pending ? "Salvando..." : "Salvar rascunho"}</Button>
      </form>
    </EditorSectionCard>
  );
}

function AboutPanel({
  data,
  about,
  avatarPath,
  setAvatarPath,
}: {
  data: EditorLandingDTO;
  about: ReturnType<typeof findEditorSection<"about">>;
  avatarPath: string | null;
  setAvatarPath: (v: string | null) => void;
}) {
  const [state, action, pending] = useActionState(saveAboutDraftAction, {});
  return (
    <EditorSectionCard title="Sobre" description="Conte a história do seu negócio.">
      <form action={action} className="space-y-4">
        <HiddenSlug slug={data.slug} />
        <EnabledField defaultChecked={about?.enabled ?? true} />
        <label className="block space-y-1.5 text-sm font-medium">
          <span>Título</span>
          <Input name="title" defaultValue={about?.title ?? ""} />
        </label>
        <label className="block space-y-1.5 text-sm font-medium">
          <span>Texto</span>
          <textarea name="body" defaultValue={about?.body ?? ""} className="min-h-36 w-full rounded-xl border bg-white p-3 text-sm" />
        </label>
        <MediaUploadField slug={data.slug} label="foto" kind="avatar" currentUrl={avatarPath} onUploaded={(r) => setAvatarPath(r.publicUrl)} />
        <input type="hidden" name="displayOrder" value={about?.displayOrder ?? 20} />
        <EditorFeedback state={state} />
        <Button type="submit" disabled={pending}>{pending ? "Salvando..." : "Salvar rascunho"}</Button>
      </form>
    </EditorSectionCard>
  );
}

function ServicesPanel({
  data,
  services,
}: {
  data: EditorLandingDTO;
  services: ReturnType<typeof findEditorSection<"services">>;
}) {
  const [state, action, pending] = useActionState(saveServicesSectionAction, {});
  return (
    <EditorSectionCard title="Serviços" description="Configure a exibição dos serviços públicos.">
      <p className="text-sm text-[var(--muted)]">
        Os serviços são gerenciados em{" "}
        <Link href="/dashboard/servicos" className="font-semibold text-[var(--primary)]">
          Serviços
        </Link>
        . Aqui você define título e visibilidade da seção.
      </p>
      <form action={action} className="space-y-4">
        <HiddenSlug slug={data.slug} />
        <EnabledField defaultChecked={services?.enabled ?? true} />
        <label className="block space-y-1.5 text-sm font-medium">
          <span>Título da seção</span>
          <Input name="title" defaultValue={services?.title ?? "Serviços"} />
        </label>
        <input type="hidden" name="displayOrder" value={services?.displayOrder ?? 30} />
        <EditorFeedback state={state} />
        <Button type="submit" disabled={pending}>{pending ? "Salvando..." : "Salvar rascunho"}</Button>
      </form>
    </EditorSectionCard>
  );
}

function GalleryPanel({
  data,
  gallery,
}: {
  data: EditorLandingDTO;
  gallery: ReturnType<typeof findEditorSection<"gallery">>;
}) {
  const [sectionState, sectionAction, sectionPending] = useActionState(saveGallerySectionAction, {});
  const [uploadedAssetId, setUploadedAssetId] = useState<string | null>(null);
  const [itemState, itemAction, itemPending] = useActionState(createGalleryItemAction, {});

  return (
    <div className="space-y-6">
      <EditorSectionCard title="Galeria" description="Imagens exibidas na landing pública.">
        <form action={sectionAction} className="space-y-4">
          <HiddenSlug slug={data.slug} />
          <EnabledField defaultChecked={gallery?.enabled ?? false} />
          <label className="block space-y-1.5 text-sm font-medium">
            <span>Título</span>
            <Input name="title" defaultValue={gallery?.title ?? "Galeria"} />
          </label>
          <input type="hidden" name="displayOrder" value={gallery?.displayOrder ?? 38} />
          <EditorFeedback state={sectionState} />
          <Button type="submit" disabled={sectionPending}>{sectionPending ? "Salvando..." : "Salvar seção"}</Button>
        </form>
      </EditorSectionCard>

      <EditorSectionCard title="Adicionar imagem" description="Envie uma imagem e adicione à galeria.">
        <MediaUploadField
          slug={data.slug}
          label="imagem da galeria"
          kind="gallery"
          onUploaded={(result) => setUploadedAssetId(result.mediaAssetId)}
        />
        <form action={itemAction} className="mt-4 space-y-4">
          <HiddenSlug slug={data.slug} />
          <input type="hidden" name="mediaAssetId" value={uploadedAssetId ?? ""} />
          <label className="block space-y-1.5 text-sm font-medium">
            <span>Legenda</span>
            <Input name="caption" />
          </label>
          <label className="block space-y-1.5 text-sm font-medium">
            <span>Texto alternativo</span>
            <Input name="altText" />
          </label>
          <input type="hidden" name="enabled" value="true" />
          <EditorFeedback state={itemState} />
          <Button type="submit" disabled={itemPending || !uploadedAssetId}>
            {itemPending ? "Adicionando..." : "Adicionar à galeria"}
          </Button>
        </form>
      </EditorSectionCard>

      <EditorSectionCard title="Itens da galeria" description="Gerencie imagens já cadastradas.">
        {data.gallery.length === 0 ? (
          <p className="text-sm text-[var(--muted)]">Nenhuma imagem na galeria.</p>
        ) : (
          <ul className="space-y-3">
            {data.gallery.map((item) => (
              <GalleryItemRow key={item.id} slug={data.slug} item={item} />
            ))}
          </ul>
        )}
      </EditorSectionCard>
    </div>
  );
}

function GalleryItemRow({ slug, item }: { slug: string; item: EditorLandingDTO["gallery"][number] }) {
  const [state, action, pending] = useActionState(deleteGalleryItemAction, {});
  return (
    <li className="flex flex-wrap items-center justify-between gap-3 rounded-xl border p-3">
      <div>
        <p className="font-medium">{item.caption ?? item.altText ?? "Sem legenda"}</p>
        <p className="text-xs text-[var(--muted)]">{item.objectPath}</p>
      </div>
      <form action={action}>
        <HiddenSlug slug={slug} />
        <input type="hidden" name="id" value={item.id} />
        <Button type="submit" variant="ghost" disabled={pending}>Remover</Button>
      </form>
      <EditorFeedback state={state} />
    </li>
  );
}

function TestimonialsPanel({
  data,
  section,
}: {
  data: EditorLandingDTO;
  section: ReturnType<typeof findEditorSection<"testimonials">>;
}) {
  const [sectionState, sectionAction, sectionPending] = useActionState(saveTestimonialsSectionAction, {});
  const [createState, createAction, createPending] = useActionState(createTestimonialAction, {});

  return (
    <div className="space-y-6">
      <EditorSectionCard title="Depoimentos" description="Exiba avaliações de clientes na landing.">
        <form action={sectionAction} className="space-y-4">
          <HiddenSlug slug={data.slug} />
          <EnabledField defaultChecked={section?.enabled ?? true} />
          <label className="block space-y-1.5 text-sm font-medium">
            <span>Título</span>
            <Input name="title" defaultValue={section?.title ?? "Depoimentos"} />
          </label>
          <input type="hidden" name="displayOrder" value={section?.displayOrder ?? 40} />
          <EditorFeedback state={sectionState} />
          <Button type="submit" disabled={sectionPending}>{sectionPending ? "Salvando..." : "Salvar seção"}</Button>
        </form>
      </EditorSectionCard>

      <EditorSectionCard title="Novo depoimento" description="Adicione um depoimento ao rascunho.">
        <form action={createAction} className="grid gap-4 md:grid-cols-2">
          <HiddenSlug slug={data.slug} />
          <label className="space-y-1.5 text-sm font-medium">
            <span>Nome do cliente</span>
            <Input name="customerName" required />
          </label>
          <label className="space-y-1.5 text-sm font-medium">
            <span>Nota (1-5)</span>
            <Input name="rating" type="number" min="1" max="5" />
          </label>
          <label className="space-y-1.5 text-sm font-medium md:col-span-2">
            <span>Depoimento</span>
            <textarea name="quote" required className="min-h-24 w-full rounded-xl border bg-white p-3 text-sm" />
          </label>
          <label className="flex items-center gap-2 text-sm font-medium md:col-span-2">
            <input type="checkbox" name="published" />
            <span>Publicar depoimento na landing</span>
          </label>
          <div className="md:col-span-2">
            <EditorFeedback state={createState} />
            <Button type="submit" disabled={createPending}>{createPending ? "Salvando..." : "Adicionar depoimento"}</Button>
          </div>
        </form>
      </EditorSectionCard>

      <EditorSectionCard title="Depoimentos cadastrados" description="Gerencie depoimentos existentes.">
        {data.testimonials.length === 0 ? (
          <p className="text-sm text-[var(--muted)]">Nenhum depoimento cadastrado.</p>
        ) : (
          <ul className="space-y-3">
            {data.testimonials.map((item) => (
              <TestimonialRow key={item.id} slug={data.slug} item={item} />
            ))}
          </ul>
        )}
      </EditorSectionCard>
    </div>
  );
}

function TestimonialRow({ slug, item }: { slug: string; item: EditorLandingDTO["testimonials"][number] }) {
  const [deleteState, deleteAction, deletePending] = useActionState(deleteTestimonialAction, {});
  const [toggleState, toggleAction, togglePending] = useActionState(toggleTestimonialAction, {});

  return (
    <li className="rounded-xl border p-4">
      <p className="font-medium">{item.customerName}</p>
      <p className="mt-2 text-sm text-[var(--muted)]">&ldquo;{item.quote}&rdquo;</p>
      <div className="mt-3 flex flex-wrap gap-2">
        <form action={toggleAction}>
          <HiddenSlug slug={slug} />
          <input type="hidden" name="id" value={item.id} />
          <input type="hidden" name="published" value={item.published ? "false" : "true"} />
          <Button type="submit" variant="secondary" disabled={togglePending}>
            {item.published ? "Ocultar" : "Publicar"}
          </Button>
        </form>
        <form action={deleteAction}>
          <HiddenSlug slug={slug} />
          <input type="hidden" name="id" value={item.id} />
          <Button type="submit" variant="ghost" disabled={deletePending}>Excluir</Button>
        </form>
      </div>
      <EditorFeedback state={toggleState} />
      <EditorFeedback state={deleteState} />
    </li>
  );
}

function FaqPanel({
  data,
  faq,
}: {
  data: EditorLandingDTO;
  faq: ReturnType<typeof findEditorSection<"faq">>;
}) {
  const [state, action, pending] = useActionState(saveFaqDraftAction, {});
  return (
    <EditorSectionCard title="FAQ" description="Perguntas frequentes da sua landing.">
      <form action={action} className="space-y-4">
        <HiddenSlug slug={data.slug} />
        <EnabledField defaultChecked={faq?.enabled ?? false} />
        <label className="block space-y-1.5 text-sm font-medium">
          <span>Título</span>
          <Input name="title" defaultValue={faq?.title ?? "Perguntas frequentes"} />
        </label>
        <FaqItemsEditor initialItems={faq?.items ?? []} />
        <input type="hidden" name="displayOrder" value={faq?.displayOrder ?? 45} />
        <EditorFeedback state={state} />
        <Button type="submit" disabled={pending}>{pending ? "Salvando..." : "Salvar rascunho"}</Button>
      </form>
    </EditorSectionCard>
  );
}

function CtaPanel({
  data,
  cta,
}: {
  data: EditorLandingDTO;
  cta: ReturnType<typeof findEditorSection<"booking">>;
}) {
  const [state, action, pending] = useActionState(saveCtaDraftAction, {});
  return (
    <EditorSectionCard title="CTA" description="Chamada para agendamento.">
      <form action={action} className="space-y-4">
        <HiddenSlug slug={data.slug} />
        <EnabledField defaultChecked={cta?.enabled ?? true} />
        <label className="block space-y-1.5 text-sm font-medium">
          <span>Título</span>
          <Input name="title" defaultValue={cta?.title ?? ""} />
        </label>
        <label className="block space-y-1.5 text-sm font-medium">
          <span>Subtítulo</span>
          <textarea name="subtitle" defaultValue={cta?.subtitle ?? ""} className="min-h-20 w-full rounded-xl border bg-white p-3 text-sm" />
        </label>
        <label className="block space-y-1.5 text-sm font-medium">
          <span>Texto do botão</span>
          <Input name="buttonLabel" defaultValue={cta?.buttonLabel ?? "Ver horários disponíveis"} />
        </label>
        <input type="hidden" name="displayOrder" value={cta?.displayOrder ?? 50} />
        <EditorFeedback state={state} />
        <Button type="submit" disabled={pending}>{pending ? "Salvando..." : "Salvar rascunho"}</Button>
      </form>
    </EditorSectionCard>
  );
}

function ContactPanel({
  data,
  contact,
}: {
  data: EditorLandingDTO;
  contact: ReturnType<typeof findEditorSection<"contact">>;
}) {
  const [state, action, pending] = useActionState(saveContactSectionAction, {});
  return (
    <EditorSectionCard title="Contato" description="Configuração da seção de contato. Dados em Branding.">
      <form action={action} className="space-y-4">
        <HiddenSlug slug={data.slug} />
        <EnabledField defaultChecked={contact?.enabled ?? true} />
        <label className="block space-y-1.5 text-sm font-medium">
          <span>Título</span>
          <Input name="title" defaultValue={contact?.title ?? "Contato"} />
        </label>
        <input type="hidden" name="displayOrder" value={contact?.displayOrder ?? 55} />
        <EditorFeedback state={state} />
        <Button type="submit" disabled={pending}>{pending ? "Salvando..." : "Salvar rascunho"}</Button>
      </form>
    </EditorSectionCard>
  );
}

function SeoPanel({ data }: { data: EditorLandingDTO }) {
  const [state, action, pending] = useActionState(saveSeoDraftAction, {});
  return (
    <EditorSectionCard title="SEO" description="Metadados para buscadores e redes sociais.">
      <form action={action} className="grid gap-4 md:grid-cols-2">
        <HiddenSlug slug={data.slug} />
        <label className="space-y-1.5 text-sm font-medium md:col-span-2">
          <span>Título SEO</span>
          <Input name="title" defaultValue={data.seo.title} required />
        </label>
        <label className="space-y-1.5 text-sm font-medium md:col-span-2">
          <span>Descrição</span>
          <textarea name="metaDescription" defaultValue={data.seo.metaDescription ?? ""} className="min-h-20 w-full rounded-xl border bg-white p-3 text-sm" />
        </label>
        <label className="space-y-1.5 text-sm font-medium md:col-span-2">
          <span>Palavras-chave</span>
          <Input name="keywords" defaultValue={data.seo.keywords ?? ""} placeholder="clínica, dermatologia, agendamento" />
        </label>
        <label className="space-y-1.5 text-sm font-medium md:col-span-2">
          <span>URL canônica</span>
          <Input name="canonicalUrl" type="url" defaultValue={data.seo.canonicalUrl ?? ""} />
        </label>
        <label className="space-y-1.5 text-sm font-medium">
          <span>OG Título</span>
          <Input name="ogTitle" defaultValue={data.seo.ogTitle ?? ""} />
        </label>
        <label className="space-y-1.5 text-sm font-medium">
          <span>OG Imagem (path)</span>
          <Input name="ogImagePath" defaultValue="" placeholder="c1/banner/..." />
        </label>
        <label className="space-y-1.5 text-sm font-medium md:col-span-2">
          <span>OG Descrição</span>
          <textarea name="ogDescription" defaultValue={data.seo.ogDescription ?? ""} className="min-h-20 w-full rounded-xl border bg-white p-3 text-sm" />
        </label>
        <label className="space-y-1.5 text-sm font-medium">
          <span>Twitter Card</span>
          <select name="twitterCard" defaultValue={data.seo.twitterCard} className="h-11 w-full rounded-xl border bg-white px-3 text-sm">
            <option value="summary_large_image">Summary large image</option>
            <option value="summary">Summary</option>
          </select>
        </label>
        <label className="flex items-center gap-2 text-sm font-medium">
          <input type="checkbox" name="robotsIndex" defaultChecked={data.seo.robotsIndex} />
          <span>Permitir indexação após publicar</span>
        </label>
        <div className="md:col-span-2">
          <EditorFeedback state={state} />
          <Button type="submit" disabled={pending}>{pending ? "Salvando..." : "Salvar rascunho"}</Button>
        </div>
      </form>
    </EditorSectionCard>
  );
}

function BrandingPanel({
  data,
  logoPath,
  setLogoPath,
  bannerPath,
  setBannerPath,
  avatarPath,
  setAvatarPath,
}: {
  data: EditorLandingDTO;
  logoPath: string | null;
  setLogoPath: (v: string | null) => void;
  bannerPath: string | null;
  setBannerPath: (v: string | null) => void;
  avatarPath: string | null;
  setAvatarPath: (v: string | null) => void;
}) {
  const [brandingState, brandingAction, brandingPending] = useActionState(saveBrandingDraftAction, {});
  const [profileState, profileAction, profilePending] = useActionState(saveCompanyProfileDraftAction, {});
  const [storedLogoPath, setStoredLogoPath] = useState(data.mediaPaths.logoPath ?? "");
  const [storedBannerPath, setStoredBannerPath] = useState(data.mediaPaths.bannerPath ?? "");
  const [storedAvatarPath, setStoredAvatarPath] = useState(data.mediaPaths.avatarPath ?? "");

  return (
    <div className="space-y-6">
      <EditorSectionCard title="Identidade visual" description="Cores, logo e imagens da marca.">
        <form action={brandingAction} className="grid gap-4 md:grid-cols-2">
          <HiddenSlug slug={data.slug} />
          <label className="space-y-1.5 text-sm font-medium">
            <span>Cor primária</span>
            <Input name="primaryColor" type="color" defaultValue={data.branding.primaryColor} />
          </label>
          <label className="space-y-1.5 text-sm font-medium">
            <span>Cor secundária</span>
            <Input name="secondaryColor" type="color" defaultValue={data.branding.secondaryColor} />
          </label>
          <label className="space-y-1.5 text-sm font-medium">
            <span>Cor de destaque</span>
            <Input name="accentColor" type="color" defaultValue={data.branding.accentColor} />
          </label>
          <label className="space-y-1.5 text-sm font-medium">
            <span>Cor de fundo</span>
            <Input name="backgroundColor" type="color" defaultValue={data.branding.backgroundColor} />
          </label>
          <label className="space-y-1.5 text-sm font-medium md:col-span-2">
            <span>Tema (preparado para futuro)</span>
            <select name="theme" defaultValue={data.branding.theme} className="h-11 w-full rounded-xl border bg-white px-3 text-sm">
              <option value="light">Claro</option>
              <option value="dark">Escuro</option>
              <option value="system">Sistema</option>
            </select>
          </label>
          <div className="md:col-span-2">
            <MediaUploadField slug={data.slug} label="logo" kind="logo" currentUrl={logoPath} onUploaded={(r) => { setLogoPath(r.publicUrl); setStoredLogoPath(r.objectPath); }} />
            <input type="hidden" name="logoPath" value={storedLogoPath} />
          </div>
          <div className="md:col-span-2">
            <MediaUploadField slug={data.slug} label="banner" kind="banner" currentUrl={bannerPath} onUploaded={(r) => { setBannerPath(r.publicUrl); setStoredBannerPath(r.objectPath); }} />
            <input type="hidden" name="bannerPath" value={storedBannerPath} />
          </div>
          <div className="md:col-span-2">
            <MediaUploadField slug={data.slug} label="avatar" kind="avatar" currentUrl={avatarPath} onUploaded={(r) => { setAvatarPath(r.publicUrl); setStoredAvatarPath(r.objectPath); }} />
            <input type="hidden" name="avatarPath" value={storedAvatarPath} />
          </div>
          <div className="md:col-span-2">
            <EditorFeedback state={brandingState} />
            <Button type="submit" disabled={brandingPending}>{brandingPending ? "Salvando..." : "Salvar branding"}</Button>
          </div>
        </form>
      </EditorSectionCard>

      <EditorSectionCard title="Empresa e contato" description="Nome, slogan, contatos, endereço e horários.">
        <form action={profileAction} className="grid gap-4 md:grid-cols-2">
          <HiddenSlug slug={data.slug} />
          <label className="space-y-1.5 text-sm font-medium">
            <span>Nome da empresa</span>
            <Input name="name" defaultValue={data.companyName} required />
          </label>
          <label className="space-y-1.5 text-sm font-medium">
            <span>Nome profissional</span>
            <Input name="professionalName" defaultValue={data.professionalName ?? ""} />
          </label>
          <label className="space-y-1.5 text-sm font-medium">
            <span>Especialidade</span>
            <Input name="specialty" defaultValue={data.specialty ?? ""} />
          </label>
          <label className="space-y-1.5 text-sm font-medium">
            <span>Slogan</span>
            <Input name="tagline" defaultValue={data.description ?? ""} />
          </label>
          <label className="space-y-1.5 text-sm font-medium">
            <span>E-mail</span>
            <Input name="email" type="email" defaultValue={data.contacts.email ?? ""} />
          </label>
          <label className="space-y-1.5 text-sm font-medium">
            <span>Telefone</span>
            <Input name="phone" defaultValue={data.contacts.phone ?? ""} />
          </label>
          <label className="space-y-1.5 text-sm font-medium">
            <span>WhatsApp</span>
            <Input name="whatsapp" defaultValue={data.contacts.whatsapp ?? ""} />
          </label>
          <label className="space-y-1.5 text-sm font-medium">
            <span>Horário de atendimento</span>
            <Input name="businessHours" placeholder="Seg-Sex 9h-18h" />
          </label>
          <label className="space-y-1.5 text-sm font-medium md:col-span-2">
            <span>Endereço</span>
            <Input name="street" defaultValue={data.contacts.address.street ?? ""} />
          </label>
          <label className="space-y-1.5 text-sm font-medium">
            <span>Cidade</span>
            <Input name="city" defaultValue={data.contacts.address.city ?? ""} />
          </label>
          <label className="space-y-1.5 text-sm font-medium">
            <span>Estado</span>
            <Input name="state" maxLength={2} defaultValue={data.contacts.address.state ?? ""} />
          </label>
          <label className="space-y-1.5 text-sm font-medium">
            <span>CEP</span>
            <Input name="zip" defaultValue={data.contacts.address.zip ?? ""} />
          </label>
          <label className="space-y-1.5 text-sm font-medium">
            <span>Instagram</span>
            <Input name="instagram" type="url" defaultValue={data.social.instagram ?? ""} />
          </label>
          <label className="space-y-1.5 text-sm font-medium">
            <span>Facebook</span>
            <Input name="facebook" type="url" defaultValue={data.social.facebook ?? ""} />
          </label>
          <label className="space-y-1.5 text-sm font-medium">
            <span>LinkedIn</span>
            <Input name="linkedin" type="url" defaultValue={data.social.linkedin ?? ""} />
          </label>
          <label className="space-y-1.5 text-sm font-medium">
            <span>Website</span>
            <Input name="website" type="url" defaultValue={data.social.website ?? ""} />
          </label>
          <div className="md:col-span-2">
            <EditorFeedback state={profileState} />
            <Button type="submit" disabled={profilePending}>{profilePending ? "Salvando..." : "Salvar perfil"}</Button>
          </div>
        </form>
      </EditorSectionCard>
    </div>
  );
}
