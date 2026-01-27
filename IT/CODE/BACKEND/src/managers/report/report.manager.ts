import { Request, Response, NextFunction } from 'express';
import { queryManager } from '../query/index.js';
import { NotFoundError, BadRequestError } from '../../errors/index.js';
import { PATH_STATUS_SCORE_MAP } from '../../types/index.js';
import { clamp, mapScoreToStatus } from '../../utils/utils.js';

const REPORT_ALPHA = 0.6; // weight for confirmed reports
const REPORT_BETA = 0.8; // weight for rejected reports
const REPORT_MIN_RELIABILITY = 0.1; // minimum reliability threshold
const REPORT_MAX_RELIABILITY = 2.5; // maximum reliability cap

// Freshness parameters
const REPORT_FRESHNESS_HALF_LIFE_MIN = (() => {
    const rawValue = Number(process.env.REPORT_FRESHNESS_HALF_LIFE_MIN ?? 1440);
    return Number.isFinite(rawValue) && rawValue > 0 ? rawValue : 1440;
})();
const REPORT_ACTIVE_FRESHNESS_MIN = (() => {
    const rawValue = Number(process.env.REPORT_ACTIVE_FRESHNESS_MIN ?? 0.1);
    return Number.isFinite(rawValue) && rawValue > 0 ? rawValue : 0.1;
})();

// Obstacle types as a Set
const OBSTACLE_TYPES = new Set([
    'POTHOLE',
    'WORK_IN_PROGRESS',
    'FLOODING',
    'OBSTACLE',
    'OTHER',
]);

export class ReportManager {
    async createReport(req: Request, res: Response, next: NextFunction) {
        try {
            const { 
                pathSegmentId, 
                tripId, 
                obstacleType, 
                position, 
                reportMode,
                pathStatus,
                condition,
            } = req.body;
            const userId = req.user?.userId;
            const resolvedPathStatus = pathStatus || condition;

            // Authentication check
            if (!userId) {
                throw new BadRequestError('User is not authenticated', 'UNAUTHORIZED');
            }

            // Local validation (Backend enforcement of mobile app checks)
            if (!pathSegmentId || !tripId || !obstacleType || !position) {
                throw new BadRequestError('Invalid or incomplete data', 'INVALID_REPORT_DATA');
            }

            // Verify the segment exists before attaching a report
            const pathSegment = await queryManager.getPathSegmentById(pathSegmentId);
            if (!pathSegment) {
                throw new NotFoundError('Target segment not found', 'SEGMENT_NOT_FOUND');
            }

            if (!resolvedPathStatus || !(resolvedPathStatus in PATH_STATUS_SCORE_MAP)) {
                throw new BadRequestError('Invalid or missing path status', 'INVALID_PATH_STATUS');
            }
            if (!OBSTACLE_TYPES.has(obstacleType)) {
                throw new BadRequestError('Invalid obstacle type', 'INVALID_OBSTACLE_TYPE');
            }

            // Create report through Query Manager
            const report = await queryManager.createReport({
                userId,
                pathSegmentId,
                tripId,
                obstacleType,
                pathStatus: resolvedPathStatus,
                position,
                reportMode: reportMode || 'MANUAL',
                status: 'CREATED'
            });

            await this.recalculatePathSegmentStatus(pathSegmentId);

            // Return 201 Created as per sequence diagrams
            res.status(201).json({
                success: true,
                message: 'Report submitted successfully',
                data: {
                    reportId: report.reportId,
                    createdAt: report.createdAt
                }
            });
        } catch (error) {
            next(error);
        }
    }

    async confirmReport(req: Request, res: Response, next: NextFunction) {
        try {
            const { reportId } = req.params;
            const { decision, tripId, position } = req.body;
            const userId = req.user?.userId;

            if (!userId) {
                throw new BadRequestError('User is not authenticated', 'UNAUTHORIZED');
            }

            if (!reportId || !['CONFIRMED', 'REJECTED'].includes(decision)) {
                throw new BadRequestError('Invalid decision or missing report ID', 'INVALID_CONFIRMATION');
            }

            if (!tripId || !position) {
                throw new BadRequestError('Invalid or incomplete data', 'INVALID_CONFIRMATION_DATA');
            }

            // Verify report existence
            const report = await queryManager.getReportById(reportId);
            if (!report) {
                throw new NotFoundError('Report not found', 'NOT_FOUND');
            }

            const confirmationReport = await queryManager.createReport({
                userId,
                pathSegmentId: report.pathSegmentId,
                tripId,
                obstacleType: report.obstacleType,
                pathStatus: report.pathStatus,
                position,
                reportMode: 'MANUAL',
                status: decision
            });

            await this.recalculatePathSegmentStatus(report.pathSegmentId);
            res.status(201).json({
                success: true,
                message: 'Report submitted',
                data: {
                    reportId: confirmationReport.reportId
                }
            });
        } catch (error) {
            next(error);
        }
    }

    // Get active reports by path id
    async getReportsByPath(req: Request, res: Response, next: NextFunction) {
        try {
            const { pathId } = req.query;
            const pathIdValue = Array.isArray(pathId) ? pathId[0] : pathId;

            if (!pathIdValue || typeof pathIdValue !== 'string') {
                throw new BadRequestError('Path ID is required', 'MISSING_PATH_ID');
            }

            const reports = await queryManager.getReportsByPathId(pathIdValue);
            const now = new Date();

            const activeReports = this.filterActiveOriginalReports(reports, now);

            // Merge by pathSegmentId to avoid returning many reports for the same segment
            const mergedBySegment = new Map<string, typeof activeReports[number]>();
            for (const report of activeReports) {
                const existing = mergedBySegment.get(report.pathSegmentId);
                if (!existing || existing.createdAt < report.createdAt) {
                    mergedBySegment.set(report.pathSegmentId, report);
                }
            }

            res.json({
                success: true,
                data: Array.from(mergedBySegment.values()),
            });
        } catch (error) {
            next(error);
        }
    }

    // Get active reports by trip id
    async getActiveReportsByTripId(tripId: string) {
        const reports = await queryManager.getReportsByTripId(tripId);
        return this.filterActiveOriginalReports(reports, new Date());
    }

    /**
     * Retrieves all reports associated with a specific trip.
     */
    async getReportsByTrip(req: Request, res: Response, next: NextFunction) {
        try {
            const { tripId } = req.params;

            if (!tripId) {
                throw new BadRequestError('Trip ID is required', 'MISSING_TRIP_ID');
            }

            const reports = await queryManager.getReportsByTripId(tripId);

            res.json({
                success: true,
                data: reports
            });
        } catch (error) {
            next(error);
        }
    }

    private async recalculatePathSegmentStatus(pathSegmentId: string) {
        const segmentStatus = await this.calculatePathSegmentStatus(pathSegmentId);

        if (segmentStatus) {
            await queryManager.updatePathSegmentStatus(pathSegmentId, segmentStatus);
        }
    }

    private async calculatePathSegmentStatus(pathSegmentId: string) {
        const reports = await queryManager.getReportsByPathSegmentId(pathSegmentId);

        if (!reports.length) {
            return null;
        }

        const now = new Date();
        let weightedSum = 0;
        let reliabilitySum = 0;

        for (const report of reports) {
            // Ignore if ignored
            if (report.status === 'IGNORED') {
                continue;
            }

            // Numerical score for the reported status
            const statusScore =
                PATH_STATUS_SCORE_MAP[report.pathStatus as keyof typeof PATH_STATUS_SCORE_MAP];
            if (!statusScore) {
                continue;
            }

            // Compute reliability
            const { reliability } = this.computeReportSignals(report, now);
            if (reliability < REPORT_MIN_RELIABILITY) {
                continue;
            }

            const signedScore = report.status === 'REJECTED' ? -statusScore : statusScore;

            // Accumulate weighted scores (rejected reports reduce the score)
            weightedSum += signedScore * reliability;
            reliabilitySum += reliability;
        }

        // No valid reports
        if (reliabilitySum === 0) {
            return null;
        }

        // Compute average score and map to status
        const averageScore = weightedSum / reliabilitySum;
        return mapScoreToStatus(averageScore);
    }

    // Compute freshness based on age
    private computeFreshness(date: Date, now: Date) {
        const ageMinutes = Math.max(0, (now.getTime() - date.getTime()) / 60000);
        return Math.pow(2, -ageMinutes / REPORT_FRESHNESS_HALF_LIFE_MIN);
    }

    // Filter active original reports -> only created
    private filterActiveOriginalReports(reports: any[], now: Date) {
        return reports.filter(report => {
            if (report.status !== 'CREATED') {
                return false;
            }
            const { reliability, freshness } = this.computeReportSignals(report, now);
            return reliability >= REPORT_MIN_RELIABILITY && freshness >= REPORT_ACTIVE_FRESHNESS_MIN;
        });
    }

    // Compute reliability and freshness for a report
    private computeReportSignals(report: any, now: Date) {
        let confirmedScore = 0;
        let rejectedScore = 0;

        if (report.status === 'REJECTED') {
            rejectedScore += this.computeFreshness(report.createdAt, now);
        } else if (report.status === 'CREATED' || report.status === 'CONFIRMED') {
            confirmedScore += this.computeFreshness(report.createdAt, now);
        }

        const rawReliability = 1 + REPORT_ALPHA * confirmedScore - REPORT_BETA * rejectedScore;
        const reliability = clamp(rawReliability, REPORT_MIN_RELIABILITY, REPORT_MAX_RELIABILITY);
        const freshness = this.computeFreshness(report.createdAt, now);

        return { reliability, freshness };
    }

    async getReportsByPathSegment(req: Request, res: Response, next: NextFunction) {
        try {
            const { pathSegmentId } = req.params;

            if (!pathSegmentId) {
                throw new BadRequestError('Path Segment ID is required', 'MISSING_PATH_SEGMENT_ID');
            }

            const reports = await queryManager.getReportsByPathSegmentId(pathSegmentId);

            res.json({
                success: true,
                data: reports
            });
        } catch (error) {
            next(error);
        }
    }
}

export const reportManager = new ReportManager();
