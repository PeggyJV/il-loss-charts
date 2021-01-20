import Menu from 'react-burger-menu/lib/menus/push';
import { NavLink } from 'react-router-dom';
import PropTypes from 'prop-types';
import ConnectWalletButton from 'components/connect-wallet-button';

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChartArea, faHandHoldingUsd, faSearchDollar } from '@fortawesome/free-solid-svg-icons';

import 'styles/burger-menu.scss';

function SideMenu({ setShowConnectWallet, wallet }) {
    const showModal = () => setShowConnectWallet(true);

    return (
        <Menu
            isOpen
            noOverlay
            customCrossIcon={false}
            width={250}
            pageWrapId='app-body'
            outerContainerId='app-wrap'
        >
            <h5 className='side-menu-title'>sommelier.finance</h5>
            <p className='side-menu-link'>
                <NavLink to='/'>
                    <FontAwesomeIcon icon={faChartArea} />
                    {' '}Market Overview
                </NavLink>
            </p>
            <p className='side-menu-link'>{wallet?.account ?
                <NavLink to={`/positions`}>
                    <FontAwesomeIcon icon={faHandHoldingUsd} />
                    {' '}LP Positions
                </NavLink> :
                <NavLink to='#' className='disabled-link'>
                    <FontAwesomeIcon icon={faHandHoldingUsd} />
                    {' '}LP Positions
                </NavLink>
            }
            </p>
            <p className='side-menu-link'>
                <NavLink to='/pair'>
                    <FontAwesomeIcon icon={faSearchDollar} />
                    {' '}IL Calculator
                </NavLink>
            </p>
            <div>
                <ConnectWalletButton onClick={showModal} wallet={wallet} />
            </div>
            <hr />
            <h6>
                <a href='https://t.me/getsomm'>Join the Community</a>
            </h6>
        </Menu>
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
