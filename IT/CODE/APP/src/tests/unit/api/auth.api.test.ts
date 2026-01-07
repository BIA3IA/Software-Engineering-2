import { loginApi, signupApi, logoutApi, getProfileApi, updateProfileApi } from "@/api/auth"
import { api } from "@/api/client"

jest.mock("@/api/client", () => ({
    api: {
        post: jest.fn(),
        get: jest.fn(),
        patch: jest.fn(),
    },
}))

describe("api/auth", () => {
    beforeEach(() => {
        jest.clearAllMocks()
    })

    test("loginApi maps userId to id and returns tokens", async () => {
        ; (api.post as jest.Mock).mockResolvedValueOnce({
            data: {
                user: { userId: "u1", username: "bianca", email: "bianca@gmail.com" },
                tokens: { accessToken: "a", refreshToken: "r" },
            },
        })

        const out = await loginApi("bianca@gmail.com", "password")

        expect(api.post).toHaveBeenCalledWith("/auth/login", { email: "bianca@gmail.com", password: "password" })
        expect(out.user).toEqual({ id: "u1", username: "bianca", email: "bianca@gmail.com" })
        expect(out.tokens).toEqual({ accessToken: "a", refreshToken: "r" })
    })

    test("signupApi calls register then calls login", async () => {
        ; (api.post as jest.Mock)
            .mockResolvedValueOnce({ data: {} })
            .mockResolvedValueOnce({
                data: {
                    user: { userId: "u2", username: "username", email: "username@gmail.com" },
                    tokens: { accessToken: "a2", refreshToken: "r2" },
                },
            })

        const out = await signupApi("username", "username@gmail.com", "pw123456", ["a"])

        expect(api.post).toHaveBeenNthCalledWith(1, "/users/register", {
            username: "username",
            email: "username@gmail.com",
            password: "pw123456",
            systemPreferences: ["a"],
        })
        expect(api.post).toHaveBeenNthCalledWith(2, "/auth/login", { email: "username@gmail.com", password: "pw123456" })
        expect(out.user.id).toBe("u2")
    })

    test("logoutApi does nothing if refreshToken is null", async () => {
        await logoutApi(null)
        expect(api.post).not.toHaveBeenCalled()
    })

    test("getProfileApi maps nested data.userId to id", async () => {
        ; (api.get as jest.Mock).mockResolvedValueOnce({
            data: { data: { userId: "u9", username: "simone", email: "simone@gmail.com" } },
        })

        const out = await getProfileApi()

        expect(api.get).toHaveBeenCalledWith("/users/profile")
        expect(out).toEqual({ id: "u9", username: "simone", email: "simone@gmail.com" })
    })

    test("updateProfileApi returns message", async () => {
        ; (api.patch as jest.Mock).mockResolvedValueOnce({ data: { message: "ok" } })

        const msg = await updateProfileApi({ username: "newName" })

        expect(api.patch).toHaveBeenCalledWith("/users/update-profile", { username: "newName" })
        expect(msg).toBe("ok")
    })
})
