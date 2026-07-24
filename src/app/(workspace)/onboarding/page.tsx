import { redirect } from "next/navigation";
import { completeOnboardingAction } from "./actions";
import { AuthForm } from "@/components/forms/auth-form";
import { createClient } from "@/lib/supabase/server";
import { requireUser } from "@/lib/auth/guards";

export default async function OnboardingPage() {
  const user = await requireUser();
  const supabase = await createClient();
  const { count } = await supabase
    .from("company_memberships")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user.id)
    .is("deleted_at", null);

  if ((count ?? 0) > 0) {
    redirect("/dashboard");
  }

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-xl items-center px-4 py-10">
      <section className="w-full rounded-2xl border bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-bold">Vamos configurar sua empresa</h1>
        <p className="mt-2 text-sm text-[var(--muted)]">
          Este passo cria sua empresa, membership, workspace e plano trial.
        </p>
        <div className="mt-6">
          <AuthForm
            action={completeOnboardingAction}
            submitLabel="Finalizar onboarding"
            fields={[
              { name: "companyName", label: "Nome da empresa" },
              { name: "slug", label: "Slug público" },
              { name: "businessType", label: "Segmento" },
              { name: "timezone", label: "Fuso horário", autoComplete: "off" },
              { name: "locale", label: "Idioma", autoComplete: "off" },
              { name: "countryCode", label: "País (código ISO-2)", autoComplete: "off" },
              { name: "currency", label: "Moeda (código ISO-3)", autoComplete: "off" },
              { name: "logoPath", label: "Logo (estrutura preparada)", autoComplete: "off" },
              { name: "primaryColor", label: "Cor principal", autoComplete: "off" },
            ]}
          />
        </div>
      </section>
    </main>
  );
}
