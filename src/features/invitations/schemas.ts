import { z } from "zod";

export const invitationRoleSchema = z.enum([
  "admin",
  "manager",
  "employee",
  "member",
  "viewer",
]);

export const createInvitationSchema = z.object({
  email: z.string().email(),
  role: invitationRoleSchema.default("employee"),
  expiresInDays: z.number().int().min(1).max(30).default(7),
});

export const invitationIdSchema = z.uuid();
export const invitationTokenSchema = z.string().trim().min(16).max(128);
