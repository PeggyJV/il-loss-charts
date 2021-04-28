import { useEffect, useState } from 'react';
import { EthGasPrices } from '@sommelier/shared-types';

import { AllPairsState, Wallet } from 'types/states';
import { useBalance } from 'hooks/use-balance';
import { usePairDataOverview } from 'hooks/use-pair-data-overview';

import { TelegramCTA } from 'components/telegram-cta';
import mixpanel from 'util/mixpanel';
import ConnectWalletButton from 'components/connect-wallet-button';
import PendingTx from 'components/pending-tx';
import { PairSearch } from 'components/pair-search';
import { AddLiquidityV3 } from 'components/add-liquidity/add-liquidity-v3';
import { Box } from '@material-ui/core';

function LandingContainer({
    wallet,
    setShowConnectWallet,
    gasPrices
}: {
    allPairs: AllPairsState;
    wallet: Wallet;
    setShowConnectWallet: (wallet: boolean) => void;
    gasPrices: EthGasPrices | null;
}): JSX.Element {
    const [pairId, setPairId] = useState<string | null>(null);
    const pairData = usePairDataOverview(pairId || null);
    const balances = useBalance({
        pairData,
        wallet,
    });

    (window as any).pairId = pairId;
    (window as any).balances = balances;

    const showWalletModal = () => setShowConnectWallet(true);
    useEffect(() => {
        try {
            mixpanel.track('pageview:landing', {});
        } catch (e) {
            console.error(`Metrics error on add positions:landing.`);
        }
    }, []);

    return (
        <div>
            <div className='main-header-container'>
                <div className='nav-button-container'>
                    <h5 className='logo-title'>SOMMELIER FINANCE</h5>
                    <TelegramCTA />
                </div>
                <div className='wallet-combo'>
                    {wallet?.account && <PendingTx />}
                    <ConnectWalletButton onClick={showWalletModal} wallet={wallet} />
                </div>
            </div>
            <PairSearch  setPairId={setPairId} />
            <Box display='flex' justifyContent='space-around'>
                <AddLiquidityV3
                    wallet={wallet}
                    pairData={pairData}
                    balances={balances}
                    gasPrices={gasPrices}
                />
            </Box>
        </div>
    );
}

export default LandingContainer;
