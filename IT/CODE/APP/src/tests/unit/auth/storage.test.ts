import * as SecureStore from "expo-secure-store"
import { useAuthStore } from "@/auth/storage"
import { setSession, clearSession } from "@/auth/authSession"
import { loginApi, signupApi, logoutApi, getProfileApi, updateProfileApi } from "@/api/auth"

jest.mock("expo-secure-store")
jest.mock("@/api/auth", () => ({
    loginApi: jest.fn(),
    signupApi: jest.fn(),
    logoutApi: jest.fn(),
    getProfileApi: jest.fn(),
    updateProfileApi: jest.fn(),
}))
jest.mock("@/auth/authSession", () => ({
    setSession: jest.fn(),
    clearSession: jest.fn(),
    onSessionChange: (cb: any) => {
        return () => { }
    },
}))

const SS = SecureStore as jest.Mocked<typeof SecureStore>

describe("auth/storage store", () => {
    beforeEach(() => {
        jest.clearAllMocks()
        useAuthStore.setState({
            user: null,
            accessToken: null,
            refreshToken: null,
            loading: true,
        } as any)
    })

    test("initAuth loads from SecureStore and sets state when all present", async () => {
        SS.getItemAsync.mockImplementation(async (k: string) => {
            if (k === "bbp_user") return JSON.stringify({ id: "u1", username: "bia", email: "a@b.com" })
            if (k === "bbp_access_token") return "a1"
            if (k === "bbp_refresh_token") return "r1"
            return null
        })
            ; (getProfileApi as jest.Mock).mockResolvedValueOnce({ id: "u1", username: "bia2", email: "a@b.com" })

        await useAuthStore.getState().initAuth()

        const st = useAuthStore.getState()
        expect(setSession).toHaveBeenCalledWith({ accessToken: "a1", refreshToken: "r1" })
        expect(st.user?.username).toBe("bia")
        expect(st.accessToken).toBe("a1")
        expect(st.refreshToken).toBe("r1")
        expect(st.loading).toBe(false)
    })

    test("initAuth clears when missing data", async () => {
        SS.getItemAsync.mockResolvedValueOnce(null as any)

        await useAuthStore.getState().initAuth()

        const st = useAuthStore.getState()
        expect(clearSession).toHaveBeenCalled()
        expect(st.user).toBeNull()
        expect(st.loading).toBe(false)
    })

    test("loginWithPassword calls api then login", async () => {
        ; (loginApi as jest.Mock).mockResolvedValueOnce({
            user: { id: "u2", username: "x", email: "x@y.com" },
            tokens: { accessToken: "a2", refreshToken: "r2" },
        })

        await useAuthStore.getState().loginWithPassword("x@y.com", "pw")

        expect(SS.setItemAsync).toHaveBeenCalledWith("bbp_user", JSON.stringify({ id: "u2", username: "x", email: "x@y.com" }))
        expect(useAuthStore.getState().user?.id).toBe("u2")
        expect(useAuthStore.getState().loading).toBe(false)
    })

    test("signupWithPassword calls signup api then login", async () => {
        ; (signupApi as jest.Mock).mockResolvedValueOnce({
            user: { id: "u3", username: "y", email: "y@y.com" },
            tokens: { accessToken: "a3", refreshToken: "r3" },
        })

        await useAuthStore.getState().signupWithPassword({ username: "y", email: "y@y.com", password: "pw", systemPreferences: [] })

        expect(useAuthStore.getState().user?.id).toBe("u3")
    })

    test("logout calls logoutApi, clears user and tokens", async () => {
        useAuthStore.setState({ refreshToken: "r9", user: { id: "u9", username: "u", email: "e" }, loading: false } as any)
            ; (logoutApi as jest.Mock).mockResolvedValueOnce(undefined)

        await useAuthStore.getState().logout()

        expect(logoutApi).toHaveBeenCalledWith("r9")
        expect(useAuthStore.getState().user).toBeNull()
        expect(useAuthStore.getState().loading).toBe(false)
    })

    test("fetchProfile returns null if no accessToken", async () => {
        useAuthStore.setState({ accessToken: null } as any)
        const out = await useAuthStore.getState().fetchProfile()
        expect(out).toBeNull()
    })

    test("updateProfile calls update then fetchProfile", async () => {
        useAuthStore.setState({ accessToken: "a1" } as any)
            ; (updateProfileApi as jest.Mock).mockResolvedValueOnce("ok")
            ; (getProfileApi as jest.Mock).mockResolvedValueOnce({ id: "u1", username: "n", email: "e" })

        const msg = await useAuthStore.getState().updateProfile({ username: "n" })

        expect(msg).toBe("ok")
        expect(updateProfileApi).toHaveBeenCalled()
        expect(getProfileApi).toHaveBeenCalled()
    })
})
