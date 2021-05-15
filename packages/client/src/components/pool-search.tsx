import { Dispatch, SetStateAction } from 'react';

import Autocomplete from '@material-ui/lab/Autocomplete';
import { matchSorter } from 'match-sorter';
import TextField from '@material-ui/core/TextField';
import { makeStyles, withStyles } from '@material-ui/core/styles';
import './pair-search.scss';
import { resolveLogo } from 'components/token-with-logo';
import { Box } from '@material-ui/core';
import { poolSymbol, PoolLike } from 'util/formats';
import BigNumber from 'bignumber.js';

import { TopPool, useTopPools } from 'hooks/data-fetchers';
import { ThreeDots } from 'react-loading-icons';
import { trackPoolSearch, trackPoolSelected } from 'util/mixpanel';

const useStyles = makeStyles(() => ({
    input: {
        color: 'var(--facePrimary)',
        background: 'var(--bgDeep)',
    },
}));

const CssTextField = withStyles({
    root: {
        '& .MuiInput-underline:after': {
            border: '1px solid var(--borderAccentAlt)',
        },
        '&:hover .MuiInput-underline:after': {
            border: '1px solid var(--borderAccentAlt)',
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
        })
            .sort(poolSortByVolume)
            .slice(0, 50);

    const renderPoolWithLogo = (pool: TopPool) => {
        return (
            <div className='pair-option-with-logo'>
                <div className='pair'>
                    <div>
                        {resolveLogo(pool?.token0?.id)}
                        {resolveLogo(pool?.token1?.id)}
                        &nbsp;&nbsp;
                    </div>
                    <div>
                        {pool?.token0?.symbol}
                        {' / '}
                        {pool?.token1?.symbol}
                    </div>
                </div>
                <div className='fee-tier'>{(parseInt(pool?.feeTier) / 10000).toFixed(2) + '%'}</div>
            </div>
        );
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
                blurOnSelect={'touch'}
                placeholder={'Search Pairings'}
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
                            border: '1px solid var(--borderDefault)',
                            borderRadius: '2px',
                            fontWeight: 400,
                            textTransform: 'uppercase',
                            background: 'var(--bgDeep)',
                        }}
                        onClick={trackPoolSearch}
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
