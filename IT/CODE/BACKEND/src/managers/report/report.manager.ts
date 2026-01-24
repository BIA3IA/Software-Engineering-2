import { Request, Response, NextFunction } from 'express';
import { queryManager } from '../query/index.js';
import { NotFoundError, BadRequestError } from '../../errors/index.js';
import logger from '../../utils/logger';

export class ReportManager {
    async createReport(req: Request, res: Response, next: NextFunction) {
        try {
            const { 
                pathSegmentId, 
                tripId, 
                obstacleType, 
                position, 
                reportMode 
            } = req.body;
            const userId = req.user?.userId;

            // Authentication check
            if (!userId) {
                throw new BadRequestError('User is not authenticated', 'UNAUTHORIZED');
            }

            // Local validation (Backend enforcement of mobile app checks)
            if (!pathSegmentId || !obstacleType || !position) {
                throw new BadRequestError('Invalid or incomplete data', 'INVALID_REPORT_DATA');
            }

            // Verify the segment exists before attaching a report
            //const segment = await queryManager.getSegmentById(pathSegmentId);
           // if (!segment) {
             //   throw new NotFoundError('Target segment not found', 'SEGMENT_NOT_FOUND');
            //}

            // Create report through Query Manager
            const report = await queryManager.createReport({
                userId,
                pathSegmentId,
                tripId,
                obstacleType,
                position,
                reportMode: reportMode || 'MANUAL',
                status: 'CREATED'
            });

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
            const { reportId, decision } = req.body;
            const userId = req.user?.userId;

            if (!userId) {
                throw new BadRequestError('User is not authenticated', 'UNAUTHORIZED');
            }

            if (!reportId || !['CONFIRMED', 'REJECTED'].includes(decision)) {
                throw new BadRequestError('Invalid decision or missing report ID', 'INVALID_CONFIRMATION');
            }

            // Verify report existence
            const report = await queryManager.getReportById(reportId);
            if (!report) {
                throw new NotFoundError('Report not found', 'NOT_FOUND');
            }

            // Persist confirmation
            const confirmation = await queryManager.createConfirmation(
                userId,
                reportId,
                decision
            );
            res.status(201).json({
                success: true,
                message: 'Report submitted',
                data: {
                    confirmationId: confirmation.confirmationId
                }
            });
        } catch (error) {
            next(error);
        }
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