import * as Sentry from '@sentry/react';
import { Integrations } from '@sentry/tracing';

export function init(): void {
    Sentry.init({
        dsn: 'https://f35d9c09635541b1803ab440224ae61f@o514714.ingest.sentry.io/5618374',
        integrations: [new Integrations.BrowserTracing()],

        // We recommend adjusting this value in production, or using tracesSampler
        // for finer control
        tracesSampleRate: 1.0,
    });
}

export class SentryError extends Error {
    payload: Record<string, any>;

    constructor(msg: string, payload: Record<string, any>) {
        super(msg);
        this.payload = payload;
    }
}

export default Sentry;
