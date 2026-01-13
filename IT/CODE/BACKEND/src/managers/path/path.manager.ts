import { Request, Response, NextFunction } from 'express';
import { queryManager } from '../query/index.js';
import { Coordinates, PathSegments } from '../../types/index.js';
import { NotFoundError, BadRequestError, ForbiddenError } from '../../errors/index.js';
import logger from '../../utils/logger';
import { snapToRoad, geocodeAddress } from '../../services/index.js';

const STATUS_SCORE_MAP = {
    OPTIMAL: 5,
    MEDIUM: 4,
    SUFFICIENT: 3,
    REQUIRES_MAINTENANCE: 2,
    CLOSED: 1,
} as const;

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
            if (creationMode === 'manual') {
                for (const segment of pathSegments) {
                    if (!segment.start || !segment.end) {
                        throw new BadRequestError('Each segment must have start and end coordinates', 'INVALID_SEGMENT');
                    }
                }

                // Extract origin and destination
                const origin: Coordinates = pathSegments[0].start;
                const destination: Coordinates = pathSegments[pathSegments.length - 1].end;

                // Create segments in DB and collect their IDs
                const createdSegmentIds: string[] = [];
                
                for (const segment of pathSegments) {
                    // Build polyline from start to end (add intermediate points if needed)
                    const polylineCoordinates: Coordinates[] = [segment.start, segment.end];
                    
                    const createdSegment = await queryManager.createSegment('OPTIMAL', polylineCoordinates);
                    createdSegmentIds.push(createdSegment.segmentId);
                }

                // Prepare segments with nextSegmentId using the created IDs
                const segments = createdSegmentIds.map((segmentId, index) => ({
                    segmentId,
                    nextSegmentId: index < createdSegmentIds.length - 1 ? createdSegmentIds[index + 1] : null,
                }));


                // we should also check if there is already a path with the same segments for this user otherwise we will create duplicates
                // TODO: implement duplicate path check ?

                const path = await queryManager.createPath(
                    userId,
                    origin,
                    destination,
                    segments,
                    visibility,
                    creationMode,
                    title,
                    description
                );

                // Calculate and update path status
                const score = await this.calculatePathStatus(path.pathId);

                if (score !== null)  {
                    queryManager.updatePathStatus(path.pathId, score);
                }

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
                        status: updatedPath.status,
                        visibility: updatedPath.visibility,
                    },
                });

            } else if (creationMode === 'automatic') {
                // Automatic path creation logic
                throw new BadRequestError('Automatic path creation not yet implemented', 'NOT_IMPLEMENTED');
                
            } else if (creationMode === undefined || creationMode === null) {
                
                throw new BadRequestError('Creation mode is required', 'MISSING_CREATION_MODE');
            } else {
                throw new BadRequestError('Invalid creation mode', 'INVALID_CREATION_MODE');
            }
        } catch (error) {
            next(error);
        }
    }

    /* Calculate path status based on segment status scores
       Formula (without reports for now):
       PathStatus = Σ(statusScore) / number_of_segments
       
       Then map to status:
       - >= 4.5 -> OPTIMAL
       - >= 3.5 -> MEDIUM
       - >= 2.5 -> SUFFICIENT
       - >= 1.5 -> REQUIRES_MAINTENANCE
       - default -> CLOSED

       TODO: consider background jobs or service to periodically recalculate path statuses based on reports and segment updates?
    */
    async calculatePathStatus(pathId: string): Promise<string> {
        try {
            const path = await queryManager.getPathById(pathId);

            if (!path) {
                throw new NotFoundError('Path not found', 'PATH_NOT_FOUND');
            }

            // Get all segment IDs from the path
            const segmentIds = path.pathSegments.map(ps => ps.segmentId);

            if (segmentIds.length === 0) {
                logger.warn({ pathId }, 'Path has no segments');
                return 'CLOSED';
            }

            // Get segment statistics
            const segments = await queryManager.getSegmentStatistics(segmentIds);

            if (segments.length === 0) {
                logger.warn({ pathId, segmentIds }, 'No segments found for path');
                return 'CLOSED';
            }

            // Calculate total status score
            let totalStatusScore = 0;
            
            for (const segment of segments) {
                const statusScore = STATUS_SCORE_MAP[segment.status as keyof typeof STATUS_SCORE_MAP] || 0;
                totalStatusScore += statusScore;
            }

            // Calculate average status score
            const averageStatusScore = totalStatusScore / segments.length;

            logger.debug({ 
                pathId, 
                totalStatusScore, 
                segmentCount: segments.length, 
                averageStatusScore 
            }, 'Calculated path status score');

            // Determine path status based on average score
            let pathStatus: string;

            if (averageStatusScore >= 4.5) {
                pathStatus = 'OPTIMAL';
            } else if (averageStatusScore >= 3.5) {
                pathStatus = 'MEDIUM';
            } else if (averageStatusScore >= 2.5) {
                pathStatus = 'SUFFICIENT';
            } else if (averageStatusScore >= 1.5) {
                pathStatus = 'REQUIRES_MAINTENANCE';
            } else {
                pathStatus = 'CLOSED';
            }

            // Update path status in database
            await queryManager.updatePathStatus(pathId, pathStatus);

            logger.info({ pathId, pathStatus, averageStatusScore }, 'Path status updated');

            return pathStatus;
        } catch (error) {
            logger.error({ err: error, pathId }, 'Error calculating path status');
            throw error;
        }
    }

    // User searches path

    async searchPath(req: Request, res: Response, next: NextFunction) {
        try {
            const { origin, destination } = req.query;
            const userId = req.user?.userId;

            if (typeof origin !== 'string' || !origin.trim()) {
                throw new BadRequestError('Origin address is required', 'MISSING_ORIGIN');
            }

            if (typeof destination !== 'string' || !destination.trim()) {
                throw new BadRequestError('Destination address is required', 'MISSING_DESTINATION');
            }

            const originCoords = await geocodeAddress(origin);
            const destinationCoords = await geocodeAddress(destination);

            const paths = await queryManager.searchPathsByOriginDestination(originCoords, destinationCoords, userId);

            if (paths.length === 0) {
                throw new NotFoundError('No routes found for the specified origin and destination', 'NO_ROUTE');
            }

            // Compute optimal paths by filtering and sorting
            const optimalPaths = paths
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

                    // Sort by freshness??
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
                        score: path.score,
                        visibility: path.visibility,
                        origin: path.origin,
                        destination: path.destination,
                        createdAt: path.createdAt,
                        segmentCount: path.pathSegments.length,
                    })),
                },
            });
        } catch (error) {
            next(error);
        }
    }


    // Get path details

    async getPathDetails(req: Request, res: Response, next: NextFunction) {
        try {
            const { pathId } = req.params;
            const userId = req.user?.userId;

            if (!pathId) {
                throw new BadRequestError('Path ID is required', 'MISSING_PATH_ID');
            }

            const path = await queryManager.getPathById(pathId);

            if (!path) {
                throw new NotFoundError('Selected route is unavailable', 'NOT_FOUND');
            }

            if (!path.visibility && path.userId !== userId) {
                throw new ForbiddenError('You do not have permission to view this path', 'FORBIDDEN');
            }

            res.json({
                success: true,
                data: {
                    pathId: path.pathId,
                    userId: path.userId,
                    title: path.title,
                    description: path.description,
                    status: path.status,
                    score: path.score,
                    visibility: path.visibility,
                    origin: path.origin,
                    destination: path.destination,
                    createdAt: path.createdAt,
                    creationMode: path.creationMode,
                    pathSegments: path.pathSegments.map(ps => ({
                        segmentId: ps.segmentId,
                        nextSegmentId: ps.nextSegmentId,
                        segment: ps.segment ? {
                            status: ps.segment.status,
                            polylineCoordinates: ps.segment.polylineCoordinates,
                            createdAt: ps.segment.createdAt,
                        } : undefined,
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

            res.json({
                success: true,
                data: {
                    count: paths.length,
                    paths: paths.map(path => ({
                        pathId: path.pathId,
                        title: path.title,
                        description: path.description,
                        status: path.status,
                        score: path.score,
                        visibility: path.visibility,
                        origin: path.origin,
                        destination: path.destination,
                        createdAt: path.createdAt,
                        segmentCount: path.pathSegments.length,
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

}

export const pathManager = new PathManager();
