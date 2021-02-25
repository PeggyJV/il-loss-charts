import { useEffect, useState } from 'react';
import { Container } from 'react-bootstrap';
import PropTypes from 'prop-types';

import { MarketStats, EthGasPrices } from '@sommelier/shared-types';
import { TopPairsState, Wallet } from 'types/states';

import mixpanel from 'util/mixpanel';
import ManageLiquidityModal from 'components/manage-liquidity-modal';
import TopPairsWidget from 'components/top-pairs-widget';
import TelegramCTA from 'components/telegram-cta';
import ConnectWalletButton from 'components/connect-wallet-button';

function LandingContainer({
    topPairs,
    wallet,
    gasPrices,
    setShowConnectWallet,
}: {
    topPairs: TopPairsState | null;
    wallet: Wallet;
    gasPrices: EthGasPrices | null;
    setShowConnectWallet: (wallet: boolean) => void;
}): JSX.Element {
    const [showAddLiquidity, setShowAddLiquidity] = useState(false);
    const [currentPair, setCurrentPair] = useState<MarketStats | null>(null);

    const showModal = () => setShowConnectWallet(true);
    useEffect(() => {
        mixpanel.track('pageview:landing', {});
    }, []);

    const handleAddLiquidity = (pair: MarketStats) => {
        setCurrentPair(pair);

        // Check if wallet exists, if not show wallet modal
        if (wallet && wallet.account) {
            setShowAddLiquidity(true);
        } else {
            setShowConnectWallet(true);
        }
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
            <ManageLiquidityModal
                show={showAddLiquidity}
                setShow={setShowAddLiquidity}
                wallet={wallet}
                pair={currentPair}
                gasPrices={gasPrices}
            />
            <div className='warning-well'>
                <p>
                    Not financial advice. This is an alpha project. Trade at
                    your own risk.
                    <br />
                    All calculated returns include Impermanent Loss.
                </p>
            </div>
            <div className='header-with-filter'>
                <h4 className='heading-main'>TOP LIQUIDITY POOLS</h4>
                <div>
                    <ConnectWalletButton onClick={showModal} wallet={wallet} />
                </div>
            </div>
            {/* <p>
                <em>
                    * These are the highest return pairs on Uniswap over the past 24 hours.
                </em>
            </p> */}

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
