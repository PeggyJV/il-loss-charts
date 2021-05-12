import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPaperPlane } from '@fortawesome/free-solid-svg-icons';
import {Box} from '@material-ui/core';

export const TelegramCTA = (): JSX.Element => {
    return (
        <Box display='flex' alignItems='center' className='telegram-cta'>
            <FontAwesomeIcon icon={faPaperPlane} />
            &nbsp;
            <p>
                <a href='https://t.me/getsomm' target='_blank' rel='noreferrer'>
                    {/* 🍷 JOIN OUR COMMUNITY */}
                    Join our community
                </a>
            </p>
        </Box>
    );
};
