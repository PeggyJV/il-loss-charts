import {
    Dispatch,
    SetStateAction,
} from 'react';

import Autocomplete from '@material-ui/lab/Autocomplete';
import { matchSorter } from 'match-sorter';
import TextField from '@material-ui/core/TextField';
import { makeStyles, withStyles } from '@material-ui/core/styles';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faRetweet } from '@fortawesome/free-solid-svg-icons';
import './pair-search.scss';
import { resolveLogo } from 'components/token-with-logo';
import { poolName } from 'util/formats';

import { TopPool, useTopPools } from 'hooks/data-fetchers';

const useStyles = makeStyles(() => ({
    input: {
        color: 'var(--facePrimary)',
        background: 'var(--bgContainer)',
    },
}));

//TODO: hack this a little more, TextField is still ugly af
const CssTextField = withStyles({
    root: {
        '& .MuiInput-underline:after': {
            border: 0,
        },
        '&:hover .MuiInput-underline:after': {
            border: 0,
        },
    },
})(TextField);
export function PoolSearch({
    setPoolId,
}: {
    setPoolId: Dispatch<SetStateAction<string | null>>;
}): JSX.Element {
    const classes = useStyles();
    const { data: pools, isLoading: isTopPoolsLoading } = useTopPools();
    if (isTopPoolsLoading || !pools) {
        return (
            <div className='loading-container'>
                <div className='wine-pulse'>🍷</div>
            </div>
        )
    }

    // function sorter(a: UniswapPair, b: UniswapPair) {
    //     const pairAReserve = parseInt(a?.volumeUSD);
    //     const pairBReserve = parseInt(b?.volumeUSD);

    //     if (pairAReserve > pairBReserve) return -1;

    //     if (pairBReserve > pairAReserve) return 1;

    //     return 0;
    // }

    const poolFilter = (options: TopPool[], { inputValue }: any) =>
        matchSorter(options, inputValue, {
            keys: ['token0.symbol', 'token1.symbol', poolName],
        }).slice(0, 50);

    const renderPoolWithLogo = (pool: TopPool) => (
        <div className='pair-option-with-logo'>
            <div className='pair'>
                {resolveLogo(pool?.token0?.id)}&nbsp;&nbsp;
                {pool?.token0?.symbol}
            </div>
            &nbsp;
            {<FontAwesomeIcon icon={faRetweet} />}
            &nbsp;
            <div className='pair'>
                {pool?.token1?.symbol}
                &nbsp;&nbsp;
                {resolveLogo(pool?.token1?.id)}
            </div>
        </div>
    );
    return (
        <div className='pair-search-container'>
            <h4 className='heading-main'>SEARCH UNISWAP V3 POOLS</h4>
            <Autocomplete
                id='all-pairs'
                options={pools}
                classes={classes}
                className='mui-pair-search'
                autoHighlight={false}
                autoComplete={false}
                autoSelect={false}
                loading={false}
                debug={true}
                noOptionsText={'Invalid Pair'}
                loadingText={'...loading'}
                onChange={(_, pool) => {
                    console.log('setting pool id in pool search', pool?.id)
                    pool && setPoolId(pool?.id);
                }}
                // eslint-disable-next-line @typescript-eslint/no-unsafe-return
                getOptionLabel={poolName}
                style={{ width: 500 }}
                filterOptions={poolFilter}
                renderOption={renderPoolWithLogo}
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
        </div>
    );
}

export default PoolSearch;