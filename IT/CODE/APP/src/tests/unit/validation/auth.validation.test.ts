import { loginSchema, signupSchema, editProfileSchema } from "@/auth/validation"

describe("auth validation", () => {
    test("loginSchema accepts valid email and password", () => {
        const res = loginSchema.safeParse({ email: "bianca@gmail.com", password: "12345678" })
        expect(res.success).toBe(true)
    })

    test("signupSchema rejects different passwords", () => {
        const res = signupSchema.safeParse({
            username: "bianca",
            email: "bianca@gmail.com",
            password: "12345678",
            confirm: "87654321",
        })
        expect(res.success).toBe(false)
    })

    test("editProfileSchema allows no password change fields", () => {
        const res = editProfileSchema.safeParse({
            username: "vajihe",
            email: "vajihe@gmail.com",
            currentPassword: "",
            newPassword: "",
            confirmNewPassword: "",
        })
        expect(res.success).toBe(true)
    })

    test("editProfileSchema requires all password fields if one is present", () => {
        const res = editProfileSchema.safeParse({
            username: "simone",
            email: "simone@gmail.com",
            currentPassword: "12345678",
            newPassword: "12345678",
            confirmNewPassword: "",
        })
        expect(res.success).toBe(false)
    })
})
