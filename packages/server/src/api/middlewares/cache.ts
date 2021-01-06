import cache from 'memory-cache';
import { Request, Response, NextFunction, RequestHandler } from 'express';

const memCache = new cache.Cache<string, Object>();

interface ResponseWithCache extends Response {
    sendResponse?: Response['send'];
    send: (body: Object) => this;
}

export default function cacheMiddleware(ttl: number): RequestHandler {
    return (req: Request, res: ResponseWithCache, next: NextFunction) => {
        let key = '__express__' + req.originalUrl || req.url;
        let cacheContent: Object | null = memCache.get(key);
        if (cacheContent) {
            res.send(cacheContent);
            return
        } else {
            res.sendResponse = res.send;
            res.send = (body: Object) => {
                memCache.put(key, body, ttl * 1000);
                if (res.sendResponse) {
                    res.sendResponse(body);
                }
                return res;
            }
            next();
        }
    }
}