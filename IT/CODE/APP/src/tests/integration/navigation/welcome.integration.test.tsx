import React from "react"
import { render, fireEvent } from "@testing-library/react-native"
import WelcomeScreen from "@/app/(auth)/welcome"
import { useAuthStore } from "@/auth/storage"
import { mockRouter } from "@/jest.setup"

jest.mock("@/auth/storage", () => ({
    useAuthStore: jest.fn(),
}))

describe("welcome screen navigation", () => {
    const loginAsGuest = jest.fn()

    beforeEach(() => {
        jest.clearAllMocks()
        loginAsGuest.mockClear()
        mockRouter.push.mockClear()
        mockRouter.replace.mockClear()

            ; (useAuthStore as unknown as jest.Mock).mockImplementation((selector: any) =>
                selector({
                    loginAsGuest,
                })
            )
    })

    test("guest mode logs in as guest user and navigates home", () => {
        const { getByText } = render(<WelcomeScreen />)

        fireEvent.press(getByText("Guest Mode"))

        expect(loginAsGuest).toHaveBeenCalledWith({ id: "guest", username: "Guest", email: "" })
        expect(mockRouter.replace).toHaveBeenCalledWith("/(main)/home")
    })

    test("cta buttons navigate to auth routes", () => {
        const { getByText } = render(<WelcomeScreen />)

        fireEvent.press(getByText("Sign Up"))
        expect(mockRouter.push).toHaveBeenCalledWith("/(auth)/signup")

        fireEvent.press(getByText("Log In"))
        expect(mockRouter.push).toHaveBeenCalledWith("/(auth)/login")
    })
})
