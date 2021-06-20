import { EthGasPrices } from '@sommelier/shared-types';
import { TelegramCTA, TwitterCTA, BlogCTA } from 'components/social-cta';
import { LiquidityContainer } from 'containers/liquidity-container';
import { useMediaQuery } from 'react-responsive';
import { AppHeader } from 'components/app-header/app-header';
import { Box } from '@material-ui/core';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faDiscord } from '@fortawesome/free-brands-svg-icons';
function LandingContainer({
    gasPrices,
}: {
    gasPrices: EthGasPrices | null;
}): JSX.Element {
    const isMobile = useMediaQuery({ query: '(max-width: 800px)' });

    return (
        <div>
            <AppHeader />
            <Box
                display='flex'
                flexDirection='row'
                alignItems='flex-start'
                justifyContent='space-between'
            >
                {!isMobile && (
                    <Box
                        style={{
                            background: 'var(--bgPrimary)',
                            padding: '1.5rem 2rem',
                            borderRadius: '8px',
                            maxWidth: '220px',
                            fontSize: '1.15rem',
                            boxShadow: '0 3px 12px var(--bgDeep)',
                        }}
                    >
                        <p>The easiest way to add liquidity on Uniswap v3</p>
                        <br />
                        <Box>
                            <TelegramCTA />
                            <TwitterCTA />
                            <BlogCTA />
                        </Box>
                    </Box>
                )}
                <LiquidityContainer gasPrices={gasPrices} />
            </Box>
            <Box
                display='flex'
                alignItems='center'
                className='footer-tab-container'
            >
                <a
                    className='support-tab'
                    href='https://discord.gg/VXyUgtnbtv'
                    target='_blank'
                    rel='noreferrer'
                >
                    <FontAwesomeIcon icon={faDiscord} />
                    &nbsp;
                    <p>Support</p>
                </a>
            </Box>
        </div>
    );
}

export default LandingContainer;
