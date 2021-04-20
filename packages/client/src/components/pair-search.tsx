import {
    useEffect,
    useState,
    useMemo,
    useRef,
    Dispatch,
    SetStateAction,
} from 'react';
import { Combobox } from 'react-widgets';

import { UniswapPair } from '@sommelier/shared-types';
import Autocomplete from '@material-ui/lab/Autocomplete';
import { matchSorter, MatchSorterOptions } from 'match-sorter';
import { PairWithLogo } from 'components/token-with-logo';
import TextField from '@material-ui/core/TextField';
import { makeStyles, withStyles } from '@material-ui/core/styles';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faSearch,
    faLink,
    faRetweet,
    faWineGlassAlt,
} from '@fortawesome/free-solid-svg-icons';
import './pair-search.scss';
import { resolveLogo } from 'components/token-with-logo';
import NavbarCollapse from 'react-bootstrap/esm/NavbarCollapse';

type SearchKeys = { [searchKey: string]: UniswapPair };

const useStyles = makeStyles(() => ({
    input: {
        color: 'var(--facePrimary)',
        background: 'var(--bgContainer)',
    },
}));

// hack this a little more, TextField is still ugly af
const CssTextField = withStyles({
    root: {
        // '& label.Mui-focused': {
        //     color: 'green',
        // },
        '& .MuiInput-underline:after': {
            border: 0,
            // borderBottomColor: 'var(--bgDeep)',
        },
        '&:hover .MuiInput-underline:after': {
            border: 0,
            // borderBottomColor: 'var(--bgDeep)',
        },
        // '& .MuiOutlinedInput-root': {
        //     '& fieldset': {
        //         borderColor: 'red',
        //     },
        //     '&:hover fieldset': {
        //         borderColor: 'yellow',
        //     },
        //     '&.Mui-focused fieldset': {
        //         borderColor: 'green',
        //     },
        // },
    },
})(TextField);
function PairSearch({
    pairs,
    setPairId,
}: {
    pairs: UniswapPair[];
    setPairId: Dispatch<SetStateAction<string | null>>;
}): JSX.Element {
    // const searchRef = useRef(null);
    // const [currentValue, setCurrentValue] = useState<UniswapPair | null>(null);

    const classes = useStyles();

    const searchKeys: SearchKeys = useMemo(
        (): SearchKeys =>
            pairs.reduce((acc: SearchKeys, pair: UniswapPair) => {
                const address = pair.id.toLowerCase();

                acc[address] = pair;
                acc[pair.pairReadable] = pair;

                return acc;
            }, {}),
        [pairs]
    );

    // TODO: allow searching by token name or address
    // Update actual pair if current value matches a given ID
    // useEffect(() => {
    //     if (typeof currentValue === 'string') {
    //         if (searchKeys[currentValue]) {
    //             setPair(searchKeys[currentValue].id);
    //         }

    //         return;
    //     }

    //     if (currentValue?.id) setPair(currentValue.id);

    //     // eslint-disable-next-line react-hooks/exhaustive-deps
    // }, [currentValue, searchKeys]);

    const lookForPair = (pair: UniswapPair, value: string) => {
        const search = value.toLowerCase();
        const symbol0 = pair.token0.symbol.toLowerCase();
        const symbol1 = pair.token1.symbol.toLowerCase();
        const address = pair.id.toLowerCase();

        return [symbol0, symbol1, pair.pairReadable, address].some(
            (value) => value.indexOf(search) > -1
        );
    };

    function sorter(a: UniswapPair, b: UniswapPair) {
        const pairAReserve = parseInt(a?.volumeUSD);
        const pairBReserve = parseInt(b?.volumeUSD);

        if (pairAReserve > pairBReserve) return -1;

        if (pairBReserve > pairAReserve) return 1;

        return 0;
    }

    const renderTextField = (item: string | UniswapPair) => {
        if (typeof item === 'string' || !item) {
            return item;
        }

        return item.pairReadable;
    };

    const pairFilter = (options: UniswapPair[], { inputValue }: any) =>
        matchSorter(options, inputValue, {
            keys: ['token0.symbol', 'token1.symbol', 'token.pairReadable'],
        }).slice(0, 50);

    const renderPairWithLogo = (pair: UniswapPair) => (
        <div className='pair-option-with-logo'>
            <div className='pair'>
                {resolveLogo(pair?.token0?.id)}&nbsp;&nbsp;
                {pair?.token0?.symbol}
            </div>
            &nbsp;
            {<FontAwesomeIcon icon={faRetweet} />}
            &nbsp;
            <div className='pair'>
                {pair?.token1?.symbol}
                &nbsp;&nbsp;
                {resolveLogo(pair?.token1?.id)}
            </div>
        </div>
    );
    return (
        <Autocomplete
            id='all-pairs'
            options={pairs}
            classes={classes}
            className='mui-pair-search'
            autoHighlight={false}
            autoComplete={false}
            autoSelect={false}
            loading={false}
            debug={true}
            noOptionsText={'Invalid Pair'}
            loadingText={'...loading'}
            onChange={(ev, pair, reason) => {
                console.log(pair?.id);
                pair && setPairId(pair?.id);
            }}
            // eslint-disable-next-line @typescript-eslint/no-unsafe-return
            getOptionLabel={(option) => option.pairReadable}
            style={{ width: 500 }}
            filterOptions={pairFilter}
            renderOption={renderPairWithLogo}
            renderInput={(params) => (
                <CssTextField
                    {...params}
                    className='pair-search-text'
                    style={{
                        border: '1px solid var(--borderAccentAlt)',
                        fontWeight: 400,
                        textTransform: 'uppercase',
                        background: 'var(--bgContainer)',
                    }}
                />
            )}
        />
    );
}

export default PairSearch;
