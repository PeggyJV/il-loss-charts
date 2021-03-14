import { useEffect, useState, useMemo } from 'react';
import { Combobox } from 'react-widgets';

import { IUniswapPair, Token } from '@sommelier/shared-types';
import { AllPairsState } from 'types/states';

import { PairWithLogo } from 'components/token-with-logo';

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSearch } from '@fortawesome/free-solid-svg-icons';

type SearchKeys = { [searchKey: string]: IUniswapPair };

function PairSearch({
    pairs,
    setPair,
}: {
    pairs: IUniswapPair[];
    setPair: (pairId: string) => void;
}): JSX.Element {
    const [currentValue, setCurrentValue] = useState<IUniswapPair | null>(null);

    const searchKeys: SearchKeys = useMemo(
        (): SearchKeys =>
            pairs.reduce((acc: SearchKeys, pair: IUniswapPair) => {
                const symbol0 = (pair.token0 as Token).symbol.toLowerCase();
                const symbol1 = (pair.token1 as Token).symbol.toLowerCase();
                const symbolCombined = `${symbol0}/${symbol1}`;
                const address = pair.id.toLowerCase();

                acc[address] = pair;
                acc[symbolCombined] = pair;

                return acc;
            }, {}),
        [pairs]
    );

    // TODO: allow searching by token name or address
    // Update actual pair if current value matches a given ID
    useEffect(() => {
        if (typeof currentValue === 'string') {
            if (searchKeys[currentValue]) {
                setPair(searchKeys[currentValue].id);
            }

            return;
        }

        if (currentValue?.id) setPair(currentValue.id);
    }, [currentValue, searchKeys]);

    const lookForPair = (pair: IUniswapPair, value: string) => {
        const search = value.toLowerCase();
        const symbol0 = (pair.token0 as Token).symbol.toLowerCase();
        const symbol1 = (pair.token1 as Token).symbol.toLowerCase();
        const symbolCombined = `${symbol0}/${symbol1}`;
        const address = pair.id.toLowerCase();

        return [symbol0, symbol1, symbolCombined, address].some(
            (value) => value.indexOf(search) > -1
        );
    };

    const renderTextField = (item: string | IUniswapPair) => {
        if (typeof item === 'string' || !item) {
            return item;
        }

        const symbol0 = (item.token0 as Token).symbol.toUpperCase();
        const symbol1 = (item.token1 as Token).symbol.toUpperCase();
        return `${symbol0}/${symbol1}`;
    };

    return (
        <Combobox
            // @ts-expect-error: className is not on the props definition but does propagate to component
            className='pair-search'
            placeholder='Search for pairs and tokens by symbol or address...'
            busy
            busySpinner={<FontAwesomeIcon icon={faSearch} />}
            data={pairs}
            textField={renderTextField}
            value={currentValue}
            itemComponent={({ item }) => <PairWithLogo pair={item} />}
            // itemComponent={({ item }) => { console.log('THIS IS ITEM', item); return <div />; }}
            filter={lookForPair}
            caseSensitive={false}
            onChange={setCurrentValue}
        />
    );
}

export default PairSearch;
