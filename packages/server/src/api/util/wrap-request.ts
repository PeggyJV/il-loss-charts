import { Request, Response, RequestHandler } from 'express';

import { CacheControl, setCacheControl } from 'api/util/set-cache-control';

export default function wrapRequest(
    // eslint-ignore-next-line no-unused-vars
    controllerFn: (req: Request<any, any, any, any>, res: Response) => Promise<unknown>,
    cacheOptions?: CacheControl,
): RequestHandler {
    return async (req: Request, res: Response) => {
        try {
            const data = await controllerFn(req, res);

            // set cache control headers if configured
            if (cacheOptions) {
                setCacheControl(res, cacheOptions);
            }

            return res.json({ data });
        } catch (err) {
            console.error('Error:', err);
            return res.status(err.status || 500).json({ error: err.message });
        }
    };
}
