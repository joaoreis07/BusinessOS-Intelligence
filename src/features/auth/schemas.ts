import { z } from "zod";

export const signInSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(128),
});

export const signUpSchema = signInSchema.extend({
  fullName: z.string().trim().min(3).max(120),
  companyName: z.string().trim().min(2).max(120),
  businessType: z.enum(["nutrition", "health", "beauty", "consulting", "services"]),
  phone: z.string().trim().min(10).max(32),
  confirmPassword: z.string().min(8).max(128),
  acceptedTerms: z.literal("true"),
}).refine((value) => value.password === value.confirmPassword, {
  message: "As senhas não coincidem.",
  path: ["confirmPassword"],
});

export const resetPasswordSchema = z.object({
  email: z.string().email(),
});

export const updatePasswordSchema = z.object({
  password: z.string().min(8).max(128),
});

export type SignInInput = z.infer<typeof signInSchema>;
export type SignUpInput = z.infer<typeof signUpSchema>;
