import React from "react"
import { TouchableOpacity } from "react-native"
import { render, act } from "@testing-library/react-native"
import { BottomNav } from "@/components/navigation/BottomNav"
import { useAuthStore } from "@/auth/storage"
import { mockRouter, mockPathname } from "@/jest.setup"

jest.mock("@/auth/storage", () => ({
    useAuthStore: jest.fn(),
}))

describe("logged in navigation access", () => {
    beforeEach(() => {
        jest.clearAllMocks()
        mockRouter.replace.mockClear()
        mockRouter.push.mockClear()
        mockPathname.value = "/home"

            ; (useAuthStore as unknown as jest.Mock).mockImplementation((selector: any) =>
                selector({
                    user: { id: "u1", username: "bia", email: "bia@example.com" },
                })
            )
    })

    function pressTab(index: number) {
        const { UNSAFE_getAllByType } = render(<BottomNav />)
        const tabs = UNSAFE_getAllByType(TouchableOpacity)
        const target = tabs[index]
        act(() => {
            target.props.onPress()
        })
    }

    test("navigates to trips when pressing trips tab", () => {
        pressTab(1)
        expect(mockRouter.replace).toHaveBeenCalledWith("/trips")
    })

    test("does not navigate again when pressing current tab", () => {
        mockPathname.value = "/paths"
        pressTab(2)
        expect(mockRouter.replace).not.toHaveBeenCalled()
    })

    test("navigates to profile when pressing profile tab", () => {
        pressTab(3)
        expect(mockRouter.replace).toHaveBeenCalledWith("/profile")
    })
})
