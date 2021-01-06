import cache from 'memory-cache';

const memCache = new cache.Cache();

export default function cacheMiddleware(ttl) {
    return (req, res, next) => {
        let key = '__express__' + req.originalUrl || req.url;
        let cacheContent = memCache.get(key);
        if (cacheContent) {
            res.send(cacheContent);
            return
        } else {
            res.sendResponse = res.send;
            res.send = (body) => {
                memCache.put(key, body, ttl * 1000);
                res.sendResponse(body);
            }
            next();
        }
    }
}