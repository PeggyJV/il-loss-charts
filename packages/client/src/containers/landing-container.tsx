import { useEffect } from 'react';
import { EthGasPrices } from '@sommelier/shared-types';

import { useWallet } from 'hooks/use-wallet';
import { TelegramCTA } from 'components/telegram-cta';
import mixpanel from 'util/mixpanel';
import ConnectWalletButton from 'components/connect-wallet-button';
import PendingTx from 'components/pending-tx';
// import { PoolSearch } from 'components/pool-search';
import { LiquidityContainer } from 'containers/liquidity-container';
import { Box } from '@material-ui/core';

function LandingContainer({
    setShowConnectWallet,
    gasPrices,
}: {
    setShowConnectWallet: (wallet: boolean) => void;
    gasPrices: EthGasPrices | null;
}): JSX.Element {
    const { wallet } = useWallet();

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
                    <h5 className='logo-title'>
                        PAIRINGS
                        <span
                            style={{
                                fontFamily: 'cursive',
                                fontSize: '1rem',
                                color: 'var(--faceSecondary)',
                                fontStyle: 'italic',
                                padding: '0 0.5rem',
                            }}
                        >
                            by
                        </span>
                        <span style={{ color: 'var(--faceAccent)' }}>
                            SOMMELIER
                        </span>
                    </h5>
                    <TelegramCTA />
                </div>
                <div className='wallet-combo'>
                    {wallet?.account && <PendingTx />}
                    <ConnectWalletButton onClick={showWalletModal} />
                </div>
            </div>
            <Box
                display='flex'
                flexDirection='column'
                alignItems='center'
                justifyContent='space-around'
            >
                <div style={{ fontSize: '2rem', textAlign: 'center' }}>
                    The easiest way to add liquidity to{' '}
                    <span style={{ color: 'var(--faceAccent)' }}>UNISWAP</span>{' '}
                    <span style={{ color: 'var(--faceAccentAlt)' }}>V3</span>
                </div>
                <br />
                <LiquidityContainer gasPrices={gasPrices} />
            </Box>
        </div>
    );
}

export default LandingContainer;
