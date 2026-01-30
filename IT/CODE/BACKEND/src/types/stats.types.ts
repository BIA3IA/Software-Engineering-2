export interface Stats {
    statsId: string;
    tripId: string;
    userId: string;
    avgSpeed: number;    // km/h
    duration: number;    // seconds
    kilometers: number;  // distance
    createdAt: Date;
}

export type StatsPeriod = "DAY" | "WEEK" | "MONTH" | "YEAR" | "OVERALL";

export interface OverallStatsPeriod {
    userId: string;
    period: StatsPeriod;
    avgSpeed: number;
    avgDuration: number;
    avgKilometers: number;
    totalKilometers: number;
    totalTime: number;
    longestKilometer: number;
    longestTime: number;
    pathsCreated: number;
    tripCount: number;
    updatedAt: Date;
}

/**
 * Payload used when creating or computing new statistics
 */
export interface StatsCalculationPayload {
    avgSpeed: number;
    duration: number;
    kilometers: number;
}
