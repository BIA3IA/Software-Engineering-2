import { Request, Response, NextFunction } from 'express';
import { queryManager } from '../query/index.js';
import { NotFoundError, BadRequestError, ForbiddenError } from '../../errors/index.js';
import logger from '../../utils/logger';

export class ReportManager {
    /**
     * POST /reports
     * Creates a report linked to a specific segment.
     */
    async createReport(req: Request, res: Response, next: NextFunction) {
        try {
            const { 
                segmentId, 
                obstacleType, 
                polylineCoordinates, 
                path, 
                acquisitionMode, 
                status, 
                pathSegmentId 
            } = req.body;
            const userId = req.user?.userId;

            if (!userId) {
                throw new BadRequestError('User is not authenticated', 'UNAUTHORIZED');
            }

            if (!segmentId || !obstacleType || !polylineCoordinates) {
                throw new BadRequestError('Missing required report data', 'MISSING_FIELDS');
            }

            // Verify the segment exists (using existing queryManager method)
            const segments = await queryManager.getSegmentsByIds([segmentId]);
            if (segments.length === 0) {
                throw new NotFoundError('Target segment not found', 'SEGMENT_NOT_FOUND');
            }

            const report = await queryManager.createReport({
                userId,
                segmentId,
                obstacleType,
                polylineCoordinates,
                path: path ?? '',
                acquisitionMode: acquisitionMode ?? 'MANUAL',
                status: status ?? 'WARNING',
                pathSegmentId: pathSegmentId,
            });

            res.status(201).json({
                success: true,
                message: 'Report created successfully',
                data: report
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * GET /reports/path/:pathId
     * Gets all reports for segments belonging to a path.
     */
    async getReportsByPath(req: Request, res: Response, next: NextFunction) {
        try {
            const { pathId } = req.params;

            if (!pathId) {
                throw new BadRequestError('Path ID is required', 'MISSING_PATH_ID');
            }

            // Check if path exists
            const path = await queryManager.getPathById(pathId);
            if (!path) {
                throw new NotFoundError('Path not found', 'PATH_NOT_FOUND');
            }

            const reports = await queryManager.getReportsByPathId(pathId);

            res.json({
                success: true,
                data: {
                    count: reports.length,
                    reports
                }
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * GET /reports/trip/:tripId
     * Gets reports relevant to a trip's segments during its timeframe.
     */
    async getReportsByTrip(req: Request, res: Response, next: NextFunction) {
        try {
            const { tripId } = req.params;

            if (!tripId) {
                throw new BadRequestError('Trip ID is required', 'MISSING_TRIP_ID');
            }

            const trip = await queryManager.getTripById(tripId);
            if (!trip) {
                throw new NotFoundError('Trip not found', 'TRIP_NOT_FOUND');
            }

            const reports = await queryManager.getReportsByTripDetails(
                tripId, 
                trip.startedAt, 
                trip.finishedAt
            );

            res.json({
                success: true,
                data: {
                    tripId,
                    count: reports.length,
                    reports
                }
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * DELETE /reports/:reportId
     */
    async deleteReport(req: Request, res: Response, next: NextFunction) {
        try {
            const { reportId } = req.params;
            const userId = req.user?.userId;

            if (!userId) {
                throw new BadRequestError('User is not authenticated', 'UNAUTHORIZED');
            }

            const report = await queryManager.getReportById(reportId);
            if (!report) {
                throw new NotFoundError('Report not found', 'NOT_FOUND');
            }

            if (report.userId !== userId) {
                throw new ForbiddenError('You do not have permission to delete this report', 'FORBIDDEN');
            }

            await queryManager.deleteReportById(reportId);
            res.status(204).send();
        } catch (error) {
            next(error);
        }
    }
}

export const reportManager = new ReportManager();