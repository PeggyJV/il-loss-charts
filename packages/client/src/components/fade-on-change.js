import { useTransition, animated } from 'react-spring';

function FadeOnChange({ children }) {
    const transitions = useTransition(children, null, {
        from: { position: 'absolute', opacity: 0 },
        enter: { opacity: 1 },
        update: { position: 'absolute', opacity: 1 },
        leave: { opacity: 0 },
        duration: 500,
    });

    return transitions.map(({ item, key, props }) =>
        <animated.div key={key} style={props}>{item}</animated.div>
    )
}

export default FadeOnChange;