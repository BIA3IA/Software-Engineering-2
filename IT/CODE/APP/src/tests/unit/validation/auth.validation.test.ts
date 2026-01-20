import { loginSchema, signupSchema, editProfileSchema } from "@/validation"

describe("auth validation", () => {
  test("loginSchema accepts valid email and password", () => {
    const res = loginSchema.safeParse({
      email: "bianca@gmail.com",
      password: "12345678",
    })
    expect(res.success).toBe(true)
  })

  test("loginSchema rejects missing email", () => {
    const res = loginSchema.safeParse({ email: "", password: "12345678" })
    expect(res.success).toBe(false)
  })

  test("loginSchema rejects invalid email format", () => {
    const res = loginSchema.safeParse({ email: "not-an-email", password: "12345678" })
    expect(res.success).toBe(false)
  })

  test("loginSchema rejects short password", () => {
    const res = loginSchema.safeParse({ email: "bianca@gmail.com", password: "123" })
    expect(res.success).toBe(false)
  })

  test("signupSchema accepts valid data", () => {
    const res = signupSchema.safeParse({
      username: "bianca",
      email: "bianca@gmail.com",
      password: "12345678",
      confirm: "12345678",
    })
    expect(res.success).toBe(true)
  })

  test("signupSchema rejects short username", () => {
    const res = signupSchema.safeParse({
      username: "bi",
      email: "bianca@gmail.com",
      password: "12345678",
      confirm: "12345678",
    })
    expect(res.success).toBe(false)
  })

  test("signupSchema rejects long username", () => {
    const res = signupSchema.safeParse({
      username: "a".repeat(21),
      email: "bianca@gmail.com",
      password: "12345678",
      confirm: "12345678",
    })
    expect(res.success).toBe(false)
  })

  test("signupSchema rejects invalid email", () => {
    const res = signupSchema.safeParse({
      username: "bianca",
      email: "invalid",
      password: "12345678",
      confirm: "12345678",
    })
    expect(res.success).toBe(false)
  })

  test("signupSchema rejects short password", () => {
    const res = signupSchema.safeParse({
      username: "bianca",
      email: "bianca@gmail.com",
      password: "1234567",
      confirm: "1234567",
    })
    expect(res.success).toBe(false)
  })

  test("signupSchema rejects short confirm password", () => {
    const res = signupSchema.safeParse({
      username: "bianca",
      email: "bianca@gmail.com",
      password: "12345678",
      confirm: "123",
    })
    expect(res.success).toBe(false)
  })

  test("signupSchema rejects confirm password with only whitespace", () => {
    const res = signupSchema.safeParse({
      username: "bianca",
      email: "bianca@gmail.com",
      password: "12345678",
      confirm: "        ",
    })
    expect(res.success).toBe(false)
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

  test("editProfileSchema accepts valid data without password change", () => {
    const res = editProfileSchema.safeParse({
      username: "vajihe",
      email: "vajihe@gmail.com",
      currentPassword: "",
      newPassword: "",
      confirmNewPassword: "",
    })
    expect(res.success).toBe(true)
  })

  test("editProfileSchema rejects short username", () => {
    const res = editProfileSchema.safeParse({
      username: "va",
      email: "vajihe@gmail.com",
    })
    expect(res.success).toBe(false)
  })

  test("editProfileSchema rejects long username", () => {
    const res = editProfileSchema.safeParse({
      username: "a".repeat(21),
      email: "vajihe@gmail.com",
    })
    expect(res.success).toBe(false)
  })

  test("editProfileSchema rejects invalid email", () => {
    const res = editProfileSchema.safeParse({
      username: "vajihe",
      email: "invalid",
    })
    expect(res.success).toBe(false)
  })

  test("editProfileSchema accepts valid password change", () => {
    const res = editProfileSchema.safeParse({
      username: "simone",
      email: "simone@gmail.com",
      currentPassword: "12345678",
      newPassword: "87654321",
      confirmNewPassword: "87654321",
    })
    expect(res.success).toBe(true)
  })

  test("editProfileSchema requires currentPassword if any password field present", () => {
    const res = editProfileSchema.safeParse({
      username: "simone",
      email: "simone@gmail.com",
      currentPassword: "",
      newPassword: "12345678",
      confirmNewPassword: "12345678",
    })
    expect(res.success).toBe(false)
  })

  test("editProfileSchema requires newPassword if any password field present", () => {
    const res = editProfileSchema.safeParse({
      username: "simone",
      email: "simone@gmail.com",
      currentPassword: "12345678",
      newPassword: "",
      confirmNewPassword: "12345678",
    })
    expect(res.success).toBe(false)
  })

  test("editProfileSchema requires confirmNewPassword if any password field present", () => {
    const res = editProfileSchema.safeParse({
      username: "simone",
      email: "simone@gmail.com",
      currentPassword: "12345678",
      newPassword: "12345678",
      confirmNewPassword: "",
    })
    expect(res.success).toBe(false)
  })

  test("editProfileSchema rejects short currentPassword", () => {
    const res = editProfileSchema.safeParse({
      username: "simone",
      email: "simone@gmail.com",
      currentPassword: "1234",
      newPassword: "12345678",
      confirmNewPassword: "12345678",
    })
    expect(res.success).toBe(false)
  })

  test("editProfileSchema rejects short newPassword", () => {
    const res = editProfileSchema.safeParse({
      username: "simone",
      email: "simone@gmail.com",
      currentPassword: "12345678",
      newPassword: "1234",
      confirmNewPassword: "1234",
    })
    expect(res.success).toBe(false)
  })

  test("editProfileSchema rejects mismatched new passwords", () => {
    const res = editProfileSchema.safeParse({
      username: "simone",
      email: "simone@gmail.com",
      currentPassword: "12345678",
      newPassword: "12345678",
      confirmNewPassword: "87654321",
    })
    expect(res.success).toBe(false)
  })

  test("editProfileSchema rejects currentPassword with only whitespace", () => {
    const res = editProfileSchema.safeParse({
      username: "simone",
      email: "simone@gmail.com",
      currentPassword: "   ",
      newPassword: "",
      confirmNewPassword: "",
    })
    expect(res.success).toBe(false)
  })

  test("editProfileSchema rejects newPassword with only whitespace", () => {
    const res = editProfileSchema.safeParse({
      username: "simone",
      email: "simone@gmail.com",
      currentPassword: "",
      newPassword: "   ",
      confirmNewPassword: "",
    })
    expect(res.success).toBe(false)
  })

  test("editProfileSchema rejects confirmNewPassword with only whitespace", () => {
    const res = editProfileSchema.safeParse({
      username: "simone",
      email: "simone@gmail.com",
      currentPassword: "",
      newPassword: "",
      confirmNewPassword: "   ",
    })
    expect(res.success).toBe(false)
  })
})
