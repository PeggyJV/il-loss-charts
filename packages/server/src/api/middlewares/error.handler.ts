import { Request, Response, NextFunction } from 'express';
import { CelebrateError } from 'celebrate';

import { CodedHTTPError, HTTPError, ValidationError } from 'api/util/errors';

const internalError = 'Internal Server Error';

// eslint-disable-next-line no-unused-vars, no-shadow
export default function errorHandler(
    err: Error | HTTPError | CelebrateError,
    req: Request,
    res: Response,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    next: NextFunction
): void {
    // continue if no error
    if (err == null) { next(); }

    // Coded HTTP Errors
    else if (err instanceof CodedHTTPError) {
        // respond with error json body
        res.status(err.status).json({
            error: err.toObject(),
        })
    }

    // Validation Errors via Celebrate
    else if (err instanceof CelebrateError) {
        // Get Celebrate Validation Error Text
        const error = err.details.get('query') ?? err.details.get('params');
        const details = error?.message ?? '';

        // Clone a validation error so we can set details
        const validationError = ValidationError.clone();
        validationError.setDetails(details);

        // respond with error json body
        res.status(400).json({ error: validationError.toObject() });
    }

    // only forward errors that we intentionally created
    else if (err instanceof HTTPError) {
        res.status(err.status).json({ error: err.message });
    }

    // all other errors should be a 500
    else {
        res.status(500).json({ error: internalError });

        // let us know about these 500s
        console.warn(`Internal Server Error: ${err.stack ?? err.message}`);
    }
}