import { PathWithSegments, TripSegments } from '../types/index';

// Utility function to get JWT secrets from environment variables
export const getJwtSecrets = () => {
    const accessTokenSecret = process.env.JWT_SECRET;
    const refreshTokenSecret = process.env.JWT_REFRESH_SECRET;

    if (!accessTokenSecret || !refreshTokenSecret) {
        throw new Error('JWT secrets are not defined in environment variables');
    }

    return { accessTokenSecret, refreshTokenSecret };
};


// Single element of tripSegments array because tripSegments is an array of TripSegment, so [number] gets one element type
type TripSegmentItem = TripSegments['tripSegments'][number];

// Sort tripSegments by following the nextSegmentId chain
export function sortTripSegmentsByChain(segments: TripSegmentItem[]): TripSegmentItem[] {
    if (segments.length <= 1) {
        return segments;
    }

    const segmentMap = new Map(segments.map(seg => [seg.segmentId, seg]));

    // Find the first segment (not referenced by any nextSegmentId)
    const referencedSegmentIds = new Set(
        segments.map(seg => seg.nextSegmentId)
                .filter((id): id is string => id !== null)
    );

    let currentSegment = segments.find(seg => !referencedSegmentIds.has(seg.segmentId));

    if (!currentSegment) {
        return segments;
    }

    // Follow the chain to push sorted segments
    const sortedSegments: TripSegmentItem[] = [];
    while (currentSegment) {
        sortedSegments.push(currentSegment);
        if (currentSegment.nextSegmentId) {
            currentSegment = segmentMap.get(currentSegment.nextSegmentId);
        } else {
            currentSegment = undefined;
        }
    }

    return sortedSegments;
}

type PathSegmentItem = PathWithSegments['pathSegments'][number];

// Sort pathSegments by following the nextSegmentId chain
export function sortPathSegmentsByChain(segments: PathSegmentItem[]): PathSegmentItem[] {
    if (segments.length <= 1) {
        return segments;
    }

    const segmentMap = new Map(segments.map(seg => [seg.segmentId, seg]));

    // Find the first segment (not referenced by any nextSegmentId)
    const referencedSegmentIds = new Set(
        segments.map(seg => seg.nextSegmentId)
                .filter((id): id is string => id !== null)
    );

    let currentSegment = segments.find(seg => !referencedSegmentIds.has(seg.segmentId));

    if (!currentSegment) {
        return segments;
    }

    // Follow the chain to push sorted segments
    const sortedSegments: PathSegmentItem[] = [];
    while (currentSegment) {
        sortedSegments.push(currentSegment);
        if (currentSegment.nextSegmentId) {
            currentSegment = segmentMap.get(currentSegment.nextSegmentId);
        } else {
            currentSegment = undefined;
        }
    }

    return sortedSegments;
}

export function clamp(value: number, min: number, max: number) {
    return Math.max(min, Math.min(max, value));
}

export function mapScoreToStatus(score: number) {
    if (score >= 4.5) {
        return 'OPTIMAL';
    }
    if (score >= 3.5) {
        return 'MEDIUM';
    }
    if (score >= 2.5) {
        return 'SUFFICIENT';
    }
    if (score >= 1.5) {
        return 'REQUIRES_MAINTENANCE';
    }
    return 'CLOSED';
}
