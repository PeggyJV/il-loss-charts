import { useEffect, useState } from 'react';
import { EthGasPrices } from '@sommelier/shared-types';

import { AllPairsState } from 'types/states';
import { useBalance } from 'hooks/use-balance';
import { usePoolOverview } from 'hooks/data-fetchers';
import { useWallet } from 'hooks/use-wallet';
import { TelegramCTA } from 'components/telegram-cta';
import mixpanel from 'util/mixpanel';
import ConnectWalletButton from 'components/connect-wallet-button';
import PendingTx from 'components/pending-tx';
import { PoolSearch } from 'components/pool-search';
import { AddLiquidityV3 } from 'components/add-liquidity/add-liquidity-v3';
import { Box } from '@material-ui/core';
import { debug } from 'util/debug';

function LandingContainer({
    setShowConnectWallet,
    gasPrices,
}: {
    allPairs: AllPairsState;
    setShowConnectWallet: (wallet: boolean) => void;
    gasPrices: EthGasPrices | null;
}): JSX.Element {
    const [poolId, setPoolId] = useState<string | null>(null);
    const { data: pool } = usePoolOverview('rinkeby', poolId);
    const {wallet} = useWallet();
    const balances = useBalance({
        pool,
    });

    debug.poolId = poolId;
    debug.balances = balances;

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
                    <ConnectWalletButton onClick={showWalletModal} />
                </div>
            </div>
            <PoolSearch setPoolId={setPoolId} />
            <Box display='flex' justifyContent='space-around'>
                <AddLiquidityV3
                    pool={pool}
                    balances={balances}
                    gasPrices={gasPrices}
                />
            </Box>
        </div>
    );
}

export default LandingContainer;
