import { NavLink } from 'react-router-dom';
import ConnectWalletButton from 'components/connect-wallet';

function SideMenu() {
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
            <ConnectWalletButton />
            <hr />
            <h6 className='centered'>
                <a href='https://t.me/getsomm'>Join the Sommelier Community</a>
            </h6>
        </>
    );
}

export default SideMenu;
