import { Router } from "express";
import { statsManager } from "../../managers/stat/index.js";
import { verifyAccessToken, validate } from "../../middleware/index.js";
import { getTripStatsSchema } from "../../schemas/stat.schema.js";

const statsRouter = Router();

/**
 * UC22: View Overall Statistics
 * Retrieves aggregated averages across all user trips.
 * Uses the state-aware recomputation strategy.
 */
statsRouter.get(
    "/overall",
    verifyAccessToken,
    statsManager.getOverallStats.bind(statsManager)
);

export { statsRouter };
