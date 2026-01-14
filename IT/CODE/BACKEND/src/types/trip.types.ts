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
    origin: Coordinates;
    destination: Coordinates;
    statistics: TripStatistics | null;
    weather: WeatherData | null;
}

export interface TripSegment {
    segmentId: string;
    nextSegmentId: string | null;
    segment: Segment;
}

export interface TripSegments extends Trip {
    tripSegments: TripSegment[];
}
