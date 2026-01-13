// Path-related type definitions for TypeScript type checking purposes
import { Coordinates, Segment } from './index.js';

export interface Path {
    pathId: string;
    userId: string;
    createdAt: Date;
    status: string;
    origin: Coordinates;
    destination: Coordinates;
    visibility: boolean;
    creationMode: string;
    score: number | null;
    title: string | null;
    description: string | null;
    pathSegments: PathSegment[];
}

export interface PathSegment {
    segmentId: string;
    nextSegmentId: string | null;
    pathId: string;
    segment?: Segment; // maybe is better to separate the types like PathSegment, PathSegmentWithSegment extends PathSegment,
                       // Path, PathWithSegments extends Path, PathSegments extends Path so that we can avoid optional fields
                       // eventually change sortPathSegmentsByChain and getPathById, and maybe adapt also to trip types 
                       // TODO: refactor later
}

export interface PathSegments extends Path {
    pathSegments: PathSegment[];
}