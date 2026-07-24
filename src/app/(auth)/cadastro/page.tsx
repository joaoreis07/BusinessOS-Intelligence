import Link from "next/link";
import { signUpAction } from "@/app/(auth)/actions";
import { AuthForm } from "@/components/forms/auth-form";

export default function SignUpPage() {
  return (
    <>
      <h1 className="text-3xl font-bold">Crie seu BusinessOS</h1>
      <p className="mt-2 text-[var(--muted)]">
        Configure sua empresa e publique sua página em poucos passos.
      </p>
      <div className="mt-8">
        <AuthForm
          action={signUpAction}
          fields={[
            { name: "fullName", label: "Seu nome", autoComplete: "name" },
            { name: "companyName", label: "Nome da empresa" },
            {
              kind: "select",
              name: "businessType",
              label: "Tipo de negócio",
              options: [
                { value: "nutrition", label: "Nutrição" },
                { value: "health", label: "Saúde e bem-estar" },
                { value: "beauty", label: "Beleza e estética" },
                { value: "consulting", label: "Consultoria" },
                { value: "services", label: "Outros serviços" },
              ],
            },
            { name: "phone", label: "Telefone", type: "tel", autoComplete: "tel" },
            { name: "email", label: "E-mail", type: "email", autoComplete: "email" },
            {
              name: "password",
              label: "Senha",
              type: "password",
              autoComplete: "new-password",
            },
            {
              name: "confirmPassword",
              label: "Confirmar senha",
              type: "password",
              autoComplete: "new-password",
            },
            {
              kind: "checkbox",
              name: "acceptedTerms",
              label: "Li e aceito os termos de uso e a política de privacidade.",
            },
          ]}
          submitLabel="Criar conta"
        />
      </div>
      <p className="mt-5 text-sm text-[var(--muted)]">
        Já possui conta?{" "}
        <Link href="/login" className="font-medium text-[var(--primary)]">
          Entrar
        </Link>
      </p>
    </>
  );
}
