import { z } from "zod";

export const membershipRoleSchema = z.enum([
  "owner",
  "admin",
  "manager",
  "employee",
  "member",
  "viewer",
]);

export const membershipIdSchema = z.uuid();

export const updateMembershipRoleSchema = z.object({
  membershipId: z.uuid(),
  role: membershipRoleSchema,
});
