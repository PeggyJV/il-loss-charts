import appConfig from 'config/app';
import TelegramBot from 'node-telegram-bot-api';
import BigNumber from 'bignumber.js';
import logger from '../logger';

const config = appConfig.alerts;
const log = logger.child({ worker: 'il-alerts' });

import { UniswapFetcher, calculateMarketStats } from '@sommelier/data-service';
import {
    UniswapHourlyData,
    IUniswapPair,
    MarketStats,
} from '@sommelier/shared-types';

let sommBot: TelegramBot | undefined;
if (config.telegramToken.length > 0) {
    sommBot = new TelegramBot(config.telegramToken);
} else {
    throw new Error(`Cannot start il alerts telegram bot without token.`);
}

const CHAT_ID = '@getsomm_alerts';

const handleExit = () => {
    if (require.main === module) {
        process.exit(1);
    }
};

export default async function runAlertCheck(): Promise<void> {
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

    log.info(`Testing impermanent loss for ${topPairs.length}pairs`);

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
    const highIlPairs = [...marketStats]
        .sort((a, b) => a.impermanentLoss - b.impermanentLoss)
        .filter((pair) => pair.impermanentLoss < -0.01);

    const msgs: string[] = [];

    highReturnPairs.forEach((pair: MarketStats) => {
        // Send message to channel
        const returnStr = new BigNumber(pair.pctReturn).times(100).toFixed(2);
        const numGlasses = Math.min(
            Math.abs(Math.ceil(pair.pctReturn / 0.01)),
            10,
        );
        const msg = `${'🍷'.repeat(
            numGlasses,
        )} Pair <a href='https://app.sommelier.finance/pair?id=${pair.id}'>${
            pair.market
        }</a> saw a ${returnStr}% return in the last 24 hours!`;
        // sommBot.sendMessage(CHAT_ID, msg, { parse_mode: 'HTML' });
        msgs.push(msg);
        log.info({ msg: 'Set msg to channel for pair', pair: pair.market });
    });

    highIlPairs.forEach((pair) => {
        // Send message to channel
        const ilStr = new BigNumber(pair.impermanentLoss)
            .times(-100)
            .toFixed(2);
        const numFaces = Math.min(
            Math.abs(Math.ceil(pair.impermanentLoss / -0.01)),
            10,
        );
        const msg = `${'😢'.repeat(
            numFaces,
        )} Pair <a href='https://app.sommelier.finance/pair?id=${pair.id}'>${
            pair.market
        }</a> saw a ${ilStr}% impermanent loss in the last 24 hours!`;
        // sommBot.sendMessage(CHAT_ID, msg, { parse_mode: 'HTML' });
        msgs.push(msg);
        log.info({ msg: 'Set msg to channel for pair', pair: pair.market });
    });

    try {
        await sommBot?.sendMessage(CHAT_ID, msgs.join('\n'), {
            parse_mode: 'HTML',
        });
    } catch (e) {
        log.error({
            msg: 'Aborting, error sending a msg to Telegram',
            error: e.message ?? '',
        });
        return handleExit();
    }

    return;
}

if (require.main === module) {
    void runAlertCheck();
}
