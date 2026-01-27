import { Router } from "express";
import { reportManager } from "../../managers/report/index.js";
import { verifyAccessToken } from "../../middleware/index.js";

const reportRouter = Router();

reportRouter.post(
    "/",
    verifyAccessToken,
    reportManager.createReport.bind(reportManager)
);
reportRouter.post(
    "/:reportId/confirm",
    verifyAccessToken,
    reportManager.confirmReport.bind(reportManager)
);
reportRouter.get(
    "/",
    reportManager.getReportsByPath.bind(reportManager)
);

export { reportRouter };
