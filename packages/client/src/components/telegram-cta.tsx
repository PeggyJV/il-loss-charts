import PropTypes from 'prop-types';

function TelegramCTA(): JSX.Element {
    return (
        <div className='telegram-cta'>
            <hr />
            <p>
                <a href='https://t.me/getsomm_alerts'>🍷 Join the Community!</a>
            </p>
            <hr />
        </div>
    );
}

TelegramCTA.propTypes = { mode: PropTypes.oneOf(['single', 'plural']) };

export default TelegramCTA;
