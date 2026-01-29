import React from "react"
import { Text, TouchableOpacity } from "react-native"
import { render, fireEvent, waitFor, act } from "@testing-library/react-native"
import MainLayout from "@/app/(main)/_layout"
import { BottomNav } from "@/components/navigation/BottomNav"
import { useAuthStore } from "@/auth/storage"
import { useLoginPrompt } from "@/hooks/useLoginPrompt"
import { mockRouter, mockPathname, mockSlotElement } from "@/jest.setup"

jest.mock("@/auth/storage", () => ({
    useAuthStore: jest.fn(),
}))

function PromptTrigger() {
    const requireLogin = useLoginPrompt()
    return <Text onPress={requireLogin}>Trigger Prompt</Text>
}

describe("guest access restrictions", () => {
    const logout = jest.fn()

    beforeEach(() => {
        jest.clearAllMocks()
        logout.mockClear()
        mockRouter.replace.mockClear()
        mockRouter.push.mockClear()
        mockPathname.value = "/home"
        mockSlotElement.value = null
    })

    test("bottom nav requests login instead of navigating for guests", () => {
        const onRequireLogin = jest.fn()

            ; (useAuthStore as unknown as jest.Mock).mockImplementation((selector: any) =>
                selector({
                    user: { id: "guest", username: "Guest", email: "" },
                })
            )

        const { UNSAFE_getAllByType } = render(<BottomNav onRequireLogin={onRequireLogin} />)
        const tabs = UNSAFE_getAllByType(TouchableOpacity)
        const profileTab = tabs[3]

        act(() => {
            profileTab.props.onPress()
        })

        expect(onRequireLogin).toHaveBeenCalled()
        expect(mockRouter.replace).not.toHaveBeenCalled()
    })

    test.each([
        ["trips", "/trips"],
        ["paths", "/paths"],
        ["profile", "/profile"],
    ])("guest tapping %s requests login and blocks navigation", (_label, route) => {
        const onRequireLogin = jest.fn()
        mockPathname.value = "/home"

            ; (useAuthStore as unknown as jest.Mock).mockImplementation((selector: any) =>
                selector({
                    user: { id: "guest", username: "Guest", email: "" },
                })
            )

        const { getByTestId } = render(<BottomNav onRequireLogin={onRequireLogin} />)

        fireEvent.press(getByTestId(`nav-${_label}`))

        expect(onRequireLogin).toHaveBeenCalledTimes(1)
        expect(mockRouter.replace).not.toHaveBeenCalledWith(route)
    })

    test("guest can navigate to home without login prompt", () => {
        const onRequireLogin = jest.fn()
        mockPathname.value = "/trips"

            ; (useAuthStore as unknown as jest.Mock).mockImplementation((selector: any) =>
                selector({
                    user: { id: "guest", username: "Guest", email: "" },
                })
            )

        const { getByTestId } = render(<BottomNav onRequireLogin={onRequireLogin} />)

        fireEvent.press(getByTestId("nav-home"))

        expect(onRequireLogin).not.toHaveBeenCalled()
        expect(mockRouter.replace).toHaveBeenCalledWith("/home")
    })

    test("login prompt popup logs out guest and navigates to login", async () => {
        ; (useAuthStore as unknown as jest.Mock).mockImplementation((selector: any) =>
            selector({
                user: { id: "guest", username: "Guest", email: "" },
                logout,
            })
        )
        mockSlotElement.value = <PromptTrigger />

        const { getByText } = render(<MainLayout />)

        fireEvent.press(getByText("Trigger Prompt"))

        await waitFor(() => {
            expect(getByText("Log In Required")).toBeTruthy()
        })

        fireEvent.press(getByText("Log In"))

        expect(logout).toHaveBeenCalled()
        await waitFor(() => {
            expect(mockRouter.replace).toHaveBeenCalledWith("/(auth)/login")
        })
    })
})
