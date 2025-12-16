import { Router } from 'express';
import { weatherManager } from '../../managers/weather/index.js';
import { verifyAccessToken } from '../../middleware/jwt.auth.js';

const weatherRouter = Router();

// All weather endpoints require authentication
weatherRouter.use(verifyAccessToken);

weatherRouter.post('/trips/:tripId/enrich', weatherManager.enrichTrip.bind(weatherManager));
weatherRouter.get('/trips/:tripId', weatherManager.getTripWeather.bind(weatherManager));

export { weatherRouter };