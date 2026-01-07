import { z } from "zod"

export const createPathSchema = z.object({
  name: z
    .string()
    .trim()
    .min(3, "Path name must be at least 3 characters."),
  description: z
    .string()
    .trim()
    .max(280, "Description must be 280 characters or less.")
    .optional()
    .or(z.literal("")),
  visibility: z
    .string()
    .trim()
    .min(1, "Please choose who can see this path."),
})

export type CreatePathFormValues = z.infer<typeof createPathSchema>
