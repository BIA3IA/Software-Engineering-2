// Path-related type definitions for TypeScript type checking purposes
import { Coordinates, Segment } from './index.js';

export const PATH_STATUS_SCORE_MAP = {
    OPTIMAL: 5,
    MEDIUM: 4,
    SUFFICIENT: 3,
    REQUIRES_MAINTENANCE: 2,
    CLOSED: 1,
} as const;

export type PathStatus = keyof typeof PATH_STATUS_SCORE_MAP;

// Base Path interface
export interface Path {
    pathId: string;
    userId: string;
    createdAt: Date;
    status: PathStatus;
    origin: Coordinates;
    destination: Coordinates;
    visibility: boolean;
    creationMode: string;
    title: string | null;
    description: string | null;
    distanceKm: number | null;
    pathSegments: PathSegment[];
}

// Base path segment without the joined Segment
export interface PathSegment {
    status: PathStatus;
    segmentId: string;
    nextSegmentId: string | null;
    pathId: string;
    //segment?: Segment; // maybe is better to separate the types like PathSegment, PathSegmentWithSegment extends PathSegment,
                       // Path, PathWithSegments extends Path, PathSegments extends Path so that we can avoid optional fields
                       // eventually change sortPathSegmentsByChain and getPathById, and maybe adapt also to trip types 
}

// Path segment with the joined Segment, used when fetching paths with their segments
export interface PathSegmentWithSegment extends PathSegment {
    status: PathStatus;
    segment: Segment;
}


// Path with segments including the joined Segment data, used when fetching paths with their segments
export interface PathWithSegments extends Omit<Path, 'pathSegments'> {
    pathSegments: PathSegmentWithSegment[];
}
