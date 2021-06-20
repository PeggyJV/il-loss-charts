import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTwitter } from '@fortawesome/free-brands-svg-icons';
import { faPaperPlane, faBlog } from '@fortawesome/free-solid-svg-icons';
import { Box } from '@material-ui/core';

export const TelegramCTA = (): JSX.Element => {
    return (
        <Box display='flex' alignItems='center' className='social-cta'>
            <FontAwesomeIcon icon={faPaperPlane} />
            &nbsp;
            <p>
                <a href='https://t.me/getsomm' target='_blank' rel='noreferrer'>
                    Join our community
                </a>
            </p>
        </Box>
    );
};

export const TwitterCTA = (): JSX.Element => {
    return (
        <Box display='flex' alignItems='center' className='social-cta'>
            <FontAwesomeIcon icon={faTwitter} />
            &nbsp;
            <p>
                <a
                    href='https://twitter.com/sommfinance'
                    target='_blank'
                    rel='noreferrer'
                >
                    {' '}
                    Follow our Twitter
                </a>
            </p>
        </Box>
    );
};

export const BlogCTA = (): JSX.Element => {
    return (
        <Box display='flex' alignItems='center' className='social-cta'>
            <FontAwesomeIcon icon={faBlog} />
            &nbsp;
            <p>
                <a
                    href='https://sommelier.finance/blog'
                    target='_blank'
                    rel='noreferrer'
                >
                    Read our Blog
                </a>
            </p>
        </Box>
    );
};
