import cron from 'node-cron';
import dotenv from 'dotenv';
import express from 'express';

import { run as runRedisCacheWarmer } from './scripts/redis-cache-warmer';
import runTgAlerts from './scripts/il-alerts';
import runDiscordAlerts from './scripts/il-alerts-discord';
import logger from './logger';

const log = logger.child({ worker: 'scheduler' });

dotenv.config();

const PORT = 8080;
const CRON_EVERY_HOUR = '0 * * * *';

let tgAlertsEnabled = process.env.WORKER_TG_ALERTS ?? 'false';
tgAlertsEnabled = JSON.parse(tgAlertsEnabled);

if (tgAlertsEnabled) {
    const schedule = CRON_EVERY_HOUR;
    log.info({ msg: 'Telegram alerts scheduled', cron: schedule });
    cron.schedule(schedule, () => {
        void runTgAlerts();
    });
}

let discordAlertsEnabled = process.env.WORKER_DISCORD_ALERTS ?? 'false';
discordAlertsEnabled = JSON.parse(discordAlertsEnabled);

if (discordAlertsEnabled) {
    const schedule = CRON_EVERY_HOUR;
    log.info({ msg: 'Discord alerts scheduled', cron: schedule })
    cron.schedule(schedule, () => {
        void runDiscordAlerts();
    });
}

const cacheWarmerCron = process.env.WORKER_CACHE_WARMER_CRON ?? CRON_EVERY_HOUR;
let cacheWarmerEnabled = process.env.WORKER_CACHE_WARMER ?? 'false';
cacheWarmerEnabled = JSON.parse(cacheWarmerEnabled);

if (!cron.validate(cacheWarmerCron)) {
    throw new Error(`Invalid cron schedule configured for cache warmer: ${cacheWarmerCron}`);
}

if (cacheWarmerEnabled) {
    log.info({ msg: 'Telegram alerts scheduled', cron: cacheWarmerCron });
    cron.schedule(cacheWarmerCron, () => {
        void runRedisCacheWarmer();
    })
}


// Using express to keep the scheduler alive
// In the future we can expose HTTP endpoints for cloud run
const app = express();
app.listen(PORT, () => {
    log.info({
        msg: 'Scheduler listening',
        port: PORT,
    });
});
