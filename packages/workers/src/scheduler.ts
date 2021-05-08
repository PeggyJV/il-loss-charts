import cron from 'node-cron';
import dotenv from 'dotenv';
import express from 'express';

import runTgAlerts from './scripts/il-alerts';
import runDiscordAlerts from './scripts/il-alerts-discord';
import { run as runRedisCacheWarmer } from './scripts/redis-cache-warmer';

dotenv.config();

const PORT = 8080;
const CRON_EVERY_HOUR = '0 * * * *';

let tgAlertsEnabled = process.env.WORKER_TG_ALERTS ?? 'false';
tgAlertsEnabled = JSON.parse(tgAlertsEnabled);

if (tgAlertsEnabled) {
    cron.schedule(CRON_EVERY_HOUR, () => {
        void runTgAlerts();
    });
}

let discordAlertsEnabled = process.env.WORKER_DISCORD_ALERTS ?? 'false';
discordAlertsEnabled = JSON.parse(discordAlertsEnabled);
if (discordAlertsEnabled) {
    cron.schedule(CRON_EVERY_HOUR, () => {
        void runDiscordAlerts();
    });
}

let cacheWarmerEnabled = process.env.WORKER_CACHE_WARMER ?? 'false';
cacheWarmerEnabled = JSON.parse(cacheWarmerEnabled);
if (cacheWarmerEnabled) {
    cron.schedule(CRON_EVERY_HOUR, () => {
        void runRedisCacheWarmer();
    })
}

// Using express to keep the scheduler alive
// In the future we can expose HTTP endpoints for cloud run
const app = express();
app.listen(PORT, () => {
    console.log(`Scheduler listening at http://localhost:${PORT}`)
});
