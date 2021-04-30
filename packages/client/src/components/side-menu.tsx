import { push as Menu } from 'react-burger-menu';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { useMediaQuery } from 'react-responsive';
import classNames from 'classnames';
import { Wallet } from 'types/states';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faChartArea,
    faSearch,
    faSearchDollar,
    faCalculator,
} from '@fortawesome/free-solid-svg-icons';
import ConnectWalletButton from 'components/connect-wallet-button';

import 'styles/burger-menu.scss';

function SideMenu({
    setShowConnectWallet,
}: {
    wallet: Wallet;
    setShowConnectWallet: (wallet: boolean) => void;
}): JSX.Element {
    const location = useLocation();
    const isMobile = useMediaQuery({ query: '(max-width: 500px)' });

    const showModal = () => setShowConnectWallet(true);

    const getSideLinkClass = (path: string) =>
        classNames({
            'side-menu-link': true,
            'side-menu-active': path === location.pathname,
        });

    return (
        <Menu
            isOpen={!isMobile}
            noOverlay={!isMobile}
            customCrossIcon={isMobile ? undefined : false}
            width={250}
            disableCloseOnEsc={true}
            pageWrapId='app-body'
            outerContainerId='app-wrap'
            customBurgerIcon={isMobile ? undefined : false}
        >
            <div>
                <h5 className='side-menu-title'>
                    <Link to={'/'}>SOMMELIER FINANCE</Link>
                </h5>
                <div className='side-menu-connected'>
                    <ConnectWalletButton onClick={showModal} />
                </div>
            </div>
            <div>
                <p className={getSideLinkClass('/search')}>
                    <NavLink to='/search'>
                        <FontAwesomeIcon icon={faSearch} /> Search Pairs
                    </NavLink>
                </p>
                <p className={getSideLinkClass('/')}>
                    <NavLink to='/'>
                        <FontAwesomeIcon icon={faSearchDollar} /> LP
                        Opportunities
                    </NavLink>
                </p>
                <p className={getSideLinkClass('/market')}>
                    <NavLink to='/market'>
                        <FontAwesomeIcon icon={faChartArea} /> Market Overview
                    </NavLink>
                </p>
                {/* <p className={getSideLinkClass('/positions')}>
                    {wallet?.account ? (
                        <NavLink to={`/positions`}>
                            <FontAwesomeIcon icon={faHandHoldingUsd} /> LP
                            Positions
                        </NavLink>
                    ) : (
                        <NavLink to='#' className='disabled-link'>
                            <FontAwesomeIcon icon={faHandHoldingUsd} /> LP
                            Positions
                        </NavLink>
                    )}
                </p> */}
                <p className={getSideLinkClass('/pair')}>
                    <NavLink to='/pair'>
                        <FontAwesomeIcon icon={faCalculator} /> IL Calculator
                    </NavLink>
                </p>
            </div>
        </Menu>
    );
}

export default SideMenu;
