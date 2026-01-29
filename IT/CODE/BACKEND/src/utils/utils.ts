import { PathWithSegments, TripSegments, PATH_STATUS_SCORE_MAP } from '../types/index';
import {
    REPORT_ALPHA,
    REPORT_BETA,
    REPORT_MIN_RELIABILITY,
    REPORT_MAX_RELIABILITY,
    REPORT_FRESHNESS_HALF_LIFE_MIN
} from "../constants/appConfig.js";

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

type PathSegmentStatusItem = { status: keyof typeof PATH_STATUS_SCORE_MAP };

export function computePathStatusFromSegments(segments: PathSegmentStatusItem[]) {
    if (segments.length === 0) {
        return 'OPTIMAL';
    }

    const totalStatusScore = segments.reduce((sum, segment) => {
        const statusScore = PATH_STATUS_SCORE_MAP[segment.status] || 0;
        return sum + statusScore;
    }, 0);

    const averageStatusScore = totalStatusScore / segments.length;
    return mapScoreToStatus(averageStatusScore);
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

const computeFreshness = (date: Date, now: Date) => {
    const ageMinutes = Math.max(0, (now.getTime() - date.getTime()) / 60000);
    return Math.pow(2, -ageMinutes / REPORT_FRESHNESS_HALF_LIFE_MIN);
};

export const computeReportSignals = (report: any, now: Date) => {
    let confirmedScore = 0;
    let rejectedScore = 0;

    if (report.status === 'REJECTED') {
        rejectedScore += computeFreshness(report.createdAt, now);
    } else if (report.status === 'CREATED' || report.status === 'CONFIRMED') {
        confirmedScore += computeFreshness(report.createdAt, now);
    }

    const rawReliability = 1 + REPORT_ALPHA * confirmedScore - REPORT_BETA * rejectedScore;
    const reliability = clamp(rawReliability, REPORT_MIN_RELIABILITY, REPORT_MAX_RELIABILITY);
    const freshness = computeFreshness(report.createdAt, now);

    return { reliability, freshness };
};
