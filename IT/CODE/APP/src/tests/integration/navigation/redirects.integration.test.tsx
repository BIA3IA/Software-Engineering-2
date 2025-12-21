import React from "react"
import { render } from "@testing-library/react-native"
import RootLayout from "@/app/_layout"
import { useAuthStore } from "@/auth/storage"
import { mockRedirectSpy, mockSegments } from "@/jest.setup"

jest.mock("@/auth/storage", () => ({
    useAuthStore: jest.fn(),
}))

describe("auth redirects integration", () => {
    beforeEach(() => {
        jest.clearAllMocks()
        mockRedirectSpy.mockClear()
    })

    test("not logged in non-guest and in main redirects to welcome", () => {
        mockSegments.value = ["(main)"]

            ; (useAuthStore as unknown as jest.Mock).mockImplementation((sel: any) =>
                sel({ user: null, loading: false, initAuth: jest.fn() })
            )

        render(<RootLayout />)

        expect(mockRedirectSpy).toHaveBeenCalledWith("/(auth)/welcome")
    })

    test("logged in non-guest and in auth redirects to home", () => {
        mockSegments.value = ["(auth)"]

            ; (useAuthStore as unknown as jest.Mock).mockImplementation((sel: any) =>
                sel({ user: { id: "u1" }, loading: false, initAuth: jest.fn() })
            )

        render(<RootLayout />)

        expect(mockRedirectSpy).toHaveBeenCalledWith("/(main)/home")
    })

    test("guest user in auth does not redirect to home", () => {
        mockSegments.value = ["(auth)"]

            ; (useAuthStore as unknown as jest.Mock).mockImplementation((sel: any) =>
                sel({ user: { id: "guest" }, loading: false, initAuth: jest.fn() })
            )

        render(<RootLayout />)

        expect(mockRedirectSpy).not.toHaveBeenCalledWith("/(main)/home")
    })
})
