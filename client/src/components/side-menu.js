import { Button } from 'react-bootstrap';
import { NavLink } from 'react-router-dom';

function SideMenu() {
    return (
        <>
            <h5 className='side-menu-title'>sommelier.finance</h5>
            <hr />
            <p>
                <NavLink to='/'>
                    Market Overview
                </NavLink>
            </p>
            <p>
                <NavLink to='/pair'>
                    IL Calculator
                </NavLink>
            </p>
            <hr />
            <Button variant='secondary' size='sm' disabled>
                Connect Wallet
            </Button>
            <div style={{ fontSize: '0.8rem' }}>☝️ Coming soon!</div>
        </>
    );
}

export default SideMenu;