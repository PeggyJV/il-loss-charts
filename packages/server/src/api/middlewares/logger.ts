import { Request, Response } from 'express';
import morgan, { TokenIndexer, } from 'morgan';
import morganJson from 'morgan-json';

morgan.token('cdn-status', function getCdnStatus(req: Request): string {
    return req.header('X-Cdn-Cache-Status') ?? '';
});

morgan.token('client-ip', function getClientIp(req: Request): string {
    const ips = getForwardedFor(req);
    // https://cloud.google.com/load-balancing/docs/https#x-forwarded-for_header
    if (ips.length === 2) return ips[0]; // clientIp, loadbalancerIp
    if (ips.length === 3) return ips[1]; // suppliedIp, clientIp, loadbalancerIp

    return ips.join(',');
});

morgan.token('lb-ip', function getLbIp(req: Request): string {
    const ips = getForwardedFor(req);
    if (ips.length === 2) return ips[1]; // clientIp, loadbalancerIp
    if (ips.length === 3) return ips[2]; // suppliedIp, clientIp, loadbalancerIp

    return ips.join(',');
});

morgan.token('geo', function getGeo(req: Request): string {
    return req.header('X-Client-Geo') ?? '';
});

morgan.token('trace-context', function getTraceContext(req: Request): string {
    return req.header('X-Cloud-Trace-Context') ?? '';
});

morgan.token('instance-id', function getInstanceId(req: Request): string {
    // TODO
    return '';
})

function getForwardedFor(req: Request) {
    const forwarded = req.header('X-Forwarded-For') ?? '';
    return forwarded.split(',');
}

type Tokens = TokenIndexer<Request, Response>;

function jsonFormat(tokens: Tokens, req: Request, res: Response): string {
    return JSON.stringify({
        'method': tokens['method'](req, res),
        'path': tokens['url'](req, res),
        'status': tokens['status'](req, res),
        'responseTime': tokens['response-time'](req, res),
        'contentLength': tokens['res'](req, res, 'content-length'),
        'clientIp': tokens['client-ip'](req, res),
        'userAgent': tokens['user-agent'](req, res),
        'referrer': tokens['referrer'](req, res),
        'cdnStatus': tokens['cdn-status'](req, res),
        'lbIp': tokens['lb-ip'](req, res),
        'geo': tokens['geo'](req, res),
        'traceContext': tokens['trace-context'](req, res),
        'instanceId': tokens['instance-id'](req, res),
        // TODO pid
    }, null, '');
}

const morganJsonFormat = morganJson({
    'method': ':method',
    'path': ':url',
    'status': ':status',
    'responseTime': ':response-time',
    'length': ':res[content-length]',
    'clientIp': ':client-ip',
    'userAgent': ':user-agent',
    'referrer': ':referrer',
    'cdnStatus': ':cdn-status',
    'lbIp': ':lb-ip',
    'geo': ':geo',
    'traceContext': ':trace-context',
    'instanceId': ':instance-id',
});

export function logger() {
    return morgan(morganJsonFormat);
}