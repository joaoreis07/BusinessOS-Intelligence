import Link from "next/link";
import { recoverPasswordAction } from "@/app/(auth)/actions";
import { AuthForm } from "@/components/forms/auth-form";

export default function RecoverPasswordPage() {
  return (
    <>
      <h1 className="text-3xl font-bold">Recuperar senha</h1>
      <p className="mt-2 text-[var(--muted)]">
        Enviaremos um link seguro para o seu e-mail.
      </p>
      <div className="mt-8">
        <AuthForm
          action={recoverPasswordAction}
          fields={[
            { name: "email", label: "E-mail", type: "email", autoComplete: "email" },
          ]}
          submitLabel="Enviar instruções"
        />
      </div>
      <Link href="/login" className="mt-5 inline-block text-sm text-[var(--primary)]">
        Voltar para o login
      </Link>
    </>
  );
}
