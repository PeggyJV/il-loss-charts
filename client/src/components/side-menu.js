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
        </>
    );
}

export default SideMenu;