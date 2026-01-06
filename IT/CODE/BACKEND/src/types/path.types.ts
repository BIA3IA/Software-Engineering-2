// Path-related type definitions for TypeScript type checking purposes
import { Coordinates } from './index.js';

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
}

export interface PathSegments extends Path {
    pathSegments: PathSegment[];
}