import { getEditorLanding } from "@/features/landing/server";
import { LandingEditor } from "@/features/landing/editor";
import { requireCompanyContext } from "@/lib/tenancy/context";

export default async function LandingEditorPage() {
  await requireCompanyContext(["owner", "admin", "manager"]);
  const data = await getEditorLanding();

  return <LandingEditor data={data} />;
}
