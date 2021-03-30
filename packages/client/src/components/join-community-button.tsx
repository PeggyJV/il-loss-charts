import PropTypes from 'prop-types';

function JoinCommunityButton({
    onClick,
}: {
    onClick: () => void;
}): JSX.Element {
    return (
        <>
            <button
                className='join-community-button'
                onClick={onClick}
            >
                JOIN OUR COMMUNITY
            </button>
        </>
    );
}

JoinCommunityButton.propTypes = {
    onClick: PropTypes.func
};

export default JoinCommunityButton;
