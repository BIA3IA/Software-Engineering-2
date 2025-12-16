// Weather-related type definitions for TypeScript type checking purposes

// Before aggregation of weather data
export interface PointWeatherData {
    temperature: number;
    apparentTemperature: number;
    humidity: number;
    windSpeed: number;
    windDirection: number;
    pressure: number;
    weatherDescription: string;
    precipitation: number;
}

// After aggregation of weather data for a trip
export interface WeatherData {
    averageTemperature: number; // in Celsius
    averageApparentTemperature: number; // in Celsius
    averageHumidity: number; // in percentage
    averageWindSpeed: number; // in km/h
    averagePressure: number; // in hPa
    totalPrecipitation: number; // in mm
    dominantWeatherDescription: string; // human-readable description
    sampleCount: number; // number of data points aggregated
    fetchedAt: string; // ISO timestamp of when data was fetched
}

// OpenMeteo API response (external API structure)
export interface OpenMeteoWeather {
    temperature_2m: number; // 2m above ground temperature
    relative_humidity_2m: number; // 2m above ground relative humidity
    apparent_temperature: number; // Feels like temperature
    precipitation: number; // Total precipitation
    weather_code: number; // WMO weather code
    pressure_msl: number; // Mean sea level pressure
    wind_speed_10m: number; // Wind speed at 10m above ground
    wind_direction_10m: number; // Wind direction at 10m above ground
}