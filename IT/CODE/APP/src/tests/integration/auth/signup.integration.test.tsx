import React from "react"
import { render, fireEvent, waitFor } from "@testing-library/react-native"
import SignUpScreen from "@/app/(auth)/signup"
import { mockRouter } from "@/jest.setup"
import { useAuthStore } from "@/auth/storage"

jest.mock("@/auth/storage", () => ({
    useAuthStore: jest.fn(),
}))

describe("signup integration", () => {
    beforeEach(() => {
        jest.clearAllMocks()
        mockRouter.push.mockClear()
        mockRouter.replace.mockClear()
        mockRouter.back.mockClear()
    })

    test("validation blocks submit and shows field errors", async () => {
        const signupWithPassword = jest.fn();
        
        (useAuthStore as unknown as jest.Mock).mockImplementation((sel: any) =>
                sel({ signupWithPassword })
            )

        const { getByPlaceholderText, getByText, findByText } = render(<SignUpScreen />)

        fireEvent.changeText(getByPlaceholderText("Choose a username"), "bia")
        fireEvent.changeText(getByPlaceholderText("Enter your email"), "not-an-email")
        fireEvent.changeText(getByPlaceholderText("Create a secure password"), "123")
        fireEvent.changeText(getByPlaceholderText("Confirm your password"), "12345679")
        fireEvent.press(getByText("Sign Up"))

        expect(await findByText("Username must be at least 5 characters.")).toBeTruthy()
        expect(await findByText("Please enter a valid email address.")).toBeTruthy()
        expect(await findByText("Password must be at least 8 characters.")).toBeTruthy()
        expect(await findByText("Passwords must match.")).toBeTruthy()

        expect(signupWithPassword).not.toHaveBeenCalled()
        expect(mockRouter.replace).not.toHaveBeenCalled()
    })

    test("success calls store signup and navigates to home", async () => {
        const signupWithPassword = jest.fn().mockResolvedValueOnce(undefined)

            ; (useAuthStore as unknown as jest.Mock).mockImplementation((sel: any) =>
                sel({ signupWithPassword })
            )

        const { getByPlaceholderText, getByText } = render(<SignUpScreen />)

        fireEvent.changeText(getByPlaceholderText("Choose a username"), "bianca")
        fireEvent.changeText(getByPlaceholderText("Enter your email"), "a@b.com")
        fireEvent.changeText(getByPlaceholderText("Create a secure password"), "12345678")
        fireEvent.changeText(getByPlaceholderText("Confirm your password"), "12345678")
        fireEvent.press(getByText("Sign Up"))

        await waitFor(() => {
            expect(signupWithPassword).toHaveBeenCalled()
            expect(mockRouter.replace).toHaveBeenCalledWith("/(main)/home")
        })
    })

    test("error shows popup", async () => {
        const signupWithPassword = jest.fn().mockRejectedValueOnce(new Error("fail"))

            ; (useAuthStore as unknown as jest.Mock).mockImplementation((sel: any) =>
                sel({ signupWithPassword })
            )

        const { getByPlaceholderText, getByText, findByText } = render(<SignUpScreen />)

        fireEvent.changeText(getByPlaceholderText("Choose a username"), "bianca")
        fireEvent.changeText(getByPlaceholderText("Enter your email"), "a@b.com")
        fireEvent.changeText(getByPlaceholderText("Create a secure password"), "12345678")
        fireEvent.changeText(getByPlaceholderText("Confirm your password"), "12345678")

        fireEvent.press(getByText("Sign Up"))

        expect(await findByText("Signup failed")).toBeTruthy()
        expect(await findByText("API error")).toBeTruthy()

    })
})
