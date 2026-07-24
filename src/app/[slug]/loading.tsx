export default function PublicLandingLoading() {
  return (
    <main
      aria-busy="true"
      aria-label="Carregando landing page"
      className="min-h-[70vh] animate-pulse bg-[var(--background)] px-4 py-16"
    >
      <div className="mx-auto max-w-6xl space-y-6">
        <div className="h-40 rounded-3xl bg-[var(--surface-subtle)]" />
        <div className="grid gap-4 md:grid-cols-3">
          <div className="h-48 rounded-2xl bg-[var(--surface-subtle)]" />
          <div className="h-48 rounded-2xl bg-[var(--surface-subtle)]" />
          <div className="h-48 rounded-2xl bg-[var(--surface-subtle)]" />
        </div>
      </div>
    </main>
  );
}
