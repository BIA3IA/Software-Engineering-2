import { Request, Response, NextFunction } from 'express';
import { ObjectSchema } from 'joi';
import { BadRequestError } from '../errors/index';

// Middleware to validate request data against a Joi schema. 
// Can validate req.body, req.query, or req.params based on the 'target' parameter.
// The validateAsync method validates the data asynchronously and returns the validated value or throws an error.

type Target = 'body' | 'query' | 'params';

export const validate = (schema: ObjectSchema, target: Target = 'body') =>
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            // Validate the specified part of the request against the provided schema. Abort early is set to false to collect all errors.
            const validated = await schema.validateAsync(req[target], {
                abortEarly: false,
                errors: { wrap: { label: false } }, // Disable quotes around labels in error messages
            });
            req[target] = validated;
            next();
        } catch (error: any) {
            // With mapping we extract all error messages from Joi and join them into a single string
            // Maybe useful for client feedback on what went wrong
            const message = error.details?.map((d: any) => d.message).join(', ') || 'Validation error';
            next(new BadRequestError(message, 'VALIDATION_ERROR'));
        }
    };