import { useEffect, useState } from 'react';
import { InputGroup } from 'react-bootstrap';
import { Combobox } from 'react-widgets';
import PropTypes from 'prop-types';

import { IUniswapPair } from '@sommelier/shared-types';

import { Pair } from 'constants/prop-types';
import TokenWithLogo, { resolveLogo } from 'components/token-with-logo';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faRetweet } from '@fortawesome/free-solid-svg-icons';

function PairSelector({
    pairs,
    currentPairId,
    setPair,
    isLoading,
}: {
    pairs: IUniswapPair[];
    currentPairId: string;
    setPair: (pairId: string) => void;
    isLoading: boolean;
}): JSX.Element {
    let defaultValue = pairs[0];
    for (const pair of pairs) {
        if (pair.id === currentPairId) {
            defaultValue = pair;
            break;
        }
    }

    const [currentValue, setCurrentValue] = useState<IUniswapPair>(
        defaultValue,
    );

    const leftSideOptions = [];
    const rightSideOptions = [];

    for (const pair of pairs) {
        if (pair.token1.symbol === defaultValue.token1.symbol) {
            leftSideOptions.push(pair);
        }

        if (pair.token0.symbol === defaultValue.token0.symbol) {
            rightSideOptions.push(pair);
        }
    }

    // Update actual pair if current value matches a given ID
    useEffect(() => {
        if (typeof currentValue === 'string') {
            return;
        }

        if (currentValue?.id) setPair(currentValue.id);
    }, [currentValue, setPair]);

    const renderPairText = (side: 'left' | 'right') => (
        pair: string | IUniswapPair,
    ): string => {
        // If pair is string, it's typed in so return
        if (typeof pair === 'string') return pair;

        const token = side === 'left' ? 'token0' : 'token1';
        return pair[token].symbol;
    };

    const handleChange = (side: 'left' | 'right') => (
        value: string | IUniswapPair,
    ): void => {
        // If pair is string, it's typed in
        // so just override one side
        if (typeof value === 'string') {
            const token = side === 'left' ? 'token0' : 'token1';
            setCurrentValue((current: IUniswapPair) => ({
                ...current,
                id: '',
                [token]: {
                    ...[current[token]],
                    symbol: value,
                },
            }));
        } else {
            setCurrentValue(value);
        }
    };

    return (
        <div className='pair-selector-container'>
            <InputGroup>
                <InputGroup.Prepend className='token-logo'>
                    <InputGroup.Text className='logo-span'>
                        {resolveLogo(defaultValue.token0.id)}
                    </InputGroup.Text>
                </InputGroup.Prepend>
                <Combobox
                    // @ts-expect-error: className is not on the props definition but does propagate to component
                    className='pair-selector'
                    data={leftSideOptions}
                    value={currentValue}
                    textField={renderPairText('left')}
                    itemComponent={TokenWithLogo('left')}
                    defaultValue={defaultValue}
                    filter='contains'
                    caseSensitive={false}
                    onChange={handleChange('left')}
                />
            </InputGroup>
            {isLoading ? (
                <div className='wine-spin pair-selector-separator'>🍷</div>
            ) : (
                <div>
                    <FontAwesomeIcon icon={faRetweet} />
                </div>
            )}
            <InputGroup>
                <InputGroup.Prepend className='token-logo'>
                    <InputGroup.Text className='logo-span'>
                        {resolveLogo(defaultValue.token1.id)}
                    </InputGroup.Text>
                </InputGroup.Prepend>
                <Combobox
                    // @ts-expect-error: className is not on the props definition but does propagate to component
                    className='pair-selector'
                    data={rightSideOptions}
                    value={currentValue}
                    textField={renderPairText('right')}
                    itemComponent={TokenWithLogo('right')}
                    defaultValue={defaultValue}
                    filter='contains'
                    caseSensitive={false}
                    onChange={handleChange('right')}
                />
            </InputGroup>
        </div>
    );
}

PairSelector.propTypes = {
    pairs: PropTypes.arrayOf(Pair).isRequired,
    currentPairId: PropTypes.string.isRequired,
    setPair: PropTypes.func.isRequired,
    isLoading: PropTypes.bool.isRequired,
};

export default PairSelector;
