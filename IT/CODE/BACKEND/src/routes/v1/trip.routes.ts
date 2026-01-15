import { Router } from "express";
import { tripManager } from "../../managers/trip/index.js";
import { createTripSchema } from "../../schemas/index.js";
import { validate, verifyAccessToken } from "../../middleware/index.js";

const tripRouter = Router();

tripRouter.post(
    "/create",
    verifyAccessToken,
    validate(createTripSchema, "body"),
    tripManager.createTrip.bind(tripManager)
);

tripRouter.get(
    "/my-trips",
    verifyAccessToken,
    tripManager.getTripsByUser.bind(tripManager)
);

tripRouter.delete(
    "/:tripId",
    verifyAccessToken,
    tripManager.deleteTrip.bind(tripManager)
);

export { tripRouter };