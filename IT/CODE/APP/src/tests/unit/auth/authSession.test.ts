import {
    setSession,
    clearSession,
    getAccessToken,
    getRefreshToken,
    onSessionChange,
    type AuthTokens,
} from "@/auth/authSession"

describe("authSession", () => {
    test("setSession sets tokens and getters return them", () => {
        const tokens: AuthTokens = { accessToken: "a1", refreshToken: "r1" }

        setSession(tokens)

        expect(getAccessToken()).toBe("a1")
        expect(getRefreshToken()).toBe("r1")
    })

    test("clearSession clears tokens", () => {
        setSession({ accessToken: "a1", refreshToken: "r1" })
        clearSession()

        expect(getAccessToken()).toBeNull()
        expect(getRefreshToken()).toBeNull()
    })

    test("onSessionChange receives updates and unsubscribe stops it", () => {
        const cb = jest.fn()
        const unsub = onSessionChange(cb)

        setSession({ accessToken: "a2", refreshToken: "r2" })
        expect(cb).toHaveBeenCalledWith({ accessToken: "a2", refreshToken: "r2" })

        cb.mockClear()
        unsub()

        setSession({ accessToken: "a3", refreshToken: "r3" })
        expect(cb).not.toHaveBeenCalled()
    })
})
