import { useEffect, useState } from 'react';
import { Container } from 'react-bootstrap';

import { MarketStats } from '@sommelier/shared-types';
import { IError } from 'types/states';
import mixpanel from 'util/mixpanel';

import { UniswapApiFetcher as Uniswap } from 'services/api';
import TopPairsWidget from 'components/top-pairs-widget';
import TelegramCTA from 'components/telegram-cta';

function LandingContainer(): JSX.Element {
    // const [marketData, setMarketData] = useState<MarketStats[] | null>(null);
    const [topPairs, setTopPairs] = useState<{
        daily: MarketStats[];
        weekly: MarketStats[];
    } | null>(null);
    const [currentError, setError] = useState<IError | null>(null);

    useEffect(() => {
        mixpanel.track('pageview:landing', {});
    }, []);

    useEffect(() => {
        const fetchMarketData = async () => {
            // Fetch all pairs
            const [
                { data: topWeeklyPairs, error: topWeeklyPairsError },
                { data: topDailyPairs, error: topDailyPairsError },
            ] = await Promise.all([
                Uniswap.getWeeklyTopPerformingPairs(),
                Uniswap.getDailyTopPerformingPairs(),
            ]);

            const error = topWeeklyPairsError ?? topDailyPairsError;

            if (error) {
                // we could not get our market data
                console.warn(`Could not fetch market data: ${error.message}`);
                setError(error);
                return;
            }

            // if (marketData) {
            //     setMarketData(marketData);
            // }

            if (topWeeklyPairs && topDailyPairs) {
                setTopPairs({ daily: topDailyPairs, weekly: topWeeklyPairs });
            }
        };
        void fetchMarketData();
    }, []);

    // (window as any).marketData = marketData;
    (window as any).topPairs = topPairs;

    if (currentError) {
        return (
            <Container>
                <h2>Oops, the grapes went bad.</h2>
                <p>Error: {currentError.message}</p>

                <h6>Refresh the page to try again.</h6>
            </Container>
        );
    }

    return (
        <div>
            <h3>Top LP Opportunities in the Past 24 Hours</h3>
            {/* <p>
                <em>
                    * These are the highest return pairs on Uniswap over the past 24 hours.
                </em>
            </p> */}
            <p>
                Not financial advice. This is an alpha project. Trade at your
                own risk.
            </p>
            {topPairs?.daily && (
                <TopPairsWidget topPairs={topPairs.daily} mode='daily' />
            )}
            <hr />
            <h3>Top LP Opportunities in the Past 7 Days</h3>
            {topPairs?.weekly && (
                <TopPairsWidget topPairs={topPairs.weekly} mode='weekly' />
            )}
            <TelegramCTA mode='plural' />

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
