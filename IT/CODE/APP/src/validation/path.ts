import { z } from "zod"

export const createPathSchema = z.object({
    name: z
        .string()
        .trim()
        .min(3, "Path name must be at least 3 characters."),
    description: z
        .string()
        .trim()
        .min(1, "Description is required.")
        .max(280, "Description must be 280 characters or less."),
    visibility: z
        .string()
        .trim()
        .min(1, "Please choose who can see this path."),
    creationMode: z.enum(["manual", "automatic"], {
        message: "Please choose a creation mode.",
    }),
})

export type CreatePathFormValues = z.infer<typeof createPathSchema>
