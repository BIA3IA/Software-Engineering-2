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
reportRouter.post(
    "/confirm",
    verifyAccessToken,
    reportManager.confirmReport.bind(reportManager)
);
reportRouter.get(
    "/trip/:tripId",
    verifyAccessToken,
    reportManager.getReportsByTrip.bind(reportManager)
);
reportRouter.get(
    "/path-segment/:pathSegmentId",
    verifyAccessToken,
    reportManager.getReportsByPathSegment.bind(reportManager)
);

export { reportRouter };