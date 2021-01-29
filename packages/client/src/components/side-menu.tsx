import { push as Menu } from 'react-burger-menu';
import { NavLink, useLocation } from 'react-router-dom';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import ConnectWalletButton from 'components/connect-wallet-button';

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChartArea, faHandHoldingUsd, faSearchDollar, faCalculator } from '@fortawesome/free-solid-svg-icons';
import { faTelegram } from '@fortawesome/free-brands-svg-icons';

import 'styles/burger-menu.scss';
import { Wallet } from 'types/states';

function SideMenu({ setShowConnectWallet, wallet }: {
    setShowConnectWallet: (wallet: boolean) => void,
    wallet: Wallet
}): JSX.Element {
    const location = useLocation();
    const showModal = () => setShowConnectWallet(true);

    const getSideLinkClass = (path: string) =>
        classNames({
            'side-menu-link': true,
            'side-menu-active': path === location.pathname
        });

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
            <div>
                <ConnectWalletButton onClick={showModal} wallet={wallet} />
            </div>
            <p className={getSideLinkClass('/')}>
                <NavLink to='/'>
                    <FontAwesomeIcon icon={faSearchDollar} />
                    {' '}LP Opportunities
                </NavLink>
            </p>
            <p className={getSideLinkClass('/market')}>
                <NavLink to='/market'>
                    <FontAwesomeIcon icon={faChartArea} />
                    {' '}Market Overview
                </NavLink>
            </p>
            {/* <p className={getSideLinkClass('/positions')}>{wallet?.account ?
                <NavLink to={`/positions`}>
                    <FontAwesomeIcon icon={faHandHoldingUsd} />
                    {' '}LP Positions
                </NavLink> :
                <NavLink to='#' className='disabled-link'>
                    <FontAwesomeIcon icon={faHandHoldingUsd} />
                    {' '}LP Positions
                </NavLink>
            }
            </p> */}
            <p className={getSideLinkClass('/pair')}>
                <NavLink to='/pair'>
                    <FontAwesomeIcon icon={faCalculator} />
                    {' '}IL Calculator
                </NavLink>
            </p>
            <hr />
            <h6>
                <a href='https://t.me/getsomm'>
                    <FontAwesomeIcon icon={faTelegram} />
                    {' '}
                    Join the Community
                </a>
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
