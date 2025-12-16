import { Request, Response, NextFunction } from 'express';
import { fetchAndAggregateWeatherData } from '../../services/index';
import { queryManager } from '../query/index';
import { Coordinates, TripSegments, WeatherData } from '../../types/index';
import { NotFoundError, BadRequestError } from '../../errors/index';
import logger from '../../utils/logger';


export class WeatherManager {

    async enrichTripWithWeather(trip: TripSegments): Promise<WeatherData> {
        //logger.debug({ tripId: trip.tripId }, 'Enriching trip with weather data');

        const allCoordinates: Coordinates[] = [];

        // Add origin
        if (trip.origin) {
            allCoordinates.push(trip.origin);
        }

        // Add coordinates from all segments
        for (const tripSegment of trip.tripSegments) {
            const polyline = tripSegment.segment.polylineCoordinates;
            if (Array.isArray(polyline)) {
                allCoordinates.push(...polyline);
            }
        }

        // Add destination
        if (trip.destination) {
            allCoordinates.push(trip.destination);
        }

        //logger.debug({ tripId: trip.tripId, coordinateCount: allCoordinates.length }, 'Extracted coordinates from trip');

        if (allCoordinates.length === 0) {
            throw new BadRequestError('Trip has no coordinates', 'NO_COORDINATES');
        }

        const tripWeather = await fetchAndAggregateWeatherData(allCoordinates);

        await queryManager.updateTripWeather(trip.tripId, tripWeather);

        //logger.info({ tripId: trip.tripId, sampleCount: tripWeather.sampleCount }, 'Trip enriched with weather data');

        return tripWeather;
    }

    async enrichTrip(req: Request, res: Response, next: NextFunction) {
        try {
            const { tripId } = req.params;
            const userId = req.user?.userId;

            if (!tripId) {
                return next(new BadRequestError('Trip ID is required', 'MISSING_TRIP_ID'));
            }

            const trip = await queryManager.getTripById(tripId);

            if (!trip) {
                return next(new NotFoundError('Trip not found', 'TRIP_NOT_FOUND'));
            }

            if (trip.userId !== userId) {
                return next(new NotFoundError('Trip not found', 'TRIP_NOT_FOUND'));
            }

            const tripWeather = await this.enrichTripWithWeather(trip);

            res.json({
                success: true,
                data: tripWeather,
            });

        } catch (error) {
            next(error);
        }
    }

    // Get weather data for an existing trip
    async getTripWeather(req: Request, res: Response, next: NextFunction) {
        try {
            const { tripId } = req.params;
            const userId = req.user?.userId;

            if (!tripId) {
                return next(new BadRequestError('Trip ID is required', 'MISSING_TRIP_ID'));
            }

            const trip = await queryManager.getTripById(tripId);

            if (!trip) {
                return next(new NotFoundError('Trip not found', 'TRIP_NOT_FOUND'));
            }

            if (trip.userId !== userId) {
                return next(new NotFoundError('Trip not found', 'TRIP_NOT_FOUND'));
            }

            if (!trip.weather) {
                return next(new NotFoundError('Weather data not available for this trip', 'WEATHER_NOT_FOUND'));
            }

            res.json({
                success: true,
                data: trip.weather,
            });

        } catch (error) {
            next(error);
        }
    }
}

export const weatherManager = new WeatherManager();