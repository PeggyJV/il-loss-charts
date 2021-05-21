import cron from 'node-cron';
import express from 'express';

import { run as runRedisCacheWarmer } from './scripts/redis-cache-warmer';
import runTgAlerts from './scripts/il-alerts';
import runDiscordAlerts from './scripts/il-alerts-discord';
import logger from './logger';
import config from '@config';

const log = logger.child({ worker: 'scheduler' });

const {
    port,
    tgAlerts,
    tgAlertsCron,
    discordAlerts,
    discordAlertsCron,
    cacheWarmer,
    cacheWarmerCron,
} = config.scheduler;

if (tgAlerts) {
    log.info({ msg: 'Telegram alerts scheduled', cron: tgAlertsCron });
    cron.schedule(tgAlertsCron, () => {
        void runTgAlerts();
    });
}

if (discordAlerts) {
    log.info({ msg: 'Discord alerts scheduled', cron: discordAlertsCron });
    cron.schedule(discordAlertsCron, () => {
        void runDiscordAlerts();
    });
}

if (!cron.validate(cacheWarmerCron)) {
    throw new Error(
        `Invalid cron schedule configured for cache warmer: ${cacheWarmerCron}`,
    );
}

if (cacheWarmer) {
    log.info({ msg: 'Redis Cache Warmer scheduled', cron: cacheWarmerCron });
    cron.schedule(cacheWarmerCron, () => {
        void runRedisCacheWarmer();
    });
}

// Using express to keep the scheduler alive
// In the future we can expose HTTP endpoints for cloud run
const app = express();
app.listen(port, () => {
    log.info(`Scheduler listening at http://localhost:${port}`);
});
