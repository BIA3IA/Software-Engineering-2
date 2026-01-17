import { describe, test, expect } from "@jest/globals";
import {
    haversineDistanceKm,
    haversineDistanceMeters,
    polylineDistanceKm,
    polylineDistanceMeters
} from "../../utils/geo";

describe("Testing geo utility functions", () => {

    describe("haversineDistanceKm", () => {

        test("Should calculate distance between two points correctly", () => {
            const from = { lat: 45.4642, lng: 9.1900 };
            const to = { lat: 45.4847, lng: 9.2027 };

            const distance = haversineDistanceKm(from, to);

            expect(distance).toBeGreaterThan(2.0);
            expect(distance).toBeLessThan(3.0);
        });

        test("Should calculate long distance correctly", () => {
            const milan = { lat: 45.4642, lng: 9.1900 };
            const rome = { lat: 41.9028, lng: 12.4964 };

            const distance = haversineDistanceKm(milan, rome);

            expect(distance).toBeGreaterThan(450);
            expect(distance).toBeLessThan(520);
        });

    });

    describe("haversineDistanceMeters", () => {

        test("Should return distance in meters", () => {
            const from = { lat: 45.4642, lng: 9.1900 };
            const to = { lat: 45.4652, lng: 9.1910 };

            const distance = haversineDistanceMeters(from, to);

            expect(distance).toBeGreaterThan(100);
            expect(distance).toBeLessThan(200);
        });

    });

    describe("polylineDistanceKm", () => {

        test("Should calculate total distance of polyline", () => {
            const coordinates = [
                { lat: 45.4642, lng: 9.1900 },
                { lat: 45.4700, lng: 9.1950 },
                { lat: 45.4750, lng: 9.2000 }
            ];

            const distance = polylineDistanceKm(coordinates);

            expect(distance).toBeGreaterThan(0);
            expect(typeof distance).toBe("number");
        });

        test("Should sum all segments correctly", () => {
            const pointA = { lat: 45.4642, lng: 9.1900 };
            const pointB = { lat: 45.4700, lng: 9.1950 };
            const pointC = { lat: 45.4750, lng: 9.2000 };

            const distanceAB = haversineDistanceKm(pointA, pointB);
            const distanceBC = haversineDistanceKm(pointB, pointC);
            const totalPolyline = polylineDistanceKm([pointA, pointB, pointC]);

            expect(totalPolyline).toBeCloseTo(distanceAB + distanceBC, 1);
        });

    });

    describe("polylineDistanceMeters", () => {

        test("Should return distance in meters", () => {
            const coordinates = [
                { lat: 45.4642, lng: 9.1900 },
                { lat: 45.4652, lng: 9.1910 }
            ];

            const distance = polylineDistanceMeters(coordinates);

            expect(distance).toBeGreaterThan(100);
            expect(distance).toBeLessThan(200);
        });

    });

});