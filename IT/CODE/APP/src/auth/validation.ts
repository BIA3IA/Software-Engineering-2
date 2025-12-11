import { z } from "zod"

const emailSchema = z
  .string()
  .trim()
  .min(1, "Email is required.")
  .email("Please enter a valid email address.")

const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters.")

const usernameSchema = z
  .string()
  .trim()
  .min(5, "Username must be at least 5 characters.")

const confirmSchema = z
  .string()
  .min(8, "Please confirm your password.")

export const loginSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
})

export type LoginFormValues = z.infer<typeof loginSchema>

export const signupSchema = z
  .object({
    username: usernameSchema,
    email: emailSchema,
    password: passwordSchema,
    confirm: confirmSchema,
  })
  .refine((data) => data.password === data.confirm, {
    message: "Passwords must match.",
    path: ["confirm"],
  })

export type SignupFormValues = z.infer<typeof signupSchema>
