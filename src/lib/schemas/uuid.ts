import { z } from "zod";

/** Accepts any PostgreSQL-compatible UUID string (including demo seed IDs). */
export const postgresUuidSchema = z
  .string()
  .regex(
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
    "Identificador inválido.",
  );
