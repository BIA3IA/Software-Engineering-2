import { createPathSchema } from "@/validation"

describe("validation/path", () => {
    test("createPathSchema rejects short name", () => {
        const result = createPathSchema.safeParse({
            name: "ab",
            description: "desc",
            visibility: "public",
        })

        expect(result.success).toBe(false)
    })

    test("createPathSchema accepts valid payload", () => {
        const result = createPathSchema.safeParse({
            name: "My Path",
            description: "desc",
            visibility: "private",
        })

        expect(result.success).toBe(true)
    })

    test("createPathSchema rejects long description", () => {
        const result = createPathSchema.safeParse({
            name: "My Path",
            description: "a".repeat(281),
            visibility: "public",
        })

        expect(result.success).toBe(false)
    })
})
