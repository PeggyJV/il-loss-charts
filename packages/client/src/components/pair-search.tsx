import { useEffect, useState, useMemo } from 'react';
// import { Combobox } from 'react-widgets';

import { UniswapPair } from '@sommelier/shared-types';

import { PairWithLogo } from 'components/token-with-logo';
import { matchSorter } from 'match-sorter';
import { useThrottle } from 'react-use';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSearch } from '@fortawesome/free-solid-svg-icons';
import {
    Combobox,
    ComboboxInput,
    ComboboxPopover,
    ComboboxList,
    ComboboxOption,
    ComboboxOptionText,
} from '@reach/combobox';
import { keys } from 'highcharts';
import { SearchSource } from '@jest/core';
type SearchKeys = { [searchKey: string]: UniswapPair };

function useMemoizedPairs(pairs: UniswapPair[]): SearchKeys {
    return useMemo(
        (): SearchKeys =>
            pairs.reduce((acc: SearchKeys, pair: UniswapPair) => {
                const address = pair.id.toLowerCase();

                acc[address] = pair;
                acc[pair.pairReadable] = pair;

                return acc;
            }, {}),
        [pairs]
    );
}

function usePairMatch(searchValue: string, pairs: UniswapPair[]) {
    const throttledTerm = useThrottle(searchValue, 100);
    return useMemo(
        () =>
            matchSorter(pairs, searchValue, {
                threshold: matchSorter.rankings.STARTS_WITH,
                keys: ['token0.symbol'],
            }),
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [throttledTerm]
    );
}

function PairSearch({
    pairs,
    setPair,
}: {
    pairs: UniswapPair[];
    setPair: (pairId: string) => void;
}): JSX.Element {
    const [currentValue, setCurrentValue] = useState<string>('');
    const memoizedPairs = useMemoizedPairs(pairs);
    const matchingPairs = usePairMatch(currentValue, pairs);
    // TODO: allow searching by token name or address
    // Update actual pair if current value matches a given ID
    useEffect(() => {
        if (typeof currentValue === 'string') {
            if (memoizedPairs[currentValue]) {
                setPair(memoizedPairs[currentValue].id);
            }

            return;
        }

        // if (currentValue?.id) setPair(currentValue.id);

        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [currentValue]);

    // const lookForPair = (pair: UniswapPair, value: string) => {
    //     console.log('look for pair');
    //     const search = value.toLowerCase();
    //     const symbol0 = pair.token0.symbol.toLowerCase();
    //     const symbol1 = pair.token1.symbol.toLowerCase();
    //     const address = pair.id.toLowerCase();

    //     return [symbol0, symbol1, pair.pairReadable, address].some(
    //         (value) => value.indexOf(search) > -1
    //     );
    // };

    const renderTextField = (item: string | UniswapPair) => {
        if (typeof item === 'string' || !item) {
            return item;
        }

        return item.pairReadable;
    };

    return (
        // <Combobox
        //     // @ts-expect-error: className is not on the props definition but does propagate to component
        //     className='pair-search'
        //     placeholder='Search for pairs and tokens by symbol or address...'
        //     busy
        //     busySpinner={<FontAwesomeIcon icon={faSearch} />}
        //     data={pairs}
        //     textField={renderTextField}
        //     value={currentValue}
        //     itemComponent={({ item }) => <div>{'foo'}</div>}
        //     // itemComponent={({ item }) => { console.log('THIS IS ITEM', item); return <div />; }}
        //     filter={lookForPair}
        //     caseSensitive={false}
        //     onChange={setCurrentValue}
        // />
        <Combobox aria-label='pair-search'>
            <ComboboxInput
                onChange={(ev) => setCurrentValue(ev.target.value)}
            />
            {matchingPairs && (
                <ComboboxPopover>
                    <ComboboxList>
                        {matchingPairs.map((pair, index) => (
                            <ComboboxOption
                                key={index}
                                value={pair.pairReadable}
                            />
                        ))}
                    </ComboboxList>
                </ComboboxPopover>
            )}
        </Combobox>
    );
}

export default PairSearch;
