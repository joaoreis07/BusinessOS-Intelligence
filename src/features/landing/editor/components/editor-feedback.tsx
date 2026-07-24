import type { EditorActionState } from "../types";

export function EditorFeedback({ state }: { state: EditorActionState }) {
  if (state.error) {
    return (
      <p role="alert" className="rounded-xl border border-[var(--danger)]/20 bg-red-50 px-4 py-3 text-sm text-[var(--danger)]">
        {state.error}
      </p>
    );
  }
  if (state.success) {
    return (
      <p role="status" className="rounded-xl border border-[var(--success)]/20 bg-green-50 px-4 py-3 text-sm text-[var(--success)]">
        {state.success}
      </p>
    );
  }
  return null;
}
