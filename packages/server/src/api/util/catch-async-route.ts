import { NextFunction, Request, Response, RequestHandler } from 'express';

// eslint-disable-next-line no-unused-vars
type RouteHandler = (req: Request<any, any, any, any>, res: Response) => Promise<unknown>;

// Catch async route handler errors since they must be
// TODO [express@>=5.0.0]: Remove this wrapper and call res.json directly in the function
export default function catchAsyncRoute(
    controllerFn: RouteHandler
): RequestHandler {
    return async (req: Request, res: Response, next: NextFunction) => {
        try {
            const response = await controllerFn(req, res);
            return res.json(response);
        } catch (err) {
          next(err);
        }
    };
}