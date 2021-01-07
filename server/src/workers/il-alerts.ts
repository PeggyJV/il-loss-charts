import dotenv from 'dotenv'
dotenv.config();

import TelegramBot from 'node-telegram-bot-api';
import BigNumber from 'bignumber.js';

import UniswapFetcher from '../services/uniswap';
import { calculateMarketStats } from '../util/calculate-stats';

import fs from 'fs';

const sommBot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN);
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
    const historicalFetches = topPairs.map((pair) => UniswapFetcher.getHourlyData(pair.id, startDate, endDate));
    const historicalData: any[] = await Promise.all(historicalFetches);

    // Calculate IL for top 25 pairs by liquidity
    const marketStats = await calculateMarketStats(topPairs, historicalData, 'hourly');


    const highIlPairs = marketStats.sort((a, b) => a.impermanentLoss - b.impermanentLoss);

    highIlPairs.slice(0, 5).forEach((pair) => {
        // Send message to channel
        const ilStr = new BigNumber(pair.impermanentLoss).times(-100).toFixed(2);
        const numGlasses = Math.abs(Math.ceil(pair.impermanentLoss / -0.01));
        const msg = `${'🍷'.repeat(numGlasses)} Pair <a href='https://app.sommelier.finance/pair?id=${pair.id}'>${pair.market}</a> saw a ${ilStr}% impermanent loss in the last 24 hours!`;
        sommBot.sendMessage(CHAT_ID, msg, { parse_mode: 'HTML' });
        console.log('Sent msg to channel for pair', pair.market);
    });
}


if (require.main === module) {
    runAlertCheck();
}