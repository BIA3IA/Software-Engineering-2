import { z } from "zod"

const emailSchema = z
  .string()
  .trim()
  .min(1, "Email is required.")
  .email("Please enter a valid email address.")

const passwordSchema = z
  .string()
  .trim()
  .min(8, "Password must be at least 8 characters.")

const loginPasswordSchema = z
  .string()
  .trim()
  .min(1, "Password is required.")

const usernameSchema = z
  .string()
  .trim()
  .min(5, "Username must be at least 5 characters.")

const confirmSchema = z
  .string()
  .trim()
  .min(8, "Please confirm your password.")

export const loginSchema = z.object({
  email: emailSchema,
  password: loginPasswordSchema,
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

export const editProfileSchema = z
  .object({
    username: usernameSchema,
    email: emailSchema,
    currentPassword: z
      .string()
      .refine((value) => value === "" || value.trim().length > 0, {
        message: "Current password cannot be only whitespace.",
      })
      .optional(),
    newPassword: z
      .string()
      .refine((value) => value === "" || value.trim().length > 0, {
        message: "New password cannot be only whitespace.",
      })
      .optional(),
    confirmNewPassword: z
      .string()
      .refine((value) => value === "" || value.trim().length > 0, {
        message: "Confirm password cannot be only whitespace.",
      })
      .optional(),
  })
  .superRefine((data, ctx) => {
    const wantsChange =
      Boolean(data.currentPassword && data.currentPassword.trim()) ||
      Boolean(data.newPassword && data.newPassword.trim()) ||
      Boolean(data.confirmNewPassword && data.confirmNewPassword.trim())

    if (!wantsChange) {
      return
    }

    if (!data.currentPassword || data.currentPassword.length < 8) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["currentPassword"],
        message: "Current password must be at least 8 characters.",
      })
    }

    if (!data.newPassword || data.newPassword.length < 8) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["newPassword"],
        message: "New password must be at least 8 characters.",
      })
    }

    if (!data.confirmNewPassword) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["confirmNewPassword"],
        message: "Please confirm your new password.",
      })
    }

    if (
      data.newPassword &&
      data.confirmNewPassword &&
      data.newPassword !== data.confirmNewPassword
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["confirmNewPassword"],
        message: "New passwords must match.",
      })
    }
  })

export type EditProfileSchema = z.infer<typeof editProfileSchema>
