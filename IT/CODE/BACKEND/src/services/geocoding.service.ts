import { Coordinates } from "../types/index.js";
import { BadRequestError, InternalServerError } from "../errors/index.js";
import logger from "../utils/logger";

const NOMINATIM_URL = "https://nominatim.openstreetmap.org/search";

type NominatimResult = {
    lat: string;
    lon: string;
};

export async function geocodeAddress(query: string): Promise<Coordinates> {
    const trimmed = query.trim();
    if (!trimmed) {
        throw new BadRequestError("Address is required", "MISSING_ADDRESS");
    }

    const params = new URLSearchParams({
        format: "jsonv2",
        limit: "1",
        q: trimmed,
    });
    const url = `${NOMINATIM_URL}?${params.toString()}`;

    try {
        const res = await fetch(url, {
            headers: {
                Accept: "application/json",
                "Accept-Language": "it",
                "User-Agent": "bbp-backend",
            },
        });

        if (!res.ok) {
            logger.error({ status: res.status, url }, "Nominatim error");
            throw new InternalServerError("Failed to geocode address", "GEOCODE_ERROR");
        }

        const data = (await res.json()) as NominatimResult[];
        const first = data?.[0];
        if (!first) {
            throw new BadRequestError("Address not found", "GEOCODE_NOT_FOUND");
        }

        const lat = Number(first.lat);
        const lng = Number(first.lon);
        if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
            throw new BadRequestError("Invalid geocoding result", "GEOCODE_INVALID");
        }

        return { lat, lng };
    } catch (error) {
        logger.error({ error, query }, "Geocoding failed");
        if (error instanceof BadRequestError || error instanceof InternalServerError) {
            throw error;
        }
        throw new InternalServerError("Failed to geocode address", "GEOCODE_FETCH_ERROR");
    }
}
