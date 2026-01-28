import { Coordinates } from "../types/index";
import { BadRequestError, InternalServerError } from "../errors/index";
import logger from "../utils/logger";
import { fetchWithTimeout } from "../utils/fetch";

const OSRM_BASE_URL = process.env.OSRM_BASE_URL ?? "http://localhost:5000";
const DEFAULT_PROFILE = "cycling";
const OSRM_TIMEOUT_MS = Number(process.env.OSRM_TIMEOUT_MS) || 8000;

type OsrmRouteResponse = {
    code: string;
    message?: string;
    routes?: Array<{
        geometry?: {
            coordinates?: [number, number][];
        };
    }>;
};

function buildCoordinateString(coordinates: Coordinates[]) {
    return coordinates.map((point) => `${point.lng},${point.lat}`).join(";");
}

export async function snapToRoad(coordinates: Coordinates[]): Promise<Coordinates[]> {
    if (coordinates.length < 2) {
        throw new BadRequestError("At least two coordinates are required", "MISSING_COORDINATES");
    }

    const coordString = buildCoordinateString(coordinates);
    const params = new URLSearchParams({
        overview: "full",
        geometries: "geojson",
        steps: "false",
        annotations: "false",
    });
    const url = `${OSRM_BASE_URL}/route/v1/${DEFAULT_PROFILE}/${coordString}?${params.toString()}`;

    try {
        const res = await fetchWithTimeout(url, { timeoutMs: OSRM_TIMEOUT_MS });
        if (!res.ok) {
            logger.error({ status: res.status, url }, "OSRM route error");
            throw new InternalServerError("Failed to snap path", "OSRM_ERROR");
        }

        const data = (await res.json()) as OsrmRouteResponse;
        if (data.code !== "Ok") {
            logger.error({ data, url }, "OSRM returned non-ok response");
            throw new InternalServerError("Failed to snap path", "OSRM_RESPONSE_ERROR");
        }

        const coordinatesList = data.routes?.[0]?.geometry?.coordinates;
        if (!coordinatesList || coordinatesList.length === 0) {
            throw new BadRequestError("No route found for provided coordinates", "NO_ROUTE");
        }

        return coordinatesList.map(([lng, lat]) => ({ lat, lng }));
    } catch (error) {
        if (error instanceof Error && error.name === "AbortError") {
            logger.error({ url }, "OSRM request timed out");
            throw new InternalServerError("OSRM service timed out", "OSRM_TIMEOUT");
        }
        logger.error({ error }, "Failed to fetch OSRM route");
        if (error instanceof BadRequestError || error instanceof InternalServerError) {
            throw error;
        }
        throw new InternalServerError("Failed to snap path", "OSRM_FETCH_ERROR");
    }
}
