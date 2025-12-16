import { describe, test, expect, jest, beforeEach } from "@jest/globals";
import { Request, Response } from "express";
import Joi from 'joi';
import { validate } from "../../middleware/validator";

describe("Testing validate middleware", () => {

    const mockRequest = () => ({
        body: {},
        query: {},
        params: {}
    }) as unknown as Request;

    const mockResponse = () => ({}) as Response;

    beforeEach(() => {
        jest.clearAllMocks();
    });

    test("Should validate body data and call next", async () => {
        const schema = Joi.object({
            email: Joi.string().email().required(),
            password: Joi.string().min(8).required(),
        });

        const req = mockRequest();
        req.body = { 
            email: "test@example.com", 
            password: "password123" 
        };

        const res = mockResponse();
        const next = jest.fn();

        await validate(schema, "body")(req, res, next);

        expect(req.body).toEqual({ 
            email: "test@example.com", 
            password: "password123" 
        });
        expect(next).toHaveBeenCalledWith();
    });

    test("Should call next with BadRequestError for invalid data", async () => {
        const schema = Joi.object({
            email: Joi.string().email().required(),
            password: Joi.string().min(8).required()
        });

        const req = mockRequest();
        req.body = { 
            email: "invalid-email", 
            password: "123" 
        };

        const res = mockResponse();
        const next = jest.fn();

        await validate(schema)(req, res, next);

        expect(next).toHaveBeenCalledWith(
            expect.objectContaining({
                statusCode: 400,
                code: "VALIDATION_ERROR",
            })
        );
    });

    test("Should validate query params when target is query", async () => {
        const schema = Joi.object({
            page: Joi.number().required()
        });

        const req = mockRequest();
        req.query = { page: "1" } as any;

        const res = mockResponse();
        const next = jest.fn();

        await validate(schema, "query")(req, res, next);

        expect(next).toHaveBeenCalledWith();
        expect(req.query).toHaveProperty("page", 1);
    });

    test("Should validate route params when target is params", async () => {
        const schema = Joi.object({
            id: Joi.string().required()
        });

        const req = mockRequest();
        req.params = { 
            id: "abc123" 
        };

        const res = mockResponse();
        const next = jest.fn();

        await validate(schema, "params")(req, res, next);

        expect(next).toHaveBeenCalledWith();
        expect(req.params).toHaveProperty("id", "abc123");
    });

    test("Should call next with BadRequestError for missing required fields", async () => {
        const schema = Joi.object({
            email: Joi.string().email().required(),
            password: Joi.string().min(8).required(),
        });

        const req = mockRequest();
        req.body = { 
            email: "test@example.com" 
        };

        const res = mockResponse();
        const next = jest.fn();

        await validate(schema)(req, res, next);

        expect(next).toHaveBeenCalledWith(
            expect.objectContaining({
                statusCode: 400,
                code: "VALIDATION_ERROR",
            })
        );
    });
});