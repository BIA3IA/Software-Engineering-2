import React from "react"
import { render } from "@testing-library/react-native"
import { RouteCard, type RouteItem } from "@/components/route/RouteCard"

jest.mock("react-native-maps", () => {
    const React = require("react")
    const { View } = require("react-native")
    const MockMap = React.forwardRef((props: any, ref: any) => {
        React.useImperativeHandle(ref, () => ({
            fitToCoordinates: jest.fn(),
            pointForCoordinate: async () => ({ x: 0, y: 0 }),
        }))
        return React.createElement(View, null, props.children)
    })
    const Mock = (props: any) => React.createElement(View, null, props.children)
    return {
        __esModule: true,
        default: MockMap,
        Marker: Mock,
        Polyline: Mock,
        Circle: Mock,
        PROVIDER_GOOGLE: "google",
    }
})

const baseTrip: RouteItem = {
    id: "t1",
    name: "Morning Ride",
    distanceKm: 12.5,
    durationMin: 45,
    date: "15/1/25",
    route: [
        { latitude: 45.0, longitude: 9.0 },
        { latitude: 45.01, longitude: 9.01 },
    ],
    avgSpeed: 25,
    temperatureLabel: "22°",
    weather: {
        condition: "Sunny",
        windSpeed: "10 km/h",
        humidity: "45%",
        visibility: "10 km",
        pressure: "1010 hPa",
    },
}

describe("route card integration", () => {
    test("shows map section when expanded", () => {
        const { getByText } = render(
            <RouteCard
                trip={baseTrip}
                isExpanded
                onToggle={jest.fn()}
                onDeletePress={jest.fn()}
            />
        )

        expect(getByText("Trip Map")).toBeTruthy()
    })

    test("does not show map section when collapsed", () => {
        const { queryByText } = render(
            <RouteCard
                trip={baseTrip}
                isExpanded={false}
                onToggle={jest.fn()}
                onDeletePress={jest.fn()}
            />
        )

        expect(queryByText("Trip Map")).toBeNull()
    })

    test("renders custom map title", () => {
        const { getByText } = render(
            <RouteCard
                trip={baseTrip}
                isExpanded
                onToggle={jest.fn()}
                onDeletePress={jest.fn()}
                mapTitle="Path Map"
            />
        )

        expect(getByText("Path Map")).toBeTruthy()
    })

    test("shows weather badge when enabled", () => {
        const { getByText } = render(
            <RouteCard
                trip={{ ...baseTrip, showWeatherBadge: true }}
                isExpanded
                onToggle={jest.fn()}
                onDeletePress={jest.fn()}
            />
        )

        expect(getByText("22°")).toBeTruthy()
    })

    test("hides weather badge when disabled", () => {
        const { queryByText } = render(
            <RouteCard
                trip={{ ...baseTrip, showWeatherBadge: false }}
                isExpanded
                onToggle={jest.fn()}
                onDeletePress={jest.fn()}
            />
        )

        expect(queryByText("22°")).toBeNull()
    })

    test("shows duration and average speed metrics only", () => {
        const { getByText, queryByText } = render(
            <RouteCard
                trip={baseTrip}
                isExpanded
                onToggle={jest.fn()}
                onDeletePress={jest.fn()}
            />
        )

        expect(getByText("Duration")).toBeTruthy()
        expect(getByText("Average Speed")).toBeTruthy()
        expect(queryByText("Max Speed")).toBeNull()
        expect(queryByText("Elevation")).toBeNull()
    })
})
