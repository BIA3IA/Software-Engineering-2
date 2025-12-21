import { WeatherData, OpenMeteoWeather, Coordinates, PointWeatherData } from "../types/index";
import { InternalServerError } from "../errors/index";
import logger from "../utils/logger";
import { getWeatherDescription } from "./wmo";

// This service must fetch weather data from OpenMeteo for given coordinates
// and aggregate it to produce TripWeather data. The aggregation is made by taking
// uniformly spaced samples along the trip coordinates to a maximum of x samples. Remember that
// the more samples we take, the more accurate the weather data will be, but we must be careful
// to not overload the API. Once data is fetched, it is aggregated by averaging all the parameters
// and taking the most frequent weather description (Sunny, Cloudy, Rainy...)

const OPENMETEO_BASE_URL = "https://api.open-meteo.com/v1/forecast";

const SAMPLING_CONFIG = {
    SHORT_ROUTE_KM: 10,      // Short routes: start and end only
    MEDIUM_ROUTE_KM: 50,     // Medium routes: start, middle, end
    SAMPLE_INTERVAL_KM: 5,   // Every how many km to sample for long routes
    MAX_SAMPLES: 10,         // Maximum number of samples
};

// Calculate the distance between two coordinates (Haversine formula)(https://github.com/thealmarques/haversine-distance-typescript.git)
function calculateDistance(from: Coordinates, to: Coordinates): number {
    var radius = 6371; // km

    //Convert latitude and longitude to radians
    const deltaLatitude = (to.lat - from.lat) * Math.PI / 180;
    const deltaLongitude = (to.lng - from.lng) * Math.PI / 180;

    const halfChordLength = Math.cos(
        from.lat * Math.PI / 180) * Math.cos(to.lat * Math.PI / 180)
        * Math.sin(deltaLongitude / 2) * Math.sin(deltaLongitude / 2)
        + Math.sin(deltaLatitude / 2) * Math.sin(deltaLatitude / 2);

    const angularDistance = 2 * Math.atan2(Math.sqrt(halfChordLength), Math.sqrt(1 - halfChordLength));

    return radius * angularDistance;
}

// Calculate the total distance of the route
function getTotalDistance(coordinates: Coordinates[]): number {
    let total = 0;
    for (let i = 1; i < coordinates.length; i++) {
        total += calculateDistance(coordinates[i - 1], coordinates[i]);
    }
    return total;
}

// Select sampling points based on route length
export function sampleCoordinates(coordinates: Coordinates[]): Coordinates[] {
    if (coordinates.length === 0) return [];
    if (coordinates.length === 1) return coordinates;

    const totalDistance = getTotalDistance(coordinates);
    const firstPoint = coordinates[0];
    const lastPoint = coordinates[coordinates.length - 1];
    
    // logger.debug({ 
    //     totalPoints: coordinates.length, 
    //     distanceKm: totalDistance.toFixed(1) 
    // }, "Analyzing route for sampling");

    // Short route (<10km): start and end only
    if (totalDistance < SAMPLING_CONFIG.SHORT_ROUTE_KM) {
        // logger.debug("Short route: sampling start and end");
        return [firstPoint, lastPoint];
    }

    // Medium route (10-50km): start, middle, end
    if (totalDistance < SAMPLING_CONFIG.MEDIUM_ROUTE_KM) {
        const midPoint = Math.floor(coordinates.length / 2);
        // logger.debug("Medium route: sampling start, middle, end");
        return [firstPoint, coordinates[midPoint], lastPoint];
    }

    // Long route (>50km): sample every ~5km, max 10 points
    const sampled: Coordinates[] = [firstPoint];
    let lastDistance = 0;

    for (let i = 1; i < coordinates.length - 1; i++) {
        lastDistance += calculateDistance(coordinates[i - 1], coordinates[i]);

        if (lastDistance >= SAMPLING_CONFIG.SAMPLE_INTERVAL_KM) {
            sampled.push(coordinates[i]);
            lastDistance = 0;

            // Stop if we reached the maximum (leaving space for the last point)
            if (sampled.length >= SAMPLING_CONFIG.MAX_SAMPLES - 1){
                break;
            }
        }
    }

    sampled.push(lastPoint);

    // logger.debug({
    //     distanceKm: totalDistance.toFixed(1),
    //     sampledPoints: sampled.length 
    // }, "Long route: sampled by distance");

    return sampled;
}

// Retrieve weather data from OpenMeteo for a single coordinate
export async function fetchWeatherForCoordinates(coord: Coordinates): Promise<PointWeatherData> {
    const params = new URLSearchParams({
        latitude: coord.lat.toString(),
        longitude: coord.lng.toString(),
        // 15 minute intervals for a recent weather model data with "current" parameter
        current: [
            "temperature_2m",
            "relative_humidity_2m",
            "apparent_temperature",
            "precipitation",
            "weather_code",
            "pressure_msl",
            "wind_speed_10m",
            "wind_direction_10m",
        ].join(","),
        timezone: "auto",
    });

    const url = `${OPENMETEO_BASE_URL}?${params}`;

    try {
        const response = await fetch(url);

        if (!response.ok) {
            logger.error({ status: response.status, coord }, "OpenMeteo API error");
            throw new InternalServerError("Failed to fetch weather data", "WEATHER_API_ERROR");
        }

        const data = await response.json() as OpenMeteoWeather;
        const current = data.current;

        return {
            temperature: current.temperature_2m,
            apparentTemperature: current.apparent_temperature,
            humidity: current.relative_humidity_2m,
            windSpeed: current.wind_speed_10m,
            windDirection: current.wind_direction_10m,
            pressure: current.pressure_msl,
            weatherDescription: getWeatherDescription(current.weather_code),
            precipitation: current.precipitation,
        };

    } catch (error) {
        logger.error({ error, coord }, "Failed to fetch weather data");
        throw new InternalServerError("Failed to fetch weather data", "WEATHER_FETCH_ERROR");
    }
}

// Find the most frequent weather conditions
function getMostFrequentWeather(descriptions: string[]): string {
    if (descriptions.length === 0) {
        return 'Unknown';
    }

    const counts: { [key: string]: number } = {};
    let mostFrequent = descriptions[0];
    let maxCount = 0;

    // Count occurrences
    for (const desc of descriptions) {
        if (!counts[desc]) {
            counts[desc] = 0;
        }
        counts[desc]++;

        // Update most frequent
        if (counts[desc] > maxCount) {
            maxCount = counts[desc];
            mostFrequent = desc;
        }
    }

    return mostFrequent;
}

// Aggregate weather data from multiple points into a single TripWeather
export function aggregateWeatherData(points: PointWeatherData[]): WeatherData {
    // If no weather data is available, return default values
    if (points.length === 0) {
        return {
            averageTemperature: 0,
            averageApparentTemperature: 0,
            averageHumidity: 0,
            averageWindSpeed: 0,
            averagePressure: 0,
            totalPrecipitation: 0,
            dominantWeatherDescription: "Unknown",
            sampleCount: 0,
            fetchedAt: new Date().toISOString(),
        };
    }

    const count = points.length;

    // Calculate the averages for the weather parameters using reduce
    // Reduce adds all the values, then divides by the number of points
    const avgTemp = points.reduce((sum, w) => sum + w.temperature, 0) / count;
    const avgApparentTemp = points.reduce((sum, w) => sum + w.apparentTemperature, 0) / count;
    const avgHumidity = points.reduce((sum, w) => sum + w.humidity, 0) / count;
    const avgWindSpeed = points.reduce((sum, w) => sum + w.windSpeed, 0) / count;
    const avgPressure = points.reduce((sum, w) => sum + w.pressure, 0) / count;

    // For precipitation, we sum the values (we don't average them, or we would underestimate total rainfall maybe)
    const totalPrecip = points.reduce((sum, w) => sum + w.precipitation, 0);

    // Extracts all weather descriptions in another array
    const descriptions = points.map(w => w.weatherDescription);

    return {
        // Round to 1 decimal place (e.g. 23.456 -> 23.5) for readability
        averageTemperature: Math.round(avgTemp * 10) / 10,
        averageApparentTemperature: Math.round(avgApparentTemp * 10) / 10,
        // Humidity is a percentage, round up to a whole number
        averageHumidity: Math.round(avgHumidity),
        averageWindSpeed: Math.round(avgWindSpeed * 10) / 10,
        averagePressure: Math.round(avgPressure * 10) / 10,
        totalPrecipitation: Math.round(totalPrecip * 10) / 10,
        // Find the most frequent weather condition among the sampled points
        dominantWeatherDescription: getMostFrequentWeather(descriptions),
        sampleCount: count,
        fetchedAt: new Date().toISOString(),
    };
}

// Main function to fetch and aggregate weather data for a trip. Must return a Promise because of async fetches.
export async function fetchAndAggregateWeatherData(coordinates: Coordinates[]): Promise<WeatherData> {
    const sampledCoords = sampleCoordinates(coordinates);

    // logger.info({ 
    //     totalPoints: coordinates.length, 
    //     sampledPoints: sampledCoords.length 
    // }, "Fetching weather for trip");

    if (sampledCoords.length === 0) {
        logger.warn("No coordinates to fetch weather for");
        return aggregateWeatherData([]);
    }

    // Fetch weather for all points in parallel
    const weatherPromises = sampledCoords.map(coord => 
        fetchWeatherForCoordinates(coord).catch(error => {
            logger.warn({ error, coord }, "Failed to fetch weather for coordinate");
            return null;
        })
    );

    const results = await Promise.all(weatherPromises);

    // Filter valid results to exclude any nulls from failed fetches
    const validResults = results.filter((r): r is PointWeatherData => r !== null);

    // logger.info({ 
    //     requested: sampledCoords.length, 
    //     successful: validResults.length 
    // }, "Weather fetch completed");

    return aggregateWeatherData(validResults);
}