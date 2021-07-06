import { Request, Response } from 'express';
import { URL } from 'url';
import morgan, { TokenIndexer } from 'morgan';

import { getNetwork as getNetworkFrom } from 'util/get-network';
import config from '@config';

const { host } = config.server;

const pid = String(config.pid);
morgan.token('pid', function getPid(): string {
    return pid;
});

morgan.token('pathname', function getPathname(req: Request): string {
    return new URL(req.originalUrl, host).pathname;
});

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

morgan.token('country', function getCountry(req: Request): string {
    const [country] = (req.get('X-Client-Geo') ?? ',').split(',');
    return country.length ? country : '-';
});

morgan.token('city', function getCity(req: Request): string {
    const [, city] = (req.get('X-Client-Geo') ?? ',').split(',');
    return city.length ? city : '-';
});

const traceHeader = 'X-Cloud-Trace-Context';
morgan.token('trace-context', function getTraceContext(req: Request): string {
    return req.get(traceHeader) ?? '-';
});

morgan.token('route', function getRoute(req: Request): string {
    const route: string = req.route?.path ?? '';
    const result = `${req.baseUrl}${route}`;

    return result.trim().length ? result : '/';
});

morgan.token('network', function getNetwork(req: Request): string {
    return getNetworkFrom(req.originalUrl) ?? 'mainnet';
});

type Tokens = TokenIndexer<Request, Response>;

function getForwardedFor(req: Request) {
    const forwarded = req.get('X-Forwarded-For') ?? '-';
    return forwarded.split(',');
}

function getCdnHeader(req: Request) {
    const status = req.get('X-Cdn-Cache-Status') ?? '-';
    return status.split(',');
}

const floatRex = /^(\d|\.)+$/;
function jsonFormat(tokens: Tokens, req: Request, res: Response): string {
    // token getters are only valid for strings
    // convert response time to a number for datadog
    const responseTime = tokens['response-time'](req, res) ?? '-1';
    // parseFloat will convert '123nan' -> 123
    const responseTimeMs = floatRex.test(responseTime)
        ? parseFloat(responseTime)
        : -1;

    // convert status to a number
    const status = parseInt(tokens['status'](req, res) ?? '-1', 10);
    const statusNum = Number.isNaN(status) ? -1 : status;

    const length = parseInt(res.get('content-length'), 10);
    const contentLength = Number.isNaN(length)
        ? tokens['res'](req, res, 'content-length')
        : length;

    return JSON.stringify({
        pid: tokens['pid'](req, res),
        method: tokens['method'](req, res),
        path: tokens['pathname'](req, res),
        route: tokens['route'](req, res),
        query: req.query,
        statusCode: statusNum,
        responseTime: responseTimeMs,
        contentLength: contentLength,
        clientIp: tokens['client-ip'](req, res),
        userAgent: tokens['user-agent'](req, res),
        referrer: tokens['referrer'](req, res),
        cdnId: tokens['cdn-id'](req, res),
        cdnStatus: tokens['cdn-status'](req, res),
        lbIp: tokens['lb-ip'](req, res),
        country: tokens['country'](req, res),
        city: tokens['city'](req, res),
        traceContext: tokens['trace-context'](req, res),
        network: tokens['network'](req, res),
        // TODO container && pid
    });
}

const hcRoute = '/api/v1/healthcheck';

// TODO: configure
const intervalMs = 10;
const maxCount = Math.floor(60 / intervalMs);
let count = 1;

function skip(req: Request): boolean {
    // skip healthchecks from google only, lb hc requests wont have trace context headers
    const trace = req.get(traceHeader);
    if (req.url === hcRoute && trace == null) {
        // log once a minute
        if (count === maxCount) {
            count = 1;
            return false;
        }

        count = count + 1;
        return true;
    }

    return false;
}

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
export function logger() {
    return morgan(jsonFormat, { skip });
}
