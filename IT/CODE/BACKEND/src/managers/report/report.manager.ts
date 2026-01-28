import { Request, Response, NextFunction } from 'express';
import { queryManager } from '../query/index.js';
import { NotFoundError, BadRequestError } from '../../errors/index.js';
import { computeReportSignals, REPORT_ACTIVE_FRESHNESS_MIN, REPORT_MIN_RELIABILITY } from '../../utils/index';
import { pathManager } from '../path/path.manager.js';

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
            } = req.body ?? {};
            const userId = req.user?.userId;
            const resolvedPathStatus = pathStatus || condition;

            // Authentication check
            if (!userId) {
                throw new BadRequestError('User is not authenticated', 'UNAUTHORIZED');
            }

            // Local validation aligned with other managers
            if (!pathSegmentId) {
                throw new BadRequestError('Path Segment ID is required', 'MISSING_PATH_SEGMENT_ID');
            }
            if (!tripId) {
                throw new BadRequestError('Trip ID is required', 'MISSING_TRIP_ID');
            }
            if (!obstacleType) {
                throw new BadRequestError('Obstacle type is required', 'MISSING_OBSTACLE_TYPE');
            }
            if (!position) {
                throw new BadRequestError('Position is required', 'MISSING_POSITION');
            }

            // Verify the segment exists before attaching a report
            const pathSegment = await queryManager.getPathSegmentById(pathSegmentId);
            if (!pathSegment) {
                throw new NotFoundError('Target segment not found', 'SEGMENT_NOT_FOUND');
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

            await pathManager.recalculatePathSegmentStatus(pathSegmentId);

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
            const { decision, tripId, position } = req.body ?? {};
            const userId = req.user?.userId;

            if (!userId) {
                throw new BadRequestError('User is not authenticated', 'UNAUTHORIZED');
            }

            if (!reportId) {
                throw new BadRequestError('Report ID is required', 'MISSING_REPORT_ID');
            }
            if (!decision) {
                throw new BadRequestError('Decision is required', 'MISSING_DECISION');
            }
            if (!['CONFIRMED', 'REJECTED'].includes(decision)) {
                throw new BadRequestError('Invalid decision', 'INVALID_DECISION');
            }
            if (!tripId) {
                throw new BadRequestError('Trip ID is required', 'MISSING_TRIP_ID');
            }
            if (!position) {
                throw new BadRequestError('Position is required', 'MISSING_POSITION');
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

            await pathManager.recalculatePathSegmentStatus(report.pathSegmentId);
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

    // Filter active original reports -> only created
    private filterActiveOriginalReports(reports: any[], now: Date) {
        return reports.filter(report => {
            if (report.status !== 'CREATED') {
                return false;
            }
            const { reliability, freshness } = computeReportSignals(report, now);
            return reliability >= REPORT_MIN_RELIABILITY && freshness >= REPORT_ACTIVE_FRESHNESS_MIN;
        });
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
