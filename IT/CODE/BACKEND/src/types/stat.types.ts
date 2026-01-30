export interface Stat {
    statId: string;
    tripId: string;
    userId: string;
    avgSpeed: number;    // km/h
    duration: number;    // seconds
    kilometers: number;  // distance
    createdAt: Date;
}

export interface OverallStat {
    userId: string;
    avgSpeed: number;
    avgDuration: number;
    avgKilometers: number;
    lastTripCount: number;
    updatedAt: Date;
}

/**
 * Payload used when creating or computing new statistics
 */
export interface StatCalculationPayload {
    avgSpeed: number;
    duration: number;
    kilometers: number;
}