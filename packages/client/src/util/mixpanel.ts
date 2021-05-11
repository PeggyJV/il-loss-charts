import mixpanel from 'mixpanel-browser';

import { poolSymbol, PoolLike } from 'util/formats';

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
}

const mix = new MixpanelWrapper();
export default mix;

export function trackPoolSelected(pool: PoolLike) {
    mix.track('pool:selected', {
        name: poolName(pool),
    })
}

export function trackSentimentInteraction(pool: PoolLike, sentiment: Sentiment) {
    mix.track('pool:sentiment-selected', {
        name: poolName(pool),
        sentiment,
    })
}

export function trackPoolSearch() {
    mix.track('pool:search-started', {})
}

function poolName(pool: PoolLike): string {
    // Warning, changing the name in the future will affect mixpanel analytics
    return poolSymbol(pool, '-');
}