import { useTransition, animated } from 'react-spring';

function UpdatingText({ children }) {
    const transitions = useTransition(children, null, {
        from: { position: 'absolute', opacity: 0 },
        enter: { opacity: 1 },
        update: { position: 'absolute', opacity: 1 },
        leave: { opacity: 0 },
        duration: 500,
    });

    return transitions.map(({ item, key, props }) =>
        <animated.span key={key} style={props}>{item}</animated.span>
    )
}

export default UpdatingText;