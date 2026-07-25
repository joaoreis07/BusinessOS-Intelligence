"use client";

import { useActionState, useState } from "react";
import {
  completeOnboardingAction,
  type OnboardingActionState,
} from "@/app/(workspace)/onboarding/actions";
import { onboardingBusinessTypeOptions } from "@/features/onboarding/schemas";
import { slugifyCompanyName } from "@/lib/strings/slugify";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function OnboardingForm() {
  const [state, formAction, pending] = useActionState<OnboardingActionState, FormData>(
    completeOnboardingAction,
    {},
  );
  const [companyName, setCompanyName] = useState("");
  const [slug, setSlug] = useState("");
  const [slugTouched, setSlugTouched] = useState(false);

  return (
    <form action={formAction} className="space-y-4">
      <label className="block space-y-1.5 text-sm font-medium">
        <span>Nome da empresa</span>
        <Input
          name="companyName"
          autoComplete="organization"
          required
          value={companyName}
          onChange={(event) => {
            const nextName = event.target.value;
            setCompanyName(nextName);
            if (!slugTouched) {
              setSlug(slugifyCompanyName(nextName));
            }
          }}
        />
      </label>

      <label className="block space-y-1.5 text-sm font-medium">
        <span>Endereço da sua página</span>
        <div className="flex items-center overflow-hidden rounded-xl border bg-white">
          <span className="hidden shrink-0 border-r bg-[var(--surface-muted,#f4f4f5)] px-3 py-2.5 text-xs text-[var(--muted)] sm:inline">
            businessos.app/
          </span>
          <Input
            name="slug"
            autoComplete="off"
            required
            value={slug}
            onChange={(event) => {
              setSlugTouched(true);
              setSlug(slugifyCompanyName(event.target.value));
            }}
            className="border-0 shadow-none focus-visible:ring-0"
          />
        </div>
        <p className="text-xs font-normal text-[var(--muted)]">
          Você pode alterar isso depois nas configurações.
        </p>
      </label>

      <label className="block space-y-1.5 text-sm font-medium">
        <span>Segmento</span>
        <select
          name="businessType"
          required
          defaultValue=""
          className="h-11 w-full rounded-xl border bg-white px-3 text-sm"
        >
          <option value="" disabled>
            Selecione
          </option>
          {onboardingBusinessTypeOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </label>

      {state.error ? (
        <p role="alert" className="text-sm text-[var(--danger)]">
          {state.error}
        </p>
      ) : null}

      <Button type="submit" disabled={pending} className="h-11 w-full">
        {pending ? "Aguarde..." : "Começar"}
      </Button>
    </form>
  );
}
