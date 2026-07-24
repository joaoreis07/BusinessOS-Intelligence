import { updatePasswordAction } from "@/app/(auth)/actions";
import { AuthForm } from "@/components/forms/auth-form";

export default function ResetPasswordPage() {
  return (
    <div>
      <h1 className="text-3xl font-bold">Defina sua nova senha</h1>
      <p className="mt-2 text-[var(--muted)]">
        Escolha uma senha segura com pelo menos oito caracteres.
      </p>
      <div className="mt-8">
        <AuthForm
          action={updatePasswordAction}
          fields={[
            {
              name: "password",
              label: "Nova senha",
              type: "password",
              autoComplete: "new-password",
            },
          ]}
          submitLabel="Atualizar senha"
        />
      </div>
    </div>
  );
}
