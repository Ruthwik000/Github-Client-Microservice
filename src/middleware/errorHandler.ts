import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import logger from '../utils/logger';

export class AppError extends Error {
    constructor(
        public statusCode: number,
        public message: string,
        public isOperational: boolean = true
    ) {
        super(message);
        Object.setPrototypeOf(this, AppError.prototype);
    }
}

export const errorHandler = (
    err: Error | AppError,
    req: Request,
    res: Response,
    _next: NextFunction
) => {
    if (err instanceof AppError) {
        logger.error(
            {
                error: err.message,
                statusCode: err.statusCode,
                path: req.path,
                method: req.method,
            },
            'Application error'
        );

        return res.status(err.statusCode).json({
            error: {
                message: err.message,
                statusCode: err.statusCode,
            },
        });
    }

    // Zod stuff
    if (err instanceof z.ZodError) {
        logger.error({ error: err.errors, path: req.path }, 'Validation error');

        return res.status(400).json({
            error: {
                message: 'Validation error',
                statusCode: 400,
                details: err.errors,
            },
        });
    }

    // i dunno which errors
    logger.error(
        {
            error: err.message,
            stack: err.stack,
            path: req.path,
            method: req.method,
        },
        'Unexpected error'
    );

    return res.status(500).json({
        error: {
            message: 'Internal server error',
            statusCode: 500,
        },
    });
};

export const notFoundHandler = (req: Request, res: Response) => {
    res.status(404).json({
        error: {
            message: `Route ${req.method} ${req.path} not found`,
            statusCode: 404,
        },
    });
};

export const asyncHandler = (
    fn: (req: Request, res: Response, next: NextFunction) => Promise<any>
) => {
    return (req: Request, res: Response, next: NextFunction) => {
        Promise.resolve(fn(req, res, next)).catch(next);
    };
};
