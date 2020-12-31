import { CSSTransition } from 'react-transition-group';

function UpdatingText({ children }) {
    return (
        <CSSTransition
            in={true}
            classNames='fade-update'
            timeout={200}
        >
            {children}
        </CSSTransition>
    );
}

export default UpdatingText;