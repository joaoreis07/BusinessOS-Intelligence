import type { ReactNode } from "react";
import { Card } from "@/components/ui/card";

type EditorSectionCardProps = {
  title: string;
  description: string;
  children: ReactNode;
};

export function EditorSectionCard({ title, description, children }: EditorSectionCardProps) {
  return (
    <Card className="space-y-5">
      <div>
        <h2 className="text-xl font-semibold">{title}</h2>
        <p className="mt-1 text-sm text-[var(--muted)]">{description}</p>
      </div>
      {children}
    </Card>
  );
}
