export default {
    env: 'development',
    logLevel: 'info',
    scheduler: {
        port: 8080,
        tgAlerts: false,
        tgAlertsCron: '0 * * * *',
        discordAlerts: false,
        discordAlertsCron: '0 * * * *',
        cacheWarmer: false,
        cacheWarmerCron: '0 * * * *',
    },
    discordAlerts: {
        botToken: '',
    },
    telegramBot: {
        mixpanelToken: '',
        telegramToken: '',
    },
    alerts: {
        telegramToken: '',
    },
    redisCacheWarmer: {
        v3SubgraphUrl:
            'http://localhost:8000/subgraphs/name/sommelier/uniswap-v3',
        redisUrl: '127.0.0.1',
        redisPort: 6379,
        redisDb: 0,
        redisPw: '',
        // this needs to stay in lockstep with the default days for the /marketData/indicators routte
        periodDays: 20,
        // number of pools to keep warm
        topPoolCount: 41,
    },
    mpLiquidity: {
        mixpanelToken: '',
        mixpanelSecret: '',
    },
    // TODO Fix, having to duplicate this config is whack
    // shared config from server
    redis: {
        host: '127.0.0.1',
        port: 6379,
        db: 0,
        password: '',
    },
    memoizerRedis: {
        enabled: true,
    },
};
