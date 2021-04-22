import { Request, Response, NextFunction } from 'express';
import { HTTPError } from 'api/util/errors';
import { CelebrateError } from 'celebrate';

const internalError = 'Internal Server Error';

// eslint-disable-next-line no-unused-vars, no-shadow
export default function errorHandler(
    err: Error | HTTPError | CelebrateError,
    req: Request,
    res: Response,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    next: NextFunction
): void {
    // continue
    if (err == null) next();

    if (err instanceof CelebrateError) {
        const details = err.details.get('query') ?? err.details.get('params');
        const error = `Validation Error: ${details?.message ?? ''}`;

        res.status(400).json({ error });
    }

    // only forward errors that we intentionally created
    if (err instanceof HTTPError) {
        res.status(err.status).json({ error: err.message });
    }

    // all other errors should be a 500
    res.status(500).json({ error: internalError });

    // let us know about these 500s
    console.warn(`Internal Server Error: ${err.stack ?? err.message}`);
}