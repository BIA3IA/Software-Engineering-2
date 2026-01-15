import { Coordinates } from "../types/index";

const EARTH_RADIUS_KM = 6371;

function toRadians(value: number) {
    return (value * Math.PI) / 180;
}

export function haversineDistanceKm(from: Coordinates, to: Coordinates): number {
    const deltaLatitude = toRadians(to.lat - from.lat);
    const deltaLongitude = toRadians(to.lng - from.lng);

    const halfChordLength =
        Math.cos(toRadians(from.lat)) * Math.cos(toRadians(to.lat)) *
        Math.sin(deltaLongitude / 2) * Math.sin(deltaLongitude / 2) +
        Math.sin(deltaLatitude / 2) * Math.sin(deltaLatitude / 2);

    const angularDistance = 2 * Math.atan2(Math.sqrt(halfChordLength), Math.sqrt(1 - halfChordLength));

    return EARTH_RADIUS_KM * angularDistance;
}

export function haversineDistanceMeters(from: Coordinates, to: Coordinates): number {
    return haversineDistanceKm(from, to) * 1000;
}
