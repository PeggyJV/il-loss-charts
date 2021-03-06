import { NextFunction, Request, Response, RequestHandler } from 'express';

import { CacheControl, setCacheControl } from 'api/util/set-cache-control';

// eslint-disable-next-line no-unused-vars
type RouteHandler = (
    req: Request<any, any, any, any>,
    res: Response,
) => Promise<unknown>;

// Catch async route handler errors since they must be
// TODO [express@>=5.0.0]: Remove this wrapper and call res.json directly in the function
export default function catchAsyncRoute(
    controllerFn: RouteHandler,
    cacheOptions?: CacheControl,
): RequestHandler {
    return async (req: Request, res: Response, next: NextFunction) => {
        try {
            const result = await controllerFn(req, res);

            // set cache control headers if configured
            if (cacheOptions) {
                setCacheControl(res, cacheOptions);
            }

            return res.json(result);
        } catch (err) {
            next(err);
        }
    };
}
