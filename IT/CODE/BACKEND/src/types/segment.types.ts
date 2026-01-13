import { Coordinates } from "./index";

export interface Segment {
    segmentId: string;
    status: string;
    polylineCoordinates: Coordinates[];
    createdAt: Date;
}