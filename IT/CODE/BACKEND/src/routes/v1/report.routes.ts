import { Router } from "express";
import { reportManager } from "../../managers/report/index.js";
import { verifyAccessToken, validate } from "../../middleware/index.js";
import {
    confirmReportParamsSchema,
    confirmReportSchema,
    createReportSchema,
    getReportsByPathSchema,
} from "../../schemas/index.js";

const reportRouter = Router();

reportRouter.post(
    "/",
    verifyAccessToken,
    validate(createReportSchema, 'body'),
    reportManager.createReport.bind(reportManager)
);
reportRouter.post(
    "/:reportId/confirm",
    verifyAccessToken,
    validate(confirmReportParamsSchema, 'params'),
    validate(confirmReportSchema, 'body'),
    reportManager.confirmReport.bind(reportManager)
);
reportRouter.get(
    "/",
    validate(getReportsByPathSchema, 'query'),
    reportManager.getReportsByPath.bind(reportManager)
);

export { reportRouter };
