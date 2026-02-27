import React from "react"
import { render, fireEvent } from "@testing-library/react-native"
import { RouteMap } from "@/components/route/RouteMap"

jest.mock("react-native/Libraries/Modal/Modal", () => {
    const React = require("react")
    const Modal = ({ visible, children }: any) =>
        visible ? React.createElement(React.Fragment, null, children) : null
    return { __esModule: true, default: Modal }
})

jest.mock("react-native-maps", () => {
    const React = require("react")
    const { View, Pressable } = require("react-native")
    const MockMap = React.forwardRef((props: any, ref: any) => {
        React.useImperativeHandle(ref, () => ({
            fitToCoordinates: jest.fn(),
            pointForCoordinate: async () => ({ x: 10, y: 10 }),
        }))
        return React.createElement(View, null, props.children)
    })
    MockMap.displayName = "MockMap"
    const Marker = ({ onPress, children }: any) =>
        React.createElement(Pressable, { onPress, testID: "map-marker" }, children)
    const Mock = (props: any) => React.createElement(View, null, props.children)
    return {
        __esModule: true,
        default: MockMap,
        Marker,
        Polyline: Mock,
        Circle: Mock,
        PROVIDER_GOOGLE: "google",
    }
})

describe("route map integration", () => {
  test("report marker opens callout with labels", async () => {
        const { getAllByTestId, findByText, getByText } = render(
            <RouteMap
                route={[
                    { latitude: 45.0, longitude: 9.0 },
                    { latitude: 45.01, longitude: 9.01 },
                ]}
                showWeatherBadge={false}
                reports={[
                    {
                        reportId: "r1",
                        position: { lat: 45.005, lng: 9.005 },
                        obstacleType: "POTHOLE",
                        pathStatus: "MEDIUM",
                    },
                ]}
            />
        )

        const markers = getAllByTestId("map-marker")
        const reportMarker = markers[1]

        fireEvent.press(reportMarker)

        expect(await findByText("Pothole")).toBeTruthy()
        expect(getByText("Medium")).toBeTruthy()
  })
})
