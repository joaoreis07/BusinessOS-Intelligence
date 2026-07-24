import Link from "next/link";
import { loginAction } from "@/app/(auth)/actions";
import { AuthForm } from "@/components/forms/auth-form";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next } = await searchParams;

  return (
    <>
      <h1 className="text-3xl font-bold">Acesse sua conta</h1>
      <p className="mt-2 text-[var(--muted)]">
        Continue administrando seu negócio.
      </p>
      <div className="mt-8">
        <AuthForm
          action={loginAction}
          hidden={{ next: next ?? "/dashboard" }}
          fields={[
            { name: "email", label: "E-mail", type: "email", autoComplete: "email" },
            {
              name: "password",
              label: "Senha",
              type: "password",
              autoComplete: "current-password",
            },
          ]}
          submitLabel="Entrar"
        />
      </div>
      <div className="mt-5 flex justify-between text-sm">
        <Link href="/recuperar-senha" className="text-[var(--primary)]">
          Esqueci minha senha
        </Link>
        <Link href="/cadastro" className="text-[var(--primary)]">
          Criar conta
        </Link>
      </div>
    </>
  );
}
