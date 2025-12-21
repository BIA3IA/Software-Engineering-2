import React from "react"
import { render, fireEvent, waitFor } from "@testing-library/react-native"
import EditProfileScreen from "@/app/(main)/edit-profile"
import { useAuthStore } from "@/auth/storage"

jest.mock("@/auth/storage", () => ({
    useAuthStore: jest.fn(),
}))

describe("edit profile integration", () => {
    beforeEach(() => {
        jest.clearAllMocks()
    })

    test("validation blocks submit and shows field errors", async () => {
        const updateProfile = jest.fn();

        (useAuthStore as unknown as jest.Mock).mockImplementation((sel: any) =>
            sel({ updateProfile })
        )

        const { getByLabelText, getByText, findByText } = render(<EditProfileScreen />)

        fireEvent.changeText(getByLabelText("Username"), "bia")
        fireEvent.changeText(getByLabelText("Email Address"), "not-an-email")
        fireEvent.changeText(getByLabelText("Current Password"), "123")
        fireEvent.changeText(getByLabelText("New Password"), "12345")
        fireEvent.changeText(getByLabelText("Confirm Password"), "12345679")
        fireEvent.press(getByText("Save Changes"))

        expect(await findByText("Username must be at least 5 characters.")).toBeTruthy()
        expect(await findByText("Please enter a valid email address.")).toBeTruthy()
        expect(await findByText("Current password must be at least 8 characters.")).toBeTruthy()
        expect(await findByText("New password must be at least 8 characters.")).toBeTruthy()
        expect(await findByText("New passwords must match.")).toBeTruthy()

        expect(updateProfile).not.toHaveBeenCalled()
    })

    test("success calls updateProfile and shows success popup", async () => {
        const updateProfile = jest.fn().mockResolvedValueOnce("OK")
        const user = { id: "u1", username: "bianca", email: "a@b.com" }

            ; (useAuthStore as unknown as jest.Mock).mockImplementation((sel: any) =>
                sel({ user, updateProfile })
            )

        const { getByLabelText, getByText, findByText } = render(<EditProfileScreen />)

        fireEvent.changeText(getByLabelText("Username"), "bianca2")
        fireEvent.changeText(getByLabelText("Email Address"), "b@b.com")
        fireEvent.press(getByText("Save Changes"))

        await waitFor(() => {
            expect(updateProfile).toHaveBeenCalledWith(
                expect.objectContaining({
                    username: "bianca2",
                    email: "b@b.com",
                    password: undefined,
                })
            )
        })

        expect(await findByText("Profile Updated")).toBeTruthy()
        expect(await findByText("Great!")).toBeTruthy()
    })

    test("error shows error popup", async () => {
        const updateProfile = jest.fn().mockRejectedValueOnce(new Error("fail"))
        const user = { id: "u1", username: "bianca", email: "a@b.com" }

            ; (useAuthStore as unknown as jest.Mock).mockImplementation((sel: any) =>
                sel({ user, updateProfile })
            )

        const { getByText, findByText } = render(<EditProfileScreen />)

        fireEvent.press(getByText("Save Changes"))

        expect(await findByText("Update Failed")).toBeTruthy()
        expect(await findByText("API error")).toBeTruthy()
    })
})
