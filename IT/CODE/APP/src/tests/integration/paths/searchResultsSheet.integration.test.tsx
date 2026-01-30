import React from "react"
import { render, fireEvent } from "@testing-library/react-native"
import { SearchResultsSheet } from "@/components/paths/SearchResultsSheet"

let mockUser: any = { id: "guest", username: "Guest", email: "" }

jest.mock("@/auth/storage", () => ({
    useAuthStore: (selector: any) => selector({ user: mockUser }),
}))

jest.mock("@/components/paths/PathResultCard", () => {
    const React = require("react")
    const { Pressable, Text, View } = require("react-native")
    return {
        PathResultCard: ({ title, selected, actionLabel, onActionPress, onPress }: any) =>
            React.createElement(
                View,
                null,
                React.createElement(Pressable, { onPress }, React.createElement(Text, null, title)),
                selected ? React.createElement(Text, null, `selected-${title}`) : null,
                actionLabel
                    ? React.createElement(
                          Pressable,
                          { onPress: onActionPress },
                          React.createElement(Text, null, actionLabel)
                      )
                    : null
            ),
    }
})

describe("search results sheet guest messaging", () => {
    test("guest sees login CTA hint when results are empty", () => {
        mockUser = { id: "guest", username: "Guest", email: "" }

        const { getByText } = render(
            <SearchResultsSheet visible results={[]} topOffset={0} onClose={jest.fn()} />
        )

        expect(getByText("Create an account and a new path!")).toBeTruthy()
    })

    test("logged-in sees generic empty hint", () => {
        mockUser = { id: "user-1" }

        const { getByText } = render(
            <SearchResultsSheet visible results={[]} topOffset={0} onClose={jest.fn()} />
        )

        expect(getByText("Try creating one!")).toBeTruthy()
    })

    test("selection highlight renders for selected result", () => {
        mockUser = { id: "user-1" }

        const results = [
            { id: "p1", title: "Alpha", description: "desc", tags: [], route: [] },
            { id: "p2", title: "Beta", description: "desc", tags: [], route: [] },
        ]

        const { getByText, queryByText } = render(
            <SearchResultsSheet
                visible
                results={results}
                topOffset={0}
                onClose={jest.fn()}
                selectedResultId="p2"
            />
        )

        expect(getByText("selected-Beta")).toBeTruthy()
        expect(queryByText("selected-Alpha")).toBeNull()
    })

    test("select and action callbacks fire", () => {
        mockUser = { id: "user-1" }

        const onSelectResult = jest.fn()
        const onActionPress = jest.fn()
        const results = [
            { id: "p1", title: "Alpha", description: "desc", tags: [], route: [] },
        ]

        const { getByText } = render(
            <SearchResultsSheet
                visible
                results={results}
                topOffset={0}
                onClose={jest.fn()}
                onSelectResult={onSelectResult}
                actionLabel="Start Trip"
                onActionPress={onActionPress}
            />
        )

        fireEvent.press(getByText("Alpha"))
        fireEvent.press(getByText("Start Trip"))

        expect(onSelectResult).toHaveBeenCalledWith(results[0])
        expect(onActionPress).toHaveBeenCalledWith(results[0])
    })

    test("close button triggers onClose", () => {
        mockUser = { id: "user-1" }
        const onClose = jest.fn()
        const results = [
            { id: "p1", title: "Alpha", description: "desc", tags: [], route: [] },
        ]

        const { getByTestId } = render(
            <SearchResultsSheet
                visible
                results={results}
                topOffset={0}
                onClose={onClose}
            />
        )

        fireEvent.press(getByTestId("search-results-close"))
        expect(onClose).toHaveBeenCalled()
    })
})
