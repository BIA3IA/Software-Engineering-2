const mockPost = jest.fn()

jest.mock("axios", () => ({
    create: jest.fn(() => ({ post: mockPost })),
}))

const mockGetRefreshToken = jest.fn()
const mockSetSession = jest.fn()
const mockClearSession = jest.fn()

jest.mock("@/auth/authSession", () => ({
    getRefreshToken: () => mockGetRefreshToken(),
    setSession: (t: any) => mockSetSession(t),
    clearSession: () => mockClearSession(),
}))

import { refreshAccessToken } from "@/api/tokenManager"

describe("api/tokenManager", () => {
    beforeEach(() => {
        jest.clearAllMocks()
        mockPost.mockReset()
        mockGetRefreshToken.mockReset()
    })

    test("returns null if no refresh token", async () => {
        mockGetRefreshToken.mockReturnValue(null)

        const out = await refreshAccessToken()

        expect(out).toBeNull()
        expect(mockPost).not.toHaveBeenCalled()
    })

    test("calls refresh endpoint and updates session", async () => {
        mockGetRefreshToken.mockReturnValue("rt1")
        mockPost.mockResolvedValueOnce({
            data: { tokens: { accessToken: "a1", refreshToken: "rt2" } },
        })

        const out = await refreshAccessToken()

        expect(mockPost).toHaveBeenCalledWith("/auth/refresh", { refreshToken: "rt1" })
        expect(mockSetSession).toHaveBeenCalledWith({ accessToken: "a1", refreshToken: "rt2" })
        expect(out).toBe("a1")
    })

    test("clears session and returns null when refresh request fails", async () => {
        mockGetRefreshToken.mockReturnValue("rt1")
        mockPost.mockRejectedValueOnce(new Error("network"))

        const out = await refreshAccessToken()

        expect(mockPost).toHaveBeenCalledWith("/auth/refresh", { refreshToken: "rt1" })
        expect(mockClearSession).toHaveBeenCalled()
        expect(out).toBeNull()
    })

    test("coalesces concurrent refresh requests", async () => {
        mockGetRefreshToken.mockReturnValue("rt1")
        type RefreshResponse = { data: { tokens: { accessToken: string; refreshToken: string } } }
        let resolvePost: ((value: RefreshResponse) => void) | null = null
        mockPost.mockImplementationOnce(
            () =>
                new Promise<RefreshResponse>((resolve) => {
                    resolvePost = resolve
                })
        )

        const firstCall = refreshAccessToken()
        const secondCall = refreshAccessToken()

        expect(mockPost).toHaveBeenCalledTimes(1)
        resolvePost?.({
            data: { tokens: { accessToken: "a2", refreshToken: "r2" } },
        })

        await expect(firstCall).resolves.toBe("a2")
        await expect(secondCall).resolves.toBe("a2")
        expect(mockSetSession).toHaveBeenCalledWith({ accessToken: "a2", refreshToken: "r2" })
    })
})
