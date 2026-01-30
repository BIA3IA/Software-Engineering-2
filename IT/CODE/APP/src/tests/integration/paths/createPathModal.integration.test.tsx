import React from "react"
import { render, fireEvent } from "@testing-library/react-native"
import { CreatePathModal } from "@/components/modals/CreatePathModal"

jest.mock("@/components/ui/SelectionOverlay", () => ({
    SelectionOverlay: () => null,
}))

jest.mock("@/components/ui/SelectField", () => {
    const React = require("react")
    const { Pressable, Text, View } = require("react-native")
    return {
        SelectField: ({ label, valueLabel, onOpen, errorMessage }: any) =>
            React.createElement(
                View,
                null,
                React.createElement(Text, null, label),
                React.createElement(
                    Pressable,
                    { onPress: () => onOpen?.({ top: 0, right: 0, width: 100 }) },
                    React.createElement(Text, null, valueLabel)
                ),
                errorMessage ? React.createElement(Text, null, errorMessage) : null
            ),
    }
})

describe("create path modal integration", () => {
    test("validation blocks submit and shows field errors", async () => {
        const onSubmit = jest.fn()

        const { getByPlaceholderText, getByText, findByText } = render(
            <CreatePathModal
                visible
                onClose={jest.fn()}
                onSubmit={onSubmit}
                initialVisibility="public"
            />
        )

        fireEvent.changeText(getByPlaceholderText("Path name"), "ab")
        fireEvent.changeText(getByPlaceholderText("Describe the path"), "a".repeat(281))
        fireEvent.press(getByText("Start Creating"))

        expect(await findByText("Path name must be at least 3 characters.")).toBeTruthy()
        expect(await findByText("Description must be 280 characters or less.")).toBeTruthy()

        expect(onSubmit).not.toHaveBeenCalled()
    })

    test("valid input submits payload", async () => {
        const onSubmit = jest.fn()

        const { getByPlaceholderText, getByText } = render(
            <CreatePathModal
                visible
                onClose={jest.fn()}
                onSubmit={onSubmit}
                initialVisibility="public"
            />
        )

        fireEvent.changeText(getByPlaceholderText("Path name"), "My Path")
        fireEvent.changeText(getByPlaceholderText("Describe the path"), "Desc")
        fireEvent.press(getByText("Start Creating"))

        expect(onSubmit).toHaveBeenCalledWith({
            name: "My Path",
            description: "Desc",
            visibility: "public",
            creationMode: "manual",
        })
    })
})
