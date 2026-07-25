import { redirect } from "next/navigation";
import { OnboardingForm } from "@/components/forms/onboarding-form";
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
          Três informações rápidas para começar. Fuso horário, idioma, logo e cores você
          ajusta depois nas configurações.
        </p>
        <div className="mt-6">
          <OnboardingForm />
        </div>
      </section>
    </main>
  );
}
