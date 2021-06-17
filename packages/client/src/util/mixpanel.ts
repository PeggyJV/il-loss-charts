import mixpanel from 'mixpanel-browser';

import { poolSymbol, PoolLike } from 'util/formats';
import { BoundsState, TokenInputAmount } from 'types/states';

import type { Sentiment } from 'components/add-liquidity/add-liquidity-v3';

type TrackingArgs = [string, any];

class MixpanelWrapper {
    isActive = false;

    constructor() {
        const token = process.env.REACT_APP_MIXPANEL_TOKEN;
        if (token) {
            this.isActive = true;
            mixpanel.init(token, { debug: true });

            mixpanel.track('page_load');

            try {
                mixpanel.track('page_load', { distinct_id: Date.now() });
            } catch (e) {
                console.error(`Metrics error on page_load.`);
            }
        } else {
            console.warn('No analytics token received.');
        }
    }

    track(...args: TrackingArgs) {
        // No-op if not using
        if (!this.isActive) return;
        mixpanel.track(...args);
    }

    get people() {
        if (!this.isActive) return null;

        return mixpanel.people;
    }
}

const mix = new MixpanelWrapper();
export default mix;

export function trackPoolSelected(pool: PoolLike): void {
    mix.track('pool:selected', {
        name: poolName(pool),
    });
}

export function trackSentimentInteraction(
    pool: PoolLike,
    sentiment: Sentiment,
): void {
    mix.track('pool:sentiment-selected', {
        name: poolName(pool),
        sentiment,
    });
}

export function trackAddLiquidityTx(
    pool: PoolLike,
    sentiment: Sentiment,
    bounds: BoundsState,
    type: string,
    amounts: Record<string, TokenInputAmount>,
): void {
    mix.track('pool:add-liquidity', {
        name: poolName(pool),
        type,
        sentiment,
        bounds: { prices: bounds.prices, ticks: bounds.ticks },
        amounts,
    });
}

export function trackPoolSearch(): void {
    mix.track('pool:search-started', {});
}

function poolName(pool: PoolLike): string {
    // Warning, changing the name in the future will affect mixpanel analytics
    return poolSymbol(pool, '-');
}
