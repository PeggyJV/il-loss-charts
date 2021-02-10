import { useEffect, useState } from 'react';
import { Container } from 'react-bootstrap';
import PropTypes from 'prop-types';

import { MarketStats } from '@sommelier/shared-types';
import { TopPairsState, Wallet } from 'types/states';
import mixpanel from 'util/mixpanel';

import { UniswapApiFetcher as Uniswap } from 'services/api';

import AddLiquidityModal from 'components/add-liquidity-modal';
import TopPairsWidget from 'components/top-pairs-widget';
import TelegramCTA from 'components/telegram-cta';
function LandingContainer({
    topPairs,
    wallet
}: {
    topPairs: TopPairsState | null;
    wallet: Wallet;
}): JSX.Element {
    const [showAddLiquidity, setShowAddLiquidity] = useState(false);
    const [currentError, setError] = useState<string | null>(null);
    const [currentPair, setCurrentPair] = useState<MarketStats | null>(null);

    useEffect(() => {
        mixpanel.track('pageview:landing', {});
    }, []);

    const handleAddLiquidity = (pair: MarketStats) => {
        setShowAddLiquidity(true);
        setCurrentPair(pair);
    };

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
        <div>
            <AddLiquidityModal
                show={showAddLiquidity}
                setShow={setShowAddLiquidity}
                wallet={wallet}
                pair={currentPair}
            />
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
            <p>All calculated returns include Impermanent Loss.</p>
            {topPairs?.daily && (
                <TopPairsWidget
                    topPairs={topPairs.daily}
                    mode='daily'
                    handleAddLiquidity={handleAddLiquidity}
                />
            )}
            <hr />
            <h3>Top LP Opportunities in the Past 7 Days</h3>
            <p>All calculated returns include Impermanent Loss.</p>
            {topPairs?.weekly && (
                <TopPairsWidget
                    topPairs={topPairs.weekly}
                    mode='weekly'
                    handleAddLiquidity={handleAddLiquidity}
                />
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

LandingContainer.propTypes = {
    wallet: PropTypes.shape({
        account: PropTypes.string,
        providerName: PropTypes.string,
        provider: PropTypes.object,
    }).isRequired,
};

export default LandingContainer;
