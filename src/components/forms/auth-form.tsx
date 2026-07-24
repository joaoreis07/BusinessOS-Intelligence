"use client";

import { useActionState } from "react";
import type { AuthActionState } from "@/app/(auth)/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type AuthAction = (
  state: AuthActionState,
  formData: FormData,
) => Promise<AuthActionState>;

type InputField = {
  kind?: "input";
  name: string;
  label: string;
  type?: string;
  autoComplete?: string;
};

type SelectField = {
  kind: "select";
  name: string;
  label: string;
  options: Array<{ value: string; label: string }>;
};

type CheckboxField = {
  kind: "checkbox";
  name: string;
  label: string;
};

type Field = InputField | SelectField | CheckboxField;

export function AuthForm({
  action,
  fields,
  submitLabel,
  hidden,
}: {
  action: AuthAction;
  fields: Field[];
  submitLabel: string;
  hidden?: Record<string, string>;
}) {
  const [state, formAction, pending] = useActionState(action, {});

  return (
    <form action={formAction} className="space-y-4">
      {Object.entries(hidden ?? {}).map(([name, value]) => (
        <input key={name} type="hidden" name={name} value={value} />
      ))}
      {fields.map((field) => {
        if (field.kind === "checkbox") {
          return (
            <label key={field.name} className="flex items-start gap-3 text-sm">
              <input
                name={field.name}
                type="checkbox"
                value="true"
                required
                className="mt-0.5 size-4 rounded border"
              />
              <span>{field.label}</span>
            </label>
          );
        }

        if (field.kind === "select") {
          return (
            <label key={field.name} className="block space-y-1.5 text-sm font-medium">
              <span>{field.label}</span>
              <select
                name={field.name}
                required
                defaultValue=""
                className="h-11 w-full rounded-xl border bg-white px-3 text-sm"
              >
                <option value="" disabled>Selecione</option>
                {field.options.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
          );
        }

        return (
          <label key={field.name} className="block space-y-1.5 text-sm font-medium">
            <span>{field.label}</span>
            <Input
              name={field.name}
              type={field.type}
              autoComplete={field.autoComplete}
              required
            />
          </label>
        );
      })}
      {state.error ? (
        <p role="alert" className="text-sm text-[var(--danger)]">
          {state.error}
        </p>
      ) : null}
      {state.success ? (
        <p role="status" className="text-sm text-[var(--success)]">
          {state.success}
        </p>
      ) : null}
      <Button type="submit" disabled={pending} className="h-11 w-full">
        {pending ? "Aguarde..." : submitLabel}
      </Button>
    </form>
  );
}
