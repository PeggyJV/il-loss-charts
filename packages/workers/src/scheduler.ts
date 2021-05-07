import cron from 'node-cron';
import express from 'express';

import runTgAlerts from './scripts/il-alerts';
import runDiscordAlerts from './scripts/il-alerts-discord';

const PORT = 8080;
const CRON_EVERY_HOUR = '0 * * * *';

cron.schedule(CRON_EVERY_HOUR, () => {
    void runTgAlerts();
});

cron.schedule(CRON_EVERY_HOUR, () => {
    void runDiscordAlerts();
});

// Using express to keep the scheduler alive
// In the future we can expose HTTP endpoints for cloud run
const app = express();
app.listen(PORT, () => {
    console.log(`Scheduler listening at http://localhost:${PORT}`)
});
