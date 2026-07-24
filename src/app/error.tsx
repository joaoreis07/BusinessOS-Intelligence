"use client";

import { Button } from "@/components/ui/button";

export default function ErrorPage({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="grid min-h-[60vh] place-items-center p-6">
      <div className="max-w-md text-center">
        <h1 className="text-2xl font-bold">Algo não saiu como esperado</h1>
        <p className="mt-3 text-[var(--muted)]">
          Tente novamente. Se o problema continuar, entre em contato com o suporte.
        </p>
        <Button onClick={reset} className="mt-6">
          Tentar novamente
        </Button>
      </div>
    </main>
  );
}
