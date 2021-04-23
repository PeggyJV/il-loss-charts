import cache from 'memory-cache';
import { Request, Response, NextFunction, RequestHandler } from 'express';

const memCache = new cache.Cache<string, unknown>();

interface ResponseWithCache extends Response {
    sendResponse?: Response['send'];
    send: (body: unknown) => this;
}

export default function cacheMiddleware(ttl: number): RequestHandler {
    return (req: Request, res: ResponseWithCache, next: NextFunction) => {
        const key = '__express__' + req.originalUrl || req.url;
        console.log('THIS IS KEY', key);
        const cacheContent: unknown | null = memCache.get(key);
        if (cacheContent) {
            res.send(cacheContent);
            return;
        } else {
            res.sendResponse = res.send;
            res.send = (body: unknown) => {
                if (res.statusCode !== 500) {
                    // avoid cache if we had a server error
                    memCache.put(key, body, ttl * 1000);
                }

                if (res.sendResponse) {
                    res.sendResponse(body);
                }
                return res;
            };
            next();
        }
    };
}
