import PropTypes from 'prop-types';

function TelegramCTA({ mode = 'single' }: { mode?: 'single' | 'plural' }): JSX.Element {
    return (
        <>
            <hr />
            {/* <p>
                🍷 Track impermanent loss for {mode === 'plural' ? 'these pairs' : 'this pair'} (and many others) on the{' '}
                <a href='https://t.me/getsomm_alerts'>
                    Sommelier IL Alerts Telegram!
                </a>
            </p> */}
            <p>
                🍷 Join the
                <a href='https://t.me/getsomm_alerts'>
                    {' '}Sommelier.Finance
                </a>
                {' '}Community!
            </p>
            <hr />
        </>
    );
}

TelegramCTA.propTypes = { mode: PropTypes.oneOf(['single', 'plural']) };

export default TelegramCTA;
