import { Request, Response, NextFunction } from 'express';
import { queryManager } from '../query/index.js';
import { Coordinates, PathSegments } from '../../types/index.js';
import { NotFoundError, BadRequestError } from '../../errors/index.js';
import logger from '../../utils/logger';


export class PathManager {

    // user creates path

    async createPath(req: Request, res: Response, next: NextFunction) {
        try {

            const { pathSegments, visibility, creationMode, title, description } = req.body;
            const userId = req.user?.userId;

            if (!userId) {
                throw new BadRequestError('User is not authenticated', 'UNAUTHORIZED');
            }

            // create path based on the creation mode

            if (creationMode === 'manual') {
                // extract the origin and destination from path segments
                const origin: Coordinates = pathSegments[0].start;
                const destination: Coordinates = pathSegments[pathSegments.length - 1].end;

                // create path entry in the database
                const path = await queryManager.createPath(userId, origin, destination, pathSegments, visibility, creationMode, title, description);
            }
            else if (creationMode === 'automatic') {
                // automatic path creation logic
            }
            else if (creationMode === undefined || creationMode === null) {
                throw new BadRequestError('Creation mode is required', 'MISSING_CREATION_MODE');
            }
            else {
                throw new BadRequestError('Invalid creation mode', 'INVALID_CREATION_MODE');
            }
            
        } catch (error) {
            next(error);
        }
    }

    async automaticPathCreation(userId: string, origin: Coordinates, destination: Coordinates, visibility: boolean, title: string | null, description: string | null): Promise<void> {
        try {
            // logic for automatic path creation

        } catch (error) {

        }
    }

    // calculate path status based on the latest data, effectiveness, freshness, distance, quality

    async calculatePathStatus(pathId: string): Promise<string> {
        try {
            
        } catch (error) {
            
        }
        return "";
    }

    // suggest path during search based on the rank(score), freshness and other parameters like path status
    
    async suggestPaths(coordinates: Coordinates): Promise<PathSegments[]> {
        try {
            
        } catch (error) {
            
        }
        return [];
    }

    // user searches path
    async searchPath(req: Request, res: Response, next: NextFunction) {
        try {
            
        } catch (error) {
            
        }
    }

    // delete path
    
    async deletePath(req: Request, res: Response, next: NextFunction) {
        try {
            
        } catch (error) {
        
        }
    }

    // change visibility of path
    async changePathVisibility(req: Request, res: Response, next: NextFunction) {
        try {

        } catch (error) {

        }
    }

}

export const pathManager = new PathManager();