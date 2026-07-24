"use client";

import { useRef, useState, useTransition } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { uploadMediaAction } from "../actions";
import { EditorFeedback } from "./editor-feedback";
import type { EditorActionState } from "../types";

type MediaUploadFieldProps = {
  slug: string;
  label: string;
  kind: "logo" | "avatar" | "banner" | "gallery" | "testimonial";
  currentUrl?: string | null;
  onUploaded: (result: { objectPath: string; publicUrl: string; mediaAssetId: string }) => void;
};

const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif", "image/svg+xml"];

export function MediaUploadField({
  slug,
  label,
  kind,
  currentUrl,
  onUploaded,
}: MediaUploadFieldProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(currentUrl ?? null);
  const [state, setState] = useState<EditorActionState>({});
  const [isPending, startTransition] = useTransition();

  function handleFileChange(file: File | undefined) {
    if (!file) return;
    if (!ACCEPTED_TYPES.includes(file.type)) {
      setState({ error: "Formato não suportado. Use JPG, PNG, WebP, GIF ou SVG." });
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setState({ error: "Arquivo muito grande. Máximo 10 MB." });
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const base64 = String(reader.result ?? "").split(",")[1];
      if (!base64) {
        setState({ error: "Não foi possível ler o arquivo." });
        return;
      }
      setPreview(URL.createObjectURL(file));
      const formData = new FormData();
      formData.set("slug", slug);
      formData.set("kind", kind);
      formData.set("fileName", file.name);
      formData.set("mimeType", file.type);
      formData.set("byteSize", String(file.size));
      formData.set("fileBase64", base64);

      startTransition(async () => {
        const result = await uploadMediaAction({}, formData);
        setState(result);
        if (result.publicUrl && result.objectPath && result.mediaAssetId) {
          onUploaded({
            objectPath: result.objectPath,
            publicUrl: result.publicUrl,
            mediaAssetId: result.mediaAssetId,
          });
        }
      });
    };
    reader.readAsDataURL(file);
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-3">
        <Button
          type="button"
          variant="secondary"
          disabled={isPending}
          onClick={() => inputRef.current?.click()}
        >
          {isPending ? "Enviando..." : `Enviar ${label}`}
        </Button>
        <input
          ref={inputRef}
          type="file"
          accept={ACCEPTED_TYPES.join(",")}
          className="sr-only"
          aria-label={`Upload de ${label}`}
          onChange={(event) => handleFileChange(event.target.files?.[0])}
        />
      </div>
      {preview ? (
        <div className="relative h-28 w-full max-w-xs overflow-hidden rounded-xl border bg-[var(--surface-subtle)]">
          <Image src={preview} alt={`Preview de ${label}`} fill unoptimized className="object-cover" />
        </div>
      ) : (
        <p className="text-sm text-[var(--muted)]">Nenhuma imagem enviada.</p>
      )}
      <EditorFeedback state={state} />
    </div>
  );
}
