import { describe, expect, test, jest, beforeEach } from "@jest/globals";
import { Request, Response, NextFunction } from "express";
import { errorHandler, notFoundHandler } from "../../middleware/error.handler";
import { BadRequestError, UnauthorizedError, NotFoundError, InternalServerError, ConflictError, ForbiddenError } from "../../errors/app.errors";
import logger from "../../utils/logger";

describe("Testing error handler middleware", () => {

    jest.spyOn(logger, 'warn').mockImplementation(() => {});
    jest.spyOn(logger, 'error').mockImplementation(() => {});
    jest.spyOn(logger, 'info').mockImplementation(() => {});
    jest.spyOn(logger, 'debug').mockImplementation(() => {});

    const mockRequest = () => ({
        method: 'GET',
        originalUrl: '/api/test',
        body: {},
        params: {},
        query: {}
    }) as unknown as Request;

    const mockResponse = () => ({
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockReturnThis()
    }) as unknown as Response;

    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe("Testing custom errors", () => {

        test("Should handle BadRequestError correctly", () => {
            const error = new BadRequestError("Something invalid", "INVALID_INPUT");
            const req = mockRequest();
            const res = mockResponse();
            const next = jest.fn() as NextFunction;

            errorHandler(error, req, res, next);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({
                success: false,
                error: { message: "Something invalid", code: "INVALID_INPUT" }
            });
            expect(logger.warn).toHaveBeenCalled();
            expect(next).not.toHaveBeenCalled();
        });

        test("Should handle BadRequestError default code correctly", () => {
            const error = new BadRequestError("Bad request");
            const req = mockRequest();
            const res = mockResponse();
            const next = jest.fn() as NextFunction;

            errorHandler(error, req, res, next);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({
                success: false,
                error: { message: "Bad request", code: "BAD_REQUEST" }
            });
            expect(logger.warn).toHaveBeenCalled();
        });

        test("Should handle UnauthorizedError correctly", () => {
            const error = new UnauthorizedError("Unauthorized", "USER_NOT_AUTHENTICATED");
            const req = mockRequest();
            const res = mockResponse();
            const next = jest.fn() as NextFunction;

            errorHandler(error, req, res, next);

            expect(res.status).toHaveBeenCalledWith(401);
            expect(res.json).toHaveBeenCalledWith({
                success: false,
                error: { message: "Unauthorized", code: "USER_NOT_AUTHENTICATED" }
            });
            expect(logger.warn).toHaveBeenCalled();
        });

        test("Should handle UnauthorizedError default code correctly", () => {
            const error = new UnauthorizedError("Unauthorized");
            const req = mockRequest();
            const res = mockResponse();
            const next = jest.fn() as NextFunction;

            errorHandler(error, req, res, next);

            expect(res.status).toHaveBeenCalledWith(401);
            expect(res.json).toHaveBeenCalledWith({
                success: false,
                error: { message: "Unauthorized", code: "UNAUTHORIZED" }
            });
        });

        test("Should handle ForbiddenError correctly", () => {
            const error = new ForbiddenError("Forbidden", "ACCESS_DENIED");
            const req = mockRequest();
            const res = mockResponse();
            const next = jest.fn() as NextFunction;

            errorHandler(error, req, res, next);

            expect(res.status).toHaveBeenCalledWith(403);
            expect(res.json).toHaveBeenCalledWith({
                success: false,
                error: { message: "Forbidden", code: "ACCESS_DENIED" }
            });
        });

        test("Should handle ForbiddenError default code correctly", () => {
            const error = new ForbiddenError("Forbidden");
            const req = mockRequest();
            const res = mockResponse();
            const next = jest.fn() as NextFunction;

            errorHandler(error, req, res, next);

            expect(res.status).toHaveBeenCalledWith(403);
            expect(res.json).toHaveBeenCalledWith({
                success: false,
                error: { message: "Forbidden", code: "FORBIDDEN" }
            });
        });

        test("Should handle NotFoundError correctly", () => {
            const error = new NotFoundError("Not found", "RESOURCE_NOT_FOUND");
            const req = mockRequest();
            const res = mockResponse();
            const next = jest.fn() as NextFunction;

            errorHandler(error, req, res, next);

            expect(res.status).toHaveBeenCalledWith(404);
            expect(res.json).toHaveBeenCalledWith({
                success: false,
                error: { message: "Not found", code: "RESOURCE_NOT_FOUND" }
            });
        });

        test("Should handle NotFoundError default code correctly", () => {
            const error = new NotFoundError("Not found");
            const req = mockRequest();
            const res = mockResponse();
            const next = jest.fn() as NextFunction;

            errorHandler(error, req, res, next);

            expect(res.status).toHaveBeenCalledWith(404);
            expect(res.json).toHaveBeenCalledWith({
                success: false,
                error: { message: "Not found", code: "NOT_FOUND" }
            });
        });

        test("Should handle ConflictError correctly", () => {
            const error = new ConflictError("Conflict occurred", "RESOURCE_CONFLICT");
            const req = mockRequest();
            const res = mockResponse();
            const next = jest.fn() as NextFunction;

            errorHandler(error, req, res, next);

            expect(res.status).toHaveBeenCalledWith(409);
            expect(res.json).toHaveBeenCalledWith({
                success: false,
                error: { message: "Conflict occurred", code: "RESOURCE_CONFLICT" }
            });
        });

        test("Should handle ConflictError default code correctly", () => {
            const error = new ConflictError("Conflict occurred");
            const req = mockRequest();
            const res = mockResponse();
            const next = jest.fn() as NextFunction;

            errorHandler(error, req, res, next);

            expect(res.status).toHaveBeenCalledWith(409);
            expect(res.json).toHaveBeenCalledWith({
                success: false,
                error: { message: "Conflict occurred", code: "CONFLICT" }
            });
        });

        test("Should handle InternalServerError correctly", () => {
            const error = new InternalServerError("Internal error", "SERVER_ERROR");
            const req = mockRequest();
            const res = mockResponse();
            const next = jest.fn() as NextFunction;

            errorHandler(error, req, res, next);

            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith({
                success: false,
                error: { message: "Internal error", code: "SERVER_ERROR" }
            });
        });

        test("Should handle InternalServerError default code correctly", () => {
            const error = new InternalServerError("Internal error");
            const req = mockRequest();
            const res = mockResponse();
            const next = jest.fn() as NextFunction;

            errorHandler(error, req, res, next);

            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith({
                success: false,
                error: { message: "Internal error", code: "INTERNAL_SERVER_ERROR" }
            });
        });
    });

    describe("Testing unexpected errors", () => {

        test("Should handle generic Error with generic response", () => {
            const error = new Error("Unexpected failure");
            const req = mockRequest();
            const res = mockResponse();
            const next = jest.fn() as NextFunction;

            errorHandler(error, req, res, next);

            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith({
                success: false,
                error: { message: "Something went wrong", code: "INTERNAL_ERROR" }
            });
            expect(logger.error).toHaveBeenCalled();
            expect(next).not.toHaveBeenCalled();
        });

    });

    describe("Testing notFoundHandler", () => {

        test("Should handle 404 for undefined routes", () => {
            const req = mockRequest();
            const res = mockResponse();

            notFoundHandler(req, res);

            expect(res.status).toHaveBeenCalledWith(404);
            expect(res.json).toHaveBeenCalledWith({
                success: false,
                error: {
                    message: `Route ${req.method} ${req.originalUrl} not found`,
                    code: "ROUTE_NOT_FOUND"
                }
            });
            expect(logger.warn).toHaveBeenCalled();
        });
    });
});