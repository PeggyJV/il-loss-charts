import { useEffect, useState } from 'react';
import { Container } from 'react-bootstrap';
import PropTypes from 'prop-types';
import { MarketStats, EthGasPrices } from '@sommelier/shared-types';
import { TopPairsState, Wallet } from 'types/states';
import PositionsTable from 'components/positions-table';
import { UniswapApiFetcher as Uniswap } from 'services/api';
import { LPPositionData, Token } from '@sommelier/shared-types';

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
    const [currentPairId, setCurrentPairId] = useState<string | null>(null);

    const [isLoading, setIsLoading] = useState(false);
    const [isInitialLoad, setIsInitialLoad] = useState(true);
    const [currentError, setError] = useState<string | null>(null);
    const [
        positionData,
        setPositionData,
    ] = useState<LPPositionData<string> | null>(null);

    const [pairId, setPairId] = useState(
        positionData?.positions ? Object.keys(positionData.positions)[0] : null
    );

    (window as any).positionData = positionData;
    (window as any).pairId = pairId;

    useEffect(() => {
        const fetchPositionsForWallet = async () => {
            if (!isLoading) setIsLoading(true);
            if (currentError || !wallet.account) return;

            const {
                data: positionData,
                error,
            } = await Uniswap.getPositionStats(wallet.account);

            if (error) {
                // we could not list pairs
                console.warn(`Could not get position stats: ${error}`);
                setError(error);
                return;
            }

            if (positionData) {
                setPositionData(positionData);
                console.log('setting position data');
            }

            setIsLoading(false);
            if (isInitialLoad) setIsInitialLoad(false);

            mixpanel.track('positions:query', {
                address: wallet.account,
            });
        };

        if (wallet.account) {
            void fetchPositionsForWallet();
        }

        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [wallet.account]);

    const showModal = () => setShowConnectWallet(true);
    useEffect(() => {
        mixpanel.track('pageview:landing', {});
    }, []);

    const handleAddLiquidity = (pairId: string) => {
        setCurrentPairId(pairId);

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
                pairId={currentPairId}
                gasPrices={gasPrices}
            />
            <div>
                <ConnectWalletButton onClick={showModal} wallet={wallet} />
            </div>
            <div className='warning-well'>
                <p>
                    Not financial advice. This is an alpha project. Trade at
                    your own risk. All calculated returns include Impermanent
                    Loss.
                </p>
                <p>*All calculated returns include Impermanent Loss.</p>
            </div>
            {wallet.account && positionData && (
                <>
                    <h4 className='heading-main'>Open Positions</h4>
                    <PositionsTable
                        positionData={positionData}
                        pairId={pairId as string}
                        setPairId={setPairId}
                        handleAddLiquidity={handleAddLiquidity}
                    />
                </>
            )}
            <div className='header-with-filter'>
                <h4 className='heading-main'>
                    TOP LIQUIDITY POOLS :: 24 Hours
                </h4>
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
            <h4 className='heading-main'>TOP LIQUIDITY POOLS :: 7 Days</h4>

            {topPairs?.weekly && (
                <TopPairsWidget
                    topPairs={topPairs.weekly}
                    mode='weekly'
                    handleAddLiquidity={handleAddLiquidity}
                />
            )}

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
