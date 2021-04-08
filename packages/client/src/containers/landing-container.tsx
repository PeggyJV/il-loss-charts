import { useEffect, useState } from 'react';
import { Container } from 'react-bootstrap';
import PropTypes from 'prop-types';
import { LPPositionData } from '@sommelier/shared-types';
import { ErrorBoundary } from 'react-error-boundary';
import { AllPairsState, TopPairsState, Wallet } from 'types/states';
import PositionsTable from 'components/positions-table';
import { TelegramCTA } from 'components/telegram-cta';
import { ComponentError } from 'components/page-error';
import { UniswapApiFetcher as Uniswap } from 'services/api';
import mixpanel from 'util/mixpanel';
import TopPairsWidget from 'components/top-pairs-widget';
import ConnectWalletButton from 'components/connect-wallet-button';
import PendingTx from 'components/pending-tx';
<<<<<<< HEAD
import SearchContainer from 'containers/search-container';
=======
import {AddLiquidityV3} from 'components/add-liquidity/add-liquidity-v3';
>>>>>>> f83416b... WIP: add-liquidity-v3 component

function LandingContainer({
    allPairs,
    topPairs,
    wallet,
    setShowConnectWallet,
    handleAddLiquidity,
}: {
    allPairs: AllPairsState;
    topPairs: TopPairsState | null;
    wallet: Wallet;
    setShowConnectWallet: (wallet: boolean) => void;
    handleAddLiquidity: (paidId: string) => void;
}): JSX.Element {
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

            try {
                mixpanel.track('positions:query', {
                    distinct_id: wallet.account,
                    address: wallet.account,
                });
            } catch (e) {
                console.error(`Metrics error on add positions:query.`);
            }
        };

        if (wallet.account) {
            void fetchPositionsForWallet();
        }

        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [wallet.account]);

    const showModal = () => setShowConnectWallet(true);
    useEffect(() => {
        try {
            mixpanel.track('pageview:landing', {});
        } catch (e) {
            console.error(`Metrics error on add positions:landing.`);
        }
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
        <div>
            <div className='main-header-container'>
                <div className='nav-button-container'>
                <h5 className='logo-title'>SOMMELIER FINANCE</h5>
                    <TelegramCTA />
                </div>
                <div className='wallet-combo'>
                    {wallet?.account && <PendingTx />}
                    <ConnectWalletButton onClick={showModal} wallet={wallet} />
                </div>
            </div>
            {/* <div className='alert-well'>
                <p>
                    This is not financial advice. This is an alpha project.
                    Trade at your own risk. All calculated returns include
                    Impermanent Loss.
                </p>
            </div> */}
            <SearchContainer allPairs={allPairs} />
            <AddLiquidityV3 balances={balances}/>
            {wallet.account && positionData && (
                <>
                    <h4 className='heading-main'>Open Positions</h4>
                    <ErrorBoundary FallbackComponent={ComponentError}>
                        <PositionsTable
                            positionData={positionData}
                            pairId={pairId as string}
                            setPairId={setPairId}
                            handleAddLiquidity={handleAddLiquidity}
                        />
                    </ErrorBoundary>
                </>
            )}
            {/* <div className='header-with-filter'>
                <h4 className='heading-main'>
                    TOP LIQUIDITY POOLS :: 24 Hours
                </h4>
            </div> */}
            {/* <p>
                <em>
                    * These are the highest return pairs on Uniswap over the past 24 hours.
                </em>
            </p> */}

            {/* {topPairs?.daily && (
                <ErrorBoundary FallbackComponent={ComponentError}>
                    <TopPairsWidget
                        topPairs={topPairs.daily}
                        mode='daily'
                        handleAddLiquidity={handleAddLiquidity}
                    />
                </ErrorBoundary>
            )}
            <hr />
            <h4 className='heading-main'>TOP LIQUIDITY POOLS :: 7 Days</h4>

            {topPairs?.weekly && (
                <ErrorBoundary FallbackComponent={ComponentError}>
                    <TopPairsWidget
                        topPairs={topPairs.weekly}
                        mode='weekly'
                        handleAddLiquidity={handleAddLiquidity}
                    />
                </ErrorBoundary>
            )} */}

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
