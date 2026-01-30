import { Router } from "express";
import { tripManager } from "../../managers/trip/index.js";
import { createTripSchema, tripIdParamsSchema } from "../../schemas/index.js";
import { validate, verifyAccessToken } from "../../middleware/index.js";

const tripRouter = Router();

tripRouter.post(
    "/",
    verifyAccessToken,
    validate(createTripSchema, "body"),
    tripManager.createTrip.bind(tripManager)
);

tripRouter.get(
    "/",
    verifyAccessToken,
    tripManager.getTripsByUser.bind(tripManager)
);

tripRouter.delete(
    "/:tripId",
    verifyAccessToken,
    validate(tripIdParamsSchema, "params"),
    tripManager.deleteTrip.bind(tripManager)
);

export { tripRouter };
