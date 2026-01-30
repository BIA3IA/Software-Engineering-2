import React from "react"
import { render, fireEvent, waitFor } from "@testing-library/react-native"
import LogInScreen from "@/app/(auth)/login"
import { mockRouter } from "@/jest.setup"
import { useAuthStore } from "@/auth/storage"

jest.mock("@/auth/storage", () => ({
    useAuthStore: jest.fn(),
}))

describe("login integration", () => {
    beforeEach(() => {
        jest.clearAllMocks()
        mockRouter.push.mockClear()
        mockRouter.replace.mockClear()
        mockRouter.back.mockClear()
    })

    test("validation blocks submit and shows field errors", async () => {
        const loginWithPassword = jest.fn();

        (useAuthStore as unknown as jest.Mock).mockImplementation((sel: any) =>
            sel({ loginWithPassword })
        )

    const { getByPlaceholderText, getByText, findByText } = render(<LogInScreen />)

    fireEvent.changeText(getByPlaceholderText("Enter your email"), "not-an-email")
    fireEvent.changeText(getByPlaceholderText("Enter your password"), "123")
        fireEvent.press(getByText("Log In"))

        expect(await findByText("Please enter a valid email address.")).toBeTruthy()
        expect(await findByText("Password must be at least 8 characters.")).toBeTruthy()

        expect(loginWithPassword).not.toHaveBeenCalled()
        expect(mockRouter.replace).not.toHaveBeenCalled()
    })

    test("success calls store login and navigates to home", async () => {
        const loginWithPassword = jest.fn().mockResolvedValueOnce(undefined);

        (useAuthStore as unknown as jest.Mock).mockImplementation((sel: any) =>
            sel({ loginWithPassword })
        )

    const { getByPlaceholderText, getByText } = render(<LogInScreen />)

    fireEvent.changeText(getByPlaceholderText("Enter your email"), "a@b.com")
    fireEvent.changeText(getByPlaceholderText("Enter your password"), "12345678")
        fireEvent.press(getByText("Log In"))

        await waitFor(() => {
            expect(loginWithPassword).toHaveBeenCalledWith("a@b.com", "12345678")
            expect(mockRouter.replace).toHaveBeenCalledWith("/(main)/home")
        })
    })

    test("error shows popup", async () => {
        const loginWithPassword = jest.fn().mockRejectedValueOnce(new Error("fail"));
        
        (useAuthStore as unknown as jest.Mock).mockImplementation((sel: any) =>
            sel({ loginWithPassword })
        )

    const { getByPlaceholderText, getByText, findByText } = render(<LogInScreen />)

    fireEvent.changeText(getByPlaceholderText("Enter your email"), "a@b.com")
    fireEvent.changeText(getByPlaceholderText("Enter your password"), "12345678")
        fireEvent.press(getByText("Log In"))

        expect(await findByText("Login failed")).toBeTruthy()
        expect(await findByText("API error")).toBeTruthy()
    })
})
