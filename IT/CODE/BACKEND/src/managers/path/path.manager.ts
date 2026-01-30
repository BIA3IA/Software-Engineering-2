import { Request, Response, NextFunction } from 'express';
import { queryManager } from '../query/index.js';
import { Coordinates, PathWithSegments, PATH_STATUS_SCORE_MAP } from '../../types/index.js';
import { sortPathSegmentsByChain, computeReportSignals, computePathStatusFromSegments, mapScoreToStatus } from '../../utils/index.js';
import { NotFoundError, BadRequestError, ForbiddenError } from '../../errors/index.js';
import { snapToRoad, geocodeAddress } from '../../services/index.js';
import { haversineDistanceMeters, polylineDistanceKm } from '../../utils/geo.js';
import {
    PATH_SEARCH_TOLERANCE_DEG,
    PATH_SEARCH_MAX_DISTANCE_METERS,
    PATH_SEARCH_NEAR_DISTANCE_BUFFER_METERS,
    PATH_STATUS_ALL_WEIGHT,
    PATH_STATUS_REPORTED_WEIGHT,
    REPORT_MIN_RELIABILITY
} from '../../constants/appConfig.js';

export class PathManager {

    // User creates path

    async createPath(req: Request, res: Response, next: NextFunction) {
        try {
            const { pathSegments, visibility, creationMode, title, description } = req.body;
            const userId = req.user?.userId;

            if (!userId) {
                throw new BadRequestError('User is not authenticated', 'UNAUTHORIZED');
            }

            if (!pathSegments || !Array.isArray(pathSegments) || pathSegments.length === 0) {
                throw new BadRequestError('Path segments are required', 'MISSING_PATH_SEGMENTS');
            }

            if (visibility === undefined || visibility === null) {
                throw new BadRequestError('Visibility is required', 'MISSING_VISIBILITY');
            }

            // Create path based on the creation mode
            if (creationMode === 'manual' || creationMode === 'automatic') {
                for (const segment of pathSegments) {
                    if (!segment.start || !segment.end) {
                        throw new BadRequestError('Each segment must have start and end coordinates', 'INVALID_SEGMENT');
                    }
                }

                // Extract origin and destination
                const origin: Coordinates = pathSegments[0].start;
                const destination: Coordinates = pathSegments[pathSegments.length - 1].end;

                // Create segments in DB and collect their IDs and coordinates for distance calculation
                const createdSegmentIds: string[] = [];
                const allCoordinates: Coordinates[] = [];
                
                const existingSegments = await queryManager.getSegmentsByPolylineCoordinates(
                    pathSegments.map((segment) => [segment.start, segment.end])
                );

                for (const segment of pathSegments) {
                    // Build polyline from start to end (add intermediate points if needed)
                    const polylineCoordinates: Coordinates[] = [segment.start, segment.end];
                    const segmentKey = JSON.stringify(polylineCoordinates);
                    const existingSegmentId = existingSegments.get(segmentKey);

                    if (existingSegmentId) {
                        createdSegmentIds.push(existingSegmentId);
                    } else {
                        const createdSegment = await queryManager.createSegment('OPTIMAL', polylineCoordinates);
                        createdSegmentIds.push(createdSegment.segmentId);
                    }
                    allCoordinates.push(...polylineCoordinates);
                }

                // Calculate total distance
                const distanceKm = polylineDistanceKm(allCoordinates);

                // Prepare segments with nextSegmentId using the created IDs
                const segments = createdSegmentIds.map((segmentId, index) => ({
                    segmentId,
                    nextSegmentId: index < createdSegmentIds.length - 1 ? createdSegmentIds[index + 1] : null,
                }));


                // we should also check if there is already a path with the same segments for this user otherwise we will create duplicates
                const existingPath = await queryManager.getPathByOriginDestination(
                    userId, 
                    origin, 
                    destination
                );

                if (existingPath) {
                    return res.status(409).json({
                        success: false,
                        message: 'Path with same origin and destination already exists',
                        data: {
                            pathId: existingPath.pathId,
                            origin: existingPath.origin,
                            destination: existingPath.destination,
                        },
                    });
                }

                const path = await queryManager.createPath(
                    userId,
                    origin,
                    destination,
                    segments,
                    visibility,
                    creationMode,
                    title,
                    description,
                    distanceKm
                );

                const updatedPath = await queryManager.getPathById(path.pathId);

                if (!updatedPath) {
                    throw new NotFoundError('Path not found after creation', 'PATH_NOT_FOUND_AFTER_CREATION');
                }

                res.status(201).json({
                    success: true,
                    message: 'Path created successfully',
                    data: {
                        pathId: updatedPath.pathId,
                        createdAt: updatedPath.createdAt,
                        visibility: updatedPath.visibility,
                        distanceKm: updatedPath.distanceKm,
                    },
                });

            } else if (creationMode === undefined || creationMode === null) {
                throw new BadRequestError('Creation mode is required', 'MISSING_CREATION_MODE');
            } else {
                throw new BadRequestError('Invalid creation mode', 'INVALID_CREATION_MODE');
            }
        } catch (error) {
            next(error);
        }
    }

    // User searches path

    async searchPath(req: Request, res: Response, next: NextFunction) {
        try {
            const { origin, destination } = req.query;
            const userId = req.user?.userId;

            const originValue = Array.isArray(origin) ? origin[0] : origin;
            const destinationValue = Array.isArray(destination) ? destination[0] : destination;
            const originText =
                typeof originValue === 'string' ? originValue : originValue ? String(originValue) : '';
            const destinationText =
                typeof destinationValue === 'string'
                    ? destinationValue
                    : destinationValue
                      ? String(destinationValue)
                      : '';

            const originCoords = await geocodeAddress(originText);
            const destinationCoords = await geocodeAddress(destinationText);

            const paths = await queryManager.searchPathsByOriginDestination(userId);
            const sortedPaths = paths.map(path => ({
                ...path,
                pathSegments: sortPathSegmentsByChain(path.pathSegments),
            }));

            // Tolerance radius in degrees (approximately 200m)
            const tolerance = PATH_SEARCH_TOLERANCE_DEG;
            const maxDistanceMeters = PATH_SEARCH_MAX_DISTANCE_METERS;
            const nearDistanceBufferMeters = PATH_SEARCH_NEAR_DISTANCE_BUFFER_METERS;

            const matchingPaths: Array<{ path: PathWithSegments; maxDistance: number }> = [];

            for (const path of sortedPaths) {
                const pathOrigin = path.origin;
                const pathDestination = path.destination;

                const originMatch =
                    Math.abs(pathOrigin.lat - originCoords.lat) <= tolerance &&
                    Math.abs(pathOrigin.lng - originCoords.lng) <= tolerance;

                const destinationMatch =
                    Math.abs(pathDestination.lat - destinationCoords.lat) <= tolerance &&
                    Math.abs(pathDestination.lng - destinationCoords.lng) <= tolerance;

                if (!originMatch || !destinationMatch) {
                    continue;
                }

                const originDistance = haversineDistanceMeters(originCoords, pathOrigin);
                const destinationDistance = haversineDistanceMeters(destinationCoords, pathDestination);
                const maxDistance = Math.max(originDistance, destinationDistance);

                matchingPaths.push({
                    path,
                    maxDistance,
                });
            }

            if (!matchingPaths.length) {
                res.status(200).json({
                    success: true,
                    data: {
                        count: 0,
                        paths: [],
                    },
                });
                return;
            }

            const minDistance = Math.min(...matchingPaths.map(entry => entry.maxDistance));
            const distanceCutoff = Math.min(maxDistanceMeters, minDistance + nearDistanceBufferMeters);

            const filteredByDistance = matchingPaths
                .filter(entry => entry.maxDistance <= distanceCutoff)
                .sort((a, b) => a.maxDistance - b.maxDistance)
                .map(entry => entry.path);

            const pathsWithComputedStatus = filteredByDistance.map(path => ({
                ...path,
                status: path.status ?? computePathStatusFromSegments(path.pathSegments),
            }));

            // Compute optimal paths by filtering and sorting
            const optimalPaths = pathsWithComputedStatus
                .filter(path => {
                    // Exclude CLOSED paths from suggestions
                    if (path.status === 'CLOSED'){
                        return false;
                    }

                    // Include user's own paths (private or public)
                    if (userId && path.userId === userId){
                        return true;
                    }
                    
                    // Only include public paths for other users
                    return path.visibility === true;
                })
                .sort((a, b) => {
                    // Sort by status (OPTIMAL > MEDIUM > SUFFICIENT > REQUIRES_MAINTENANCE)
                    const statusOrder = ['OPTIMAL', 'MEDIUM', 'SUFFICIENT', 'REQUIRES_MAINTENANCE'];
                    const statusA = statusOrder.indexOf(a.status);
                    const statusB = statusOrder.indexOf(b.status);
                    
                    if (statusA !== statusB) {
                        return statusA - statusB;
                    }

                    // If same status, prefer shorter
                    const distanceA = a.distanceKm ?? Number.POSITIVE_INFINITY;
                    const distanceB = b.distanceKm ?? Number.POSITIVE_INFINITY;
                    if (distanceA !== distanceB) {
                        return distanceA - distanceB;
                    }

                    return b.createdAt.getTime() - a.createdAt.getTime();
                });

            res.json({
                success: true,
                data: {
                    count: optimalPaths.length,
                    paths: optimalPaths.map(path => ({
                        pathId: path.pathId,
                        userId: path.userId,
                        title: path.title,
                        description: path.description,
                        status: path.status,
                        visibility: path.visibility,
                        origin: path.origin,
                        destination: path.destination,
                        distanceKm: path.distanceKm,
                        createdAt: path.createdAt,
                        segmentCount: path.pathSegments.length,
                        pathSegments: path.pathSegments.map(ps => ({
                            segmentId: ps.segmentId,
                            polylineCoordinates: ps.segment.polylineCoordinates,
                        })),
                    })),
                },
            });
        } catch (error) {
            next(error);
        }
    }

    // get all user paths
    async getUserPaths(req: Request, res: Response, next: NextFunction) {
        try {
            const userId = req.user?.userId;

            if (!userId) {
                throw new BadRequestError('User is not authenticated', 'UNAUTHORIZED');
            }

            const paths = await queryManager.getPathsByUserId(userId);
            const sortedPaths = paths.map(path => ({
                ...path,
                pathSegments: sortPathSegmentsByChain(path.pathSegments),
            }));

            res.json({
                success: true,
                data: {
                    count: sortedPaths.length,
                    paths: sortedPaths.map(path => ({
                        pathId: path.pathId,
                        title: path.title,
                        description: path.description,
                        visibility: path.visibility,
                        status: path.status,
                        origin: path.origin,
                        destination: path.destination,
                        distanceKm: path.distanceKm,
                        createdAt: path.createdAt,
                        segmentCount: path.pathSegments.length,
                        pathSegments: path.pathSegments.map(ps => ({
                            segmentId: ps.segmentId,
                            polylineCoordinates: ps.segment.polylineCoordinates,
                        })),
                    })),
                },
            });
        } catch (error) {
            next(error);
        }
    }

    // Snap user drawn coordinates to nearest road using OSRM
    async snapPath(req: Request, res: Response, next: NextFunction) {
        try {
            const { coordinates } = req.body;

            if (!coordinates || !Array.isArray(coordinates) || coordinates.length < 2) {
                throw new BadRequestError('At least two coordinates are required', 'MISSING_COORDINATES');
            }

            const snapped = await snapToRoad(coordinates);

            res.status(200).json({
                success: true,
                data: {
                    coordinates: snapped,
                },
            });
        } catch (error) {
            next(error);
        }
    }

    // Delete path
    
    async deletePath(req: Request, res: Response, next: NextFunction) {
        try {
            const { pathId } = req.params;
            const userId = req.user?.userId;

            if (!userId) {
                throw new BadRequestError('User is not authenticated', 'UNAUTHORIZED');
            }

            if (!pathId) {
                throw new BadRequestError('Path ID is required', 'MISSING_PATH_ID');
            }

            const path = await queryManager.getPathById(pathId);

            if (!path) {
                throw new NotFoundError('Path not found', 'NOT_FOUND');
            }

            if (path.userId !== userId) {
                throw new ForbiddenError('You do not have permission to delete this path', 'FORBIDDEN');
            }

            await queryManager.deletePathById(pathId);

            res.status(204).send();
        } catch (error) {
            next(error);
        }
    }

    // change visibility of path
    async changePathVisibility(req: Request, res: Response, next: NextFunction) {
        try {
            const { pathId } = req.params;
            const { visibility } = req.body;
            const userId = req.user?.userId;

            if (!userId) {
                throw new BadRequestError('User is not authenticated', 'UNAUTHORIZED');
            }

            if (!pathId) {
                throw new BadRequestError('Path ID is required', 'MISSING_PATH_ID');
            }

            if (visibility === undefined || visibility === null) {
                throw new BadRequestError('Visibility is required', 'MISSING_VISIBILITY');
            }

            if (typeof visibility !== 'boolean') {
                throw new BadRequestError('Visibility must be a boolean', 'INVALID_VISIBILITY');
            }

            const path = await queryManager.getPathById(pathId);

            if (!path) {
                throw new NotFoundError('Path not found', 'NOT_FOUND');
            }

            if (path.userId !== userId) {
                throw new ForbiddenError(
                    'You do not have permission to change visibility of this path',
                    'FORBIDDEN'
                );
            }

            await queryManager.changePathVisibility(pathId, visibility);

            res.status(200).json({
                success: true,
                message: 'Path visibility updated successfully',
                data: {
                    pathId,
                    visibility,
                },
            });
        } catch (error) {
            next(error);
        }
    }

    async recalculatePathSegmentStatus(pathSegmentId: string) {
        const pathSegment = await queryManager.getPathSegmentById(pathSegmentId);
        if (!pathSegment) {
            return;
        }
        await this.recalculateSegmentStatusForAllPaths(pathSegment.segmentId);
    }

    async recalculateSegmentStatusForAllPaths(segmentId: string) {
        const segmentStatus = await this.calculateSegmentStatus(segmentId);
        const pathSegments = await queryManager.getPathSegmentsBySegmentId(segmentId);

        if (segmentStatus) {
            await Promise.all(
                pathSegments.map((segment) =>
                    queryManager.updatePathSegmentStatus(segment.id, segmentStatus)
                )
            );
        }

        const pathIds = new Set(pathSegments.map((segment) => segment.pathId));
        await Promise.all(Array.from(pathIds).map((pathId) => this.recalculatePathStatus(pathId)));
    }

    private async calculateSegmentStatus(segmentId: string) {
        const reports = await queryManager.getReportsBySegmentId(segmentId);

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
            const { reliability } = computeReportSignals(report, now);
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

    private async recalculatePathStatus(pathId: string) {
        const path = await queryManager.getPathById(pathId);
        if (!path) {
            return;
        }

        const reports = await queryManager.getReportsByPathId(pathId);
        const reportedSegmentIds = new Set(
            reports
                .filter((report) => report.status !== 'IGNORED')
                .map((report) => report.segmentId)
        );
        const segmentsToScore = path.pathSegments.filter((segment) =>
            reportedSegmentIds.has(segment.segmentId)
        );
        let status = computePathStatusFromSegments(path.pathSegments);
        if (segmentsToScore.length) {
            const reportedAverage = this.computeAverageStatusScore(segmentsToScore);
            const allAverage = this.computeAverageStatusScore(path.pathSegments);
            const mixedScore = reportedAverage * PATH_STATUS_REPORTED_WEIGHT + allAverage * PATH_STATUS_ALL_WEIGHT;
            status = mapScoreToStatus(mixedScore);
        }
        await queryManager.updatePathStatus(pathId, status);
    }

    private computeAverageStatusScore(segments: Array<{ status: keyof typeof PATH_STATUS_SCORE_MAP }>) {
        if (!segments.length) {
            return PATH_STATUS_SCORE_MAP.OPTIMAL;
        }
        const totalStatusScore = segments.reduce((sum, segment) => {
            const statusScore = PATH_STATUS_SCORE_MAP[segment.status] || 0;
            return sum + statusScore;
        }, 0);
        return totalStatusScore / segments.length;
    }

}

export const pathManager = new PathManager();
