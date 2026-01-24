import { Coordinates } from "./index";

export type ObstacleType = 'POTHOLE' | 'WORK_IN_PROGRESS' | 'FLOODING' | 'OBSTACLE' | 'OTHER';

export type ReportStatus = 'CONFIRMED' | 'REJECTED' | 'IGNORED' | 'CREATED';

export type ReportMode = 'MANUAL' | 'AUTOMATIC';

export type ConfirmationDecision = 'CONFIRMED' | 'REJECTED';

export interface Confirmation {
    confirmationId: string;
    reportId: string;
    userId: string;
    createdAt: Date;
    decision: ConfirmationDecision;
}

export interface Report {
    reportId: string;
    createdAt: Date;
    userId: string;
    tripId: string;
    segmentId: string;
    pathSegmentId: string;
    obstacleType: ObstacleType;
    status: ReportStatus;
    reportMode: ReportMode;
    position: Coordinates;
    pathStatus: string;
}

export interface ReportWithConfirmations extends Report {
    confirmations: Confirmation[];
}