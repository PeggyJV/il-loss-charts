import { Dispatch, SetStateAction } from 'react';

import Autocomplete from '@material-ui/lab/Autocomplete';
import { matchSorter } from 'match-sorter';
import TextField from '@material-ui/core/TextField';
import { makeStyles, withStyles } from '@material-ui/core/styles';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faRetweet } from '@fortawesome/free-solid-svg-icons';
import './pair-search.scss';
import { resolveLogo } from 'components/token-with-logo';
import { Box } from '@material-ui/core';
import { poolSymbol, PoolLike } from 'util/formats';
import BigNumber from 'bignumber.js';

import { TopPool, useTopPools } from 'hooks/data-fetchers';
import { ThreeDots } from 'react-loading-icons';
import { trackPoolSelected } from 'util/mixpanel';

const useStyles = makeStyles(() => ({
    input: {
        color: 'var(--facePrimary)',
        background: 'var(--bgDeep)',
    },
}));

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
        return <ThreeDots height='1rem' />;
    }

    const poolFilter = (options: TopPool[], { inputValue }: any) =>
        matchSorter(options, inputValue, {
            keys: ['token0.symbol', 'token1.symbol', poolSymbol],
        }).sort(poolSortByVolume).slice(0, 50);

    const renderPoolWithLogo = (pool: TopPool) => {
        return (<div className='pair-option-with-logo'>
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
        </div>)
    };

    return (
        <Box flexGrow='1'>
            <Autocomplete
                id='all-pairs'
                options={pools}
                classes={classes}
                className='mui-pair-search'
                autoHighlight={false}
                autoComplete={false}
                autoSelect={false}
                loading={false}
                debug={false}
                noOptionsText={'Invalid Pair'}
                loadingText={'...loading'}
                onChange={(_, pool) => {
                    setPoolId(pool?.id ?? null);
                    trackPoolSelected(pool);
                }}
                // eslint-disable-next-line @typescript-eslint/no-unsafe-return
                getOptionLabel={poolOptionLabel}
                style={{ width: '100%' }}
                filterOptions={poolFilter}
                renderOption={renderPoolWithLogo}
                renderInput={(params) => (
                    <CssTextField
                        {...params}
                        className='pair-search-text'
                        style={{
                            border: '1px solid var(--borderPrimary)',
                            borderRadius: '2px',
                            fontWeight: 400,
                            textTransform: 'uppercase',
                            background: 'var(--bgDeep)',
                        }}
                    />
                )}
            />
        </Box>
    );
}

function poolOptionLabel(pool: PoolLike): string {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    return poolSymbol(pool, '/');
}

export default PoolSearch;

// TODO: converting then sorting is about 15x slower than pre converting and sorting
// We should re-evaluate converting some fields to big number right off the request
// See the big-number-compare benchmark
function poolSortByVolume(a: TopPool, b: TopPool) {
    const volA = new BigNumber(a.volumeUSD);
    const volB = new BigNumber(b.volumeUSD);

    return volB.comparedTo(volA);
}