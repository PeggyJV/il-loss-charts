import dotenv from 'dotenv';
dotenv.config();

import BigNumber from 'bignumber.js';
import Discord from "discord.js";

import { UniswapFetcher, calculateMarketStats } from '@sommelier/data-service';
import {
    UniswapHourlyData,
    UniswapPair,
    MarketStats,
} from '@sommelier/shared-types';


const CHAT_ID = '814279129247514635';
const client = new Discord.Client();

function respond(channel: any, text: string) {
    (channel as Discord.TextChannel).send(text)
    .then(message => process.exit(0))
    .catch(console.error);
}

async function runAlertCheck(): Promise<void> {
    // Every hour, fetch latest market data for top pairs - runs locally so using localhost
    // For any pair with a 10% 24h change in impermanent loss, send an alert

    // Get 100 top pairs
    let topPairs: UniswapPair[];


    try {
        topPairs = await UniswapFetcher.getCurrentTopPerformingPairs(100);
    } catch (e) {
        console.error(
            `Aborting: could not fetch pairs for IL alerts: ${
                e.message as string
            }`
        );
        process.exit(1);
    }

    // Start 24h ago, compare to now
    const oneDayMs = 24 * 60 * 60 * 1000;
    const startDate = new Date(Date.now() - oneDayMs);
    const endDate = new Date();

    console.log(`Testing impermanent loss for ${topPairs.length} pairs.`);

    // TODO: Save requests by only fetching first and last hour
    const historicalFetches = topPairs.map(
        (pair: UniswapPair): Promise<UniswapHourlyData[]> =>
            UniswapFetcher.getHourlyData(pair.id, startDate, endDate)
    );

    let historicalData: UniswapHourlyData[][];
    let marketStats: MarketStats[];

    try {
        historicalData = await Promise.all(historicalFetches);
    } catch (e) {
        console.error(
            `Aborting: could not fetch historical data: ${e.message as string}`
        );
        process.exit(1);
    }

    try {
        // Calculate IL for top 25 pairs by liquidity
        marketStats = await calculateMarketStats(
            topPairs,
            historicalData,
            'hourly'
        );
    } catch (e) {
        console.error(
            `Aborting: could not fetch latest market stats: ${
                e.message as string
            }`
        );
        process.exit(1);
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
            10
        );
        const msg = `${'🍷'.repeat(
            numGlasses
        )} Pair ${
            pair.market
        } saw a ${returnStr}% return in the last 24 hours!`;
        // sommBot.sendMessage(CHAT_ID, msg, { parse_mode: 'HTML' });
        msgs.push(msg);
        msgs.push('https://app.sommelier.finance/pair?id=' + pair.id);
        msgs.push('');

        console.log('Sent msg to channel for pair', pair.market);
    });

    try {
        client.channels.fetch(CHAT_ID)
        .then(channel => respond(channel, msgs.join('\n')))
        .catch(console.error);
    } catch (e) {
        console.error(
            `Aborting: error sending a message to Telegram: ${
                e.message as string
            }`
        );
        process.exit(1);
    }
}


client.on('ready', () => {
  console.log(`Logged in as ${client.user!.tag}!`);
  runAlertCheck();
});

if (require.main === module) {
  if (process.env.DISCORD_BOT_TOKEN) {
      client.login(process.env.DISCORD_BOT_TOKEN);
  } else {
      throw new Error(`Cannot start il alerts discord bot without token.`);
  }
}
