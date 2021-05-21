import BigNumber from 'bignumber.js';
import Discord from 'discord.js';
import logger from '../logger';
import appConfig from 'config/app';

import { UniswapFetcher, calculateMarketStats } from '@sommelier/data-service';
import {
    UniswapHourlyData,
    IUniswapPair,
    MarketStats,
} from '@sommelier/shared-types';

const config = appConfig.discordAlerts;

const log = logger.child({ worker: 'il-alerts-discord' });

const CHAT_ID = '814279129247514635';
const client = new Discord.Client();

function logError(e: Error) {
    log.error({ error: e.message ?? '' });
}

function respond(channel: any, text: string) {
    (channel as Discord.TextChannel).send(text).catch(logError);
}

const handleExit = () => {
    if (require.main === module) {
        process.exit(1);
    }
};

export default function loginAndSetupAlerts(): void {
    void client.login(config.botToken);

    client.on('ready', () => {
        if (client.user == null) {
            throw new Error('Could not login to Discord.');
        }

        log.info({ msg: `Logged in as ${client.user.tag}` });
        void runDiscordAlerts();
    });
}

async function runDiscordAlerts(): Promise<void> {
    // Every hour, fetch latest market data for top pairs - runs locally so using localhost
    // For any pair with a 10% 24h change in impermanent loss, send an alert

    // Get 100 top pairs
    let topPairs: IUniswapPair[];

    try {
        topPairs = await UniswapFetcher.getCurrentTopPerformingPools(100);
    } catch (e) {
        log.error({
            msg: 'Aborting, could not fetch pairs for IL alerts',
            error: e.message ?? '',
        });
        return handleExit();
    }

    // Start 24h ago, compare to now
    const oneDayMs = 24 * 60 * 60 * 1000;
    const startDate = new Date(Date.now() - oneDayMs);
    const endDate = new Date();

    log.info(`Testing impermanent loss for ${topPairs.length} pairs`);

    // TODO: Save requests by only fetching first and last hour
    const historicalFetches = topPairs.map(
        (pair: IUniswapPair): Promise<UniswapHourlyData[]> =>
            // TODO: remove
            // eslint-disable-next-line
            UniswapFetcher.getPoolHourlyData(pair.id, startDate, endDate),
    );

    let historicalData: UniswapHourlyData[][];
    let marketStats: MarketStats[];

    try {
        historicalData = await Promise.all(historicalFetches);
    } catch (e) {
        log.error({
            msg: 'Aborting, could not fetch historical data',
            error: e.message ?? '',
        });
        return handleExit();
    }

    try {
        // Calculate IL for top 25 pairs by liquidity
        marketStats = await calculateMarketStats(
            topPairs,
            historicalData,
            'hourly',
        );
    } catch (e) {
        log.error({
            msg: 'Aborting, could not fetch latest market stats',
            error: e.message ?? '',
        });
        return handleExit();
    }

    const highReturnPairs = [...marketStats]
        .sort((a, b) => b.pctReturn - a.pctReturn)
        .filter((pair) => pair.pctReturn > 0.01);

    const msgs: string[] = [];

    highReturnPairs.forEach((pair: MarketStats) => {
        // Send message to channel
        const returnStr = new BigNumber(pair.pctReturn).times(100).toFixed(2);
        const numGlasses = Math.min(
            Math.abs(Math.ceil(pair.pctReturn / 0.01)),
            10,
        );
        const msg = `${'🍷'.repeat(numGlasses)} Pair ${
            pair.market
        } saw a ${returnStr}% return in the last 24 hours!`;
        // sommBot.sendMessage(CHAT_ID, msg, { parse_mode: 'HTML' });
        msgs.push(msg);
        msgs.push('https://app.sommelier.finance/pair?id=' + pair.id);
        msgs.push('');

        log.info({ msg: 'Sent msg to channel for pair', pair: pair.market });
    });

    try {
        client.channels
            .fetch(CHAT_ID)
            .then((channel) => respond(channel, msgs.join('\n')))
            .catch(logError);
    } catch (e) {
        log.error({
            msg: 'Aborting, error sending a msg to Telegram',
            error: e.message ?? '',
        });
        return handleExit();
    }
}

if (require.main === module) {
    if (config.botToken.length > 0) {
        loginAndSetupAlerts();
    } else {
        throw new Error(`Cannot start il alerts discord bot without token.`);
    }
}
