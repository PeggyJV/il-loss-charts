import { useEffect, useState } from 'react';
import { Container } from 'react-bootstrap';

import { MarketStats } from '@sommelier/shared-types';
import { IError } from 'types/states';

import { UniswapApiFetcher as Uniswap } from 'services/api';
import TopPairsWidget from 'components/top-pairs-widget';
import TelegramCTA from 'components/telegram-cta';

function LandingContainer(): JSX.Element {
    const [marketData, setMarketData] = useState<MarketStats[] | null>(null);
    const [topPairs, setTopPairs] = useState<MarketStats[] | null>(null);
    const [currentError, setError] = useState<IError | null>(null);

    useEffect(() => {
        const fetchMarketData = async () => {
            // Fetch all pairs
            const [
                { data: marketData, error: marketDataError },
                { data: topPairs, error: topPairsError }
            ] = await Promise.all([
                Uniswap.getMarketData(),
                Uniswap.getTopPerformingPairs()
            ]);

            const error = marketDataError ?? topPairsError;

            if (error) {
                // we could not get our market data
                console.warn(`Could not fetch market data: ${error.message}`);
                setError(error);
                return;
            }

            if (marketData) {
                setMarketData(marketData);
            }

            if (topPairs) {
                setTopPairs(topPairs);
            }

        };
        void fetchMarketData();
    }, []);

    (window as any).marketData = marketData;
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
            <h3>Top 5 LP Opportunities on Uniswap</h3>
            {/* <p>
                <em>
                    * These are the highest return pairs on Uniswap over the past 24 hours.
                </em>
            </p> */}
            <p>Not financial advice. This is an alpha project. Trade at your own risk.</p>
            {topPairs && <TopPairsWidget topPairs={topPairs} />}
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
