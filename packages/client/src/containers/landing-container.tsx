import { EthGasPrices } from '@sommelier/shared-types';
import { TelegramCTA } from 'components/telegram-cta';
import { LiquidityContainer } from 'containers/liquidity-container';
import { AppHeader } from 'components/app-header/app-header';
import { Box } from '@material-ui/core';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faDiscord } from '@fortawesome/free-brands-svg-icons';
function LandingContainer({
    gasPrices,
}: {
    gasPrices: EthGasPrices | null;
}): JSX.Element {
    return (
        <div>
            <AppHeader />
            <Box
                display='flex'
                flexDirection='column'
                alignItems='center'
                justifyContent='space-around'
            >
                <LiquidityContainer gasPrices={gasPrices} />
            </Box>
            <Box
                display='flex'
                alignItems='center'
                className='footer-tab-container'
            >
                {/* <a href='https://t.me/getsomm' target='_blank' rel='noreferrer'>
                    <FontAwesomeIcon icon={faTelegram} />
                </a>
                <a
                    href='https://twitter.com/sommfinance'
                    target='_blank'
                    rel='noreferrer'
                >
                    <FontAwesomeIcon icon={faTwitter} />
                </a> */}
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
