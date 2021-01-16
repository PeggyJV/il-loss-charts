import { NavLink } from 'react-router-dom';
import PropTypes from 'prop-types';
import ConnectWalletButton from 'components/connect-wallet-button';

function SideMenu({ setShowConnectWallet, wallet }) {
    const showModal = () => setShowConnectWallet(true);

    return (
        <>
            <h5 className='side-menu-title'>sommelier.finance</h5>
            <hr />
            <p>
                <NavLink to='/'>Market Overview</NavLink>
            </p>
            <p>
                <NavLink to='/pair'>IL Calculator</NavLink>
            </p>
            <hr />
            <ConnectWalletButton onClick={showModal} wallet={wallet} />
            <hr />
            <h6 className='centered'>
                <a href='https://t.me/getsomm'>Join the Sommelier Community</a>
            </h6>
        </>
    );
}

SideMenu.propTypes = {
    setShowConnectWallet: PropTypes.func,
    wallet: PropTypes.shape({
        account: PropTypes.string,
        provider: PropTypes.string,
    }).isRequired,
};

export default SideMenu;
