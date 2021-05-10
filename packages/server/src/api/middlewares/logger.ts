import { Request, Response } from 'express';
import morgan, { TokenIndexer, } from 'morgan';

morgan.token('cdn-id', function getCdnStatus(req: Request): string {
    const [id] = getCdnHeader(req);
    return id;
});

morgan.token('cdn-status', function getCdnStatus(req: Request): string {
    const [, status] = getCdnHeader(req);
    return status ?? '-';
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
    return req.header('X-Client-Geo') ?? '-';
});

const traceHeader = 'X-Cloud-Trace-Context';
morgan.token('trace-context', function getTraceContext(req: Request): string {
    return req.header(traceHeader) ?? '-';
});

morgan.token('instance-id', function getInstanceId(): string {
    // TODO
    return '';
})

type Tokens = TokenIndexer<Request, Response>;

function getForwardedFor(req: Request) {
    const forwarded = req.header('X-Forwarded-For') ?? '-';
    return forwarded.split(',');
}

function getCdnHeader(req: Request) {
    const status = req.header('X-Cdn-Status') ?? '-';
    return status.split(',');
}

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
        'cdnId': tokens['cdn-id'](req, res),
        'cdnStatus': tokens['cdn-status'](req, res),
        'lbIp': tokens['lb-ip'](req, res),
        'geo': tokens['geo'](req, res),
        'traceContext': tokens['trace-context'](req, res),
        'instanceId': tokens['instance-id'](req, res),
        // TODO pid
    });
}

const hcRoute = '/api/v1/healthcheck';

function skip(req: Request): boolean {
    // skip healthchecks from google only, lb hc requests wont have trace context headers
    if (req.url === hcRoute && req.header(traceHeader) === '-') { return true; }
    return false;
}

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
export function logger() {
    return morgan(jsonFormat, { skip });
}