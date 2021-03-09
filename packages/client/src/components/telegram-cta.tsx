import PropTypes from 'prop-types';

function TelegramCTA({
    mode = 'single',
}: {
    mode?: 'single' | 'plural';
}): JSX.Element {
    return (
        <div className='telegram-cta'>
            <hr />
            {/* <p>
                🍷 Track impermanent loss for {mode === 'plural' ? 'these pairs' : 'this pair'} (and many others) on the{' '}
                <a href='https://t.me/getsomm_alerts'>
                    Sommelier IL Alerts Telegram!
                </a>
            </p> */}
            <p>
                <a href='https://t.me/getsomm_alerts'>🍷 Join the Community!</a>
            </p>
            <hr />
        </div>
    );
}

TelegramCTA.propTypes = { mode: PropTypes.oneOf(['single', 'plural']) };

export default TelegramCTA;
