import { Request, Response, NextFunction } from 'express';
import { HTTPError } from 'api/util/errors';

// eslint-disable-next-line no-unused-vars, no-shadow
export default function errorHandler(
    err: HTTPError,
    req: Request,
    res: Response,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    next: NextFunction
): void {
    const errors = [{ message: err.message }];
    res.status(err.status || 500).json({ errors });
}
