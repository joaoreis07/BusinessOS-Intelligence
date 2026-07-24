export type AppErrorCode =
  | "UNAUTHENTICATED"
  | "FORBIDDEN"
  | "NOT_FOUND"
  | "VALIDATION_ERROR"
  | "CONFLICT"
  | "INTERNAL_ERROR";

export class AppError extends Error {
  constructor(
    public readonly code: AppErrorCode,
    message: string,
    public readonly status = 400,
  ) {
    super(message);
    this.name = "AppError";
  }
}

export function toSafeError(error: unknown) {
  if (error instanceof AppError) {
    return { code: error.code, message: error.message };
  }

  console.error(error);
  return {
    code: "INTERNAL_ERROR" as const,
    message: "Não foi possível concluir a operação.",
  };
}
