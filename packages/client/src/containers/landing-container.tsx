import { useEffect, useState } from 'react';
import { Container } from 'react-bootstrap';
import './../styles/app.scss';

import { MarketStats } from '@sommelier/shared-types';
import { TopPairsState } from 'types/states';
import mixpanel from 'util/mixpanel';

import { UniswapApiFetcher as Uniswap } from 'services/api';
import TopPairsWidget from 'components/top-pairs-widget';
import TelegramCTA from 'components/telegram-cta';

function LandingContainer({
    topPairs,
}: {
    topPairs: TopPairsState | null;
}): JSX.Element {
    // const [marketData, setMarketData] = useState<MarketStats[] | null>(null);

    useEffect(() => {
        mixpanel.track('pageview:landing', {});
    }, []);

    // (window as any).marketData = marketData;
    (window as any).topPairs = topPairs;

    if (!topPairs) {
        return (
            <Container className='loading-container'>
                <div className='wine-pulse'>🍷</div>
            </Container>
        );
    }

    return (
        <div className='wrapper'>
            <div className='top-lp-filter'>
                <h2>TOP LIQUIDITY PAIRS</h2>
                {/* <p>
                <em>
                    * These are the highest return pairs on Uniswap over the past 24 hours.
                </em>
            </p> */}
                <p>
                    Not financial advice. This is an alpha project. Trade at
                    your own risk.
                </p>
                <p>All calculated returns include Impermanent Loss.</p>
            </div>
            <div className='top-pairs'>
                {topPairs?.daily && (
                    <>
                        <TopPairsWidget
                            topPairs={topPairs.daily}
                            mode='daily'
                        />
                        <TopPairsWidget
                            topPairs={topPairs.daily}
                            mode='daily'
                        />
                        <TopPairsWidget
                            topPairs={topPairs.daily}
                            mode='daily'
                        />
                    </>
                )}
            </div>
            {/* <hr />
            <h3>Top LP Opportunities in the Past 7 Days</h3>
            <p>All calculated returns include Impermanent Loss.</p>
            {topPairs?.weekly && (
                <TopPairsWidget topPairs={topPairs.weekly} mode='weekly' />
            )}
            <TelegramCTA mode='plural' /> */}

            {/* <h5>Highest Impermanent Loss Pairs on Uniswap since December 1</h5>
            <p>
                <em>
                    * The impermanent loss percentage is a reflection of the
                    amount of IL due to price fluctation relative to the total
                    return of the pool.
                </em>
            </p> */}
            {/* {marketData && <MarketDataTable data={marketData} />} */}
        </div>
    );
}

export default LandingContainer;
