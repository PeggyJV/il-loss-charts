import dotenv from 'dotenv';
dotenv.config();

import TelegramBot from 'node-telegram-bot-api';
import BigNumber from 'bignumber.js';

import { UniswapFetcher, calculateMarketStats } from 'lp-data-service';
import { UniswapHourlyData, UniswapPair } from '../../../server/src/types/uniswap';

let sommBot: TelegramBot | undefined;
if (process.env.TELEGRAM_BOT_TOKEN) {
    sommBot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN);
} else {
    throw new Error(`Cannot start il alerts telegram bot without token.`);
}

const CHAT_ID = '@getsomm_alerts';

async function runAlertCheck(): Promise<void> {
    // Every hour, fetch latest market data for top pairs - runs locally so using localhost
    // For any pair with a 10% 24h change in impermanent loss, send an alert

    // Get 100 top pairs
    const topPairs = await UniswapFetcher.getIlAlertsPairs(100);

    // Start 24h ago, compare to now
    const oneDayMs = 24 * 60 * 60 * 1000;
    const startDate = new Date(Date.now() - oneDayMs);
    const endDate = new Date();

    console.log(`Testing impermanent loss for ${topPairs.length} pairs.`);

    // TODO: Save requests by only fetching first and last hour
    const historicalFetches = topPairs.map((pair: UniswapPair) =>
        UniswapFetcher.getHourlyData(pair.id, startDate, endDate)
    );
    const historicalData: UniswapHourlyData[][] = await Promise.all(
        historicalFetches
    );

    // Calculate IL for top 25 pairs by liquidity
    const marketStats = await calculateMarketStats(
        topPairs,
        historicalData,
        'hourly'
    );

    const highReturnPairs = [...marketStats]
        .sort((a, b) => b.pctReturn - a.pctReturn)
        .filter((pair) => pair.pctReturn > 0.05);
    const highIlPairs = [...marketStats]
        .sort((a, b) => a.impermanentLoss - b.impermanentLoss)
        .filter((pair) => pair.impermanentLoss < -0.05);

    const msgs: string[] = [];

    highReturnPairs.forEach((pair) => {
        // Send message to channel
        const returnStr = new BigNumber(pair.pctReturn).times(100).toFixed(2);
        const numGlasses = Math.min(
            Math.abs(Math.ceil(pair.pctReturn / 0.01)),
            10
        );
        const msg = `${'🍷'.repeat(
            numGlasses
        )} Pair <a href='https://app.sommelier.finance/pair?id=${pair.id}'>${pair.market
            }</a> saw a ${returnStr}% return in the last 24 hours!`;
        // sommBot.sendMessage(CHAT_ID, msg, { parse_mode: 'HTML' });
        msgs.push(msg);
        console.log('Sent msg to channel for pair', pair.market);
    });

    highIlPairs.forEach((pair) => {
        // Send message to channel
        const ilStr = new BigNumber(pair.impermanentLoss)
            .times(-100)
            .toFixed(2);
        const numFaces = Math.min(
            Math.abs(Math.ceil(pair.impermanentLoss / -0.01)),
            10
        );
        const msg = `${'😢'.repeat(
            numFaces
        )} Pair <a href='https://app.sommelier.finance/pair?id=${pair.id}'>${pair.market
            }</a> saw a ${ilStr}% impermanent loss in the last 24 hours!`;
        // sommBot.sendMessage(CHAT_ID, msg, { parse_mode: 'HTML' });
        msgs.push(msg);
        console.log('Sent msg to channel for pair', pair.market);
    });

    // Send one msg per second
    await sommBot?.sendMessage(CHAT_ID, msgs.join('\n'), {
        parse_mode: 'HTML',
    });

    process.exit(0);
}

if (require.main === module) {
    void runAlertCheck();
}
