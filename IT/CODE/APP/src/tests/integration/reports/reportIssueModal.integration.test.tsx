import React from "react"
import { render, fireEvent } from "@testing-library/react-native"
import { ReportIssueModal } from "@/components/modals/ReportIssueModal"
import { ISSUE_CONDITION_OPTIONS, OBSTACLE_TYPE_OPTIONS } from "@/utils/reportOptions"

jest.mock("@/components/ui/SelectField", () => {
  const React = require("react")
  const { Pressable, Text } = require("react-native")
  return {
    SelectField: ({ label, valueLabel, onOpen }: any) =>
      React.createElement(
        Pressable,
        { onPress: () => onOpen({ top: 100, right: 10, width: 200 }) },
        React.createElement(Text, null, label),
        React.createElement(Text, null, valueLabel)
      ),
  }
})

jest.mock("@/components/ui/SelectionOverlay", () => {
  const React = require("react")
  const { Pressable, Text, View } = require("react-native")
  return {
    SelectionOverlay: ({ visible, options, onSelect }: any) =>
      visible
        ? React.createElement(
            View,
            null,
            options.map((opt: any) =>
              React.createElement(
                Pressable,
                { key: opt.key, onPress: () => onSelect(opt.key) },
                React.createElement(Text, null, opt.label)
              )
            )
          )
        : null,
  }
})

describe("ReportIssueModal integration", () => {
  test("submits default selections", () => {
    const onSubmit = jest.fn()
    const { getByText } = render(
      <ReportIssueModal visible onClose={jest.fn()} onSubmit={onSubmit} />
    )

    fireEvent.press(getByText("Submit Report"))

    expect(onSubmit).toHaveBeenCalledWith({
      condition: ISSUE_CONDITION_OPTIONS[0].key,
      obstacle: OBSTACLE_TYPE_OPTIONS[0].key,
    })
  })

  test("updates selections and submits", () => {
    const onSubmit = jest.fn()
    const { getByText } = render(
      <ReportIssueModal visible onClose={jest.fn()} onSubmit={onSubmit} />
    )

    fireEvent.press(getByText("Path Condition"))
    fireEvent.press(getByText(ISSUE_CONDITION_OPTIONS[1].label))

    fireEvent.press(getByText("Obstacle Type"))
    fireEvent.press(getByText(OBSTACLE_TYPE_OPTIONS[1].label))

    fireEvent.press(getByText("Submit Report"))

    expect(onSubmit).toHaveBeenCalledWith({
      condition: ISSUE_CONDITION_OPTIONS[1].key,
      obstacle: OBSTACLE_TYPE_OPTIONS[1].key,
    })
  })
})
