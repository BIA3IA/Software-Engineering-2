import { Coordinates, WeatherData, Segment } from "./index";

export interface TripStatistics {
    speed: number;
    maxSpeed: number;
    distance: number;
    time: number;
}

export interface Trip {
    tripId: string;
    userId: string;
    createdAt: Date;
    startedAt: Date;
    finishedAt: Date;
    title: string | null;
    origin: Coordinates;
    destination: Coordinates;
    weather: WeatherData | null;
    distanceKm: number | null;
}

export interface TripSegment {
    segmentId: string;
    nextSegmentId: string | null;
    segment: Segment;
}

export interface TripSegments extends Trip {
    tripSegments: TripSegment[];
}
