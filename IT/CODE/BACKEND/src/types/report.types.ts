import { Coordinates } from "./index";

export type ObstacleType = 'POTHOLE' | 'WORK_IN_PROGRESS' | 'FLOODING' | 'OBSTACLE' | 'OTHER';

export type ReportStatus = 'CONFIRMED' | 'REJECTED' | 'IGNORED' | 'CREATED';

export interface Report {
    reportId: string;
    createdAt: Date;
    userId: string;
    tripId: string | null;
    sessionId?: string | null;
    segmentId: string;
    obstacleType: ObstacleType;
    status: ReportStatus;
    position: Coordinates;
    pathStatus: string;
}
