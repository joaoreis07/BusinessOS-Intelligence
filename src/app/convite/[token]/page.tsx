import { redirect } from "next/navigation";
import { acceptInvitation } from "@/features/invitations";
import { getCurrentUser } from "@/lib/auth/guards";

async function acceptInvitationAction(formData: FormData) {
  "use server";
  const token = String(formData.get("token") ?? "");
  await acceptInvitation(token);
  redirect("/dashboard");
}

export default async function InvitationAcceptPage(props: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await props.params;
  const user = await getCurrentUser();
  if (!user) redirect(`/login?next=/convite/${token}`);

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-lg items-center px-4">
      <section className="w-full rounded-2xl border bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-bold">Aceitar convite</h1>
        <p className="mt-2 text-sm text-[var(--muted)]">
          Confirme para entrar na empresa vinculada a este convite.
        </p>
        <form action={acceptInvitationAction} className="mt-6">
          <input type="hidden" name="token" value={token} />
          <button className="h-11 rounded-xl bg-[var(--primary)] px-4 font-semibold text-white">
            Aceitar convite
          </button>
        </form>
      </section>
    </main>
  );
}
