import { ReactChild } from 'react';
import { useTransition, animated } from 'react-spring';

function FadeOnChange({ children }: { children: ReactChild }): JSX.Element {
    const transitions = useTransition(children, null, {
        from: { position: 'absolute', opacity: 0 },
        enter: { opacity: 1 },
        update: { position: 'absolute', opacity: 1 },
        leave: { opacity: 0 },
        duration: 500,
    } as any); // 'duration' is allowed but not in typedef

    return (
        <>
            {transitions.map(({ item, key, props }) => (
                <animated.span key={key} style={props}>
                    {item}
                </animated.span>
            ))}
        </>
    );
}

export default FadeOnChange;
