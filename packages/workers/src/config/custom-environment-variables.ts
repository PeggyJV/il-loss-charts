export default {
    env: 'NODE_ENV',
    logInfo: 'LOG_LEVEL',
    scheduler: {
        tgAlerts: {
            __name: 'WORKER_TG_ALERTS',
            __format: 'boolean',
        },
        tgAlertsCron: 'WORKER_TG_ALERTS_CRON',
        discordAlerts: {
            __name: 'WORKER_DISCORD_ALERTS',
            __format: 'boolean',
        },
        discordAlertsCron: 'WORKER_DISCORD_ALERTS_CRON',
        cacheWarmer: {
            __name: 'WORKER_CACHE_WARMER',
            __format: 'boolean',
        },
        cacheWarmerCron: 'WORKER_CACHE_WARMER_CRON',
    },
    discordAlerts: {
        botToken: 'DISCORD_BOT_TOKEN',
    },
    telegramBot: {
        mixpanelToken: 'MIXPANEL_TOKEN',
        telegramToken: 'SOMM_STATS_BOT_TOKEN',
    },
    alerts: {
        telegramToken: 'TELEGRAM_BOT_TOKEN',
    },
    redisCacheWarmer: {
        v3SubgraphUrl: 'V3_SUBGRAPH_URL',
        redisUrl: 'REDIS_URL',
        redisPort: 'REDIS_PORT',
        reidsDb: 'REDIS_DB',
        redisPw: 'REDIS_AUTH',
        periodDays: 'PERIOD_DAYS',
    },
    mpLiquidity: {
        mixpanelToken: 'MIXPANEL_TOKEN',
        mixpanelSecret: 'MIXPANEL_SECRET',
    },
    // shared config from server, put worker config above this
    redis: {
        host: 'REDIS_URL',
        port: 'REDIS_PORT',
        db: ' REDIS_DB',
        password: 'REDIS_AUTH',
    },
    bitquery: {
        apiKey: 'BITQUERY_API_KEY',
    },
};
