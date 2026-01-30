import { Router } from "express";
import { statsManager } from "../../managers/stats/index.js";
import { verifyAccessToken } from "../../middleware/index.js";

const statsRouter = Router();

/**
 * UC22: View Overall Statistics
 * Retrieves aggregated averages across all user trips.
 * Uses the state-aware recomputation strategy.
 */
statsRouter.get(
    "/",
    verifyAccessToken,
    statsManager.getAllStats.bind(statsManager)
);

export { statsRouter };
