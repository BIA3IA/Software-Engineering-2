import { Router } from "express";
import { reportManager } from "../../managers/report/report.manager.js";
import { createTripSchema } from "../../schemas/index.js";
import { validate, verifyAccessToken } from "../../middleware/index.js";

const reportRouter = Router();

reportRouter.post(
    "/createReport",
    verifyAccessToken,
    reportManager.createReport.bind(reportManager)
);

export { reportRouter };