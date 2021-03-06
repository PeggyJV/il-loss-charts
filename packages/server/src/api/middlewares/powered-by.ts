import { Request, Response, NextFunction } from 'express';

export function poweredBy(
    req: Request,
    res: Response,
    next: NextFunction,
): void {
    // override X-Powered-By: Express
    res.set('X-Powered-By', 'Sommelier Finance');
    next();
}
