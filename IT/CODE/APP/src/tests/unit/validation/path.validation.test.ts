import { createPathSchema } from "@/validation"

describe("validation/path", () => {
  test("createPathSchema accepts valid payload", () => {
    const result = createPathSchema.safeParse({
      name: "My Path",
      description: "desc",
      visibility: "private",
    })

    expect(result.success).toBe(true)
  })

  test("createPathSchema rejects empty name", () => {
    const result = createPathSchema.safeParse({
      name: "",
      description: "desc",
      visibility: "public",
    })

    expect(result.success).toBe(false)
  })

  test("createPathSchema rejects short name", () => {
    const result = createPathSchema.safeParse({
      name: "ab",
      description: "desc",
      visibility: "public",
    })

    expect(result.success).toBe(false)
  })

  test("createPathSchema trims name before validating length", () => {
    const result = createPathSchema.safeParse({
      name: "  ab ",
      description: "desc",
      visibility: "public",
    })

    expect(result.success).toBe(false)
  })

  test("createPathSchema rejects empty description", () => {
    const result = createPathSchema.safeParse({
      name: "My Path",
      description: "",
      visibility: "public",
    })

    expect(result.success).toBe(false)
  })

  test("createPathSchema rejects missing description", () => {
    const result = createPathSchema.safeParse({
      name: "My Path",
      visibility: "public",
    })

    expect(result.success).toBe(false)
  })

  test("createPathSchema trims description before length check", () => {
    const result = createPathSchema.safeParse({
      name: "My Path",
      description: `${"a".repeat(279)}  `,
      visibility: "public",
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

  test("createPathSchema rejects empty visibility", () => {
    const result = createPathSchema.safeParse({
      name: "My Path",
      description: "desc",
      visibility: "",
    })

    expect(result.success).toBe(false)
  })

  test("createPathSchema rejects whitespace visibility", () => {
    const result = createPathSchema.safeParse({
      name: "My Path",
      description: "desc",
      visibility: "   ",
    })

    expect(result.success).toBe(false)
  })
})
