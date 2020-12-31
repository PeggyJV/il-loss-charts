// import { useTransition, animated } from 'react-spring';

function UpdatingText({ children }) {
    // const transitions = useTransition(children, null, {
    //     from: { opacity: 0 },
    //     enter: { opacity: 1 },
    //     leave: { opacity: 0 },
    // });
    // return transitions.map(({ item, key, props }) =>
    //     <animated.span key={key} style={props}>{item}</animated.span>
    // );

    return <span className='text-fade'>{children}</span>;
}

export default UpdatingText;