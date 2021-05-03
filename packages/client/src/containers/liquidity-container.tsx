import { useState, Dispatch, SetStateAction } from 'react';
import { PoolSearch } from 'components/pool-search';
import { Box } from '@material-ui/core';
import { AddLiquidityV3 } from 'components/add-liquidity/add-liquidity-v3';
import { useBalance } from 'hooks/use-balance';
import { usePoolOverview } from 'hooks/data-fetchers';
import { debug } from 'util/debug';
import { EthGasPrices } from '@sommelier/shared-types';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCheckCircle, faCog } from '@fortawesome/free-solid-svg-icons';

import classNames from 'classnames';
import './liquidity-container.scss';

const SearchHeader = ({
    setPoolId,
}: {
    setPoolId: Dispatch<SetStateAction<string | null>>;
}) => {
    return (
        <Box
            display='flex'
            justifyContent='space-between'
            flexDirection='row'
            alignItems='center'
            className='search-header'
        >
            <div>{'Search Pairs'}</div>
            <PoolSearch setPoolId={setPoolId} />
            {/* <div>
                <button onClick={() => setPoolId(null)}>Clear</button>
            </div> */}
        </Box>
    );
};

const ActionBar = () => {
    return (
        <Box className='action-bar'>
            <button>Add Liquidity</button>
        </Box>
    );
};

const TransactionSettings = ({
    gasPrices,
}: {
    gasPrices: EthGasPrices | null;
}) => {
    const [currentGasPrice, setCurrentGasPrice] = useState<number | null>(
        gasPrices?.standard ?? null
    );
    console.log(gasPrices);
    return (
        <>
            {gasPrices && (
                <Box
                    display='flex'
                    alignItems='center'
                    justifyContent='space-between'
                >
                    <div>Speed</div>
                    <div className='transaction-speed'>
                        <div
                            onClick={() =>
                                setCurrentGasPrice(gasPrices.standard)
                            }
                        >
                            {currentGasPrice === gasPrices.standard ? (
                                <FontAwesomeIcon icon={faCheckCircle} />
                            ) : null}
                            <span>{`Slow ${gasPrices.standard} Gwei`}</span>
                        </div>
                        <div
                            className='active'
                            onClick={() => setCurrentGasPrice(gasPrices.fast)}
                        >
                            {currentGasPrice === gasPrices.fast ? (
                                <FontAwesomeIcon icon={faCheckCircle} />
                            ) : null}
                            {!currentGasPrice && (
                                <FontAwesomeIcon icon={faCheckCircle} />
                            )}
                            <span>{`Normal ${gasPrices.fast} Gwei`}</span>
                        </div>
                        <div
                            onClick={() =>
                                setCurrentGasPrice(gasPrices.fastest)
                            }
                        >
                            {currentGasPrice === gasPrices.fastest ? (
                                <FontAwesomeIcon icon={faCheckCircle} />
                            ) : null}
                            <span>{`Fast ${gasPrices.fastest} Gwei`}</span>
                        </div>
                    </div>
                    <div className='transaction-settings'>
                        <FontAwesomeIcon icon={faCog} />
                    </div>
                </Box>
            )}
        </>
    );
};

export const LiquidityContainer = ({
    gasPrices,
}: {
    gasPrices: EthGasPrices | null;
}): JSX.Element => {
    const [poolId, setPoolId] = useState<string | null>(null);
    const { data: pool } = usePoolOverview('rinkeby', poolId);
    const balances = useBalance({
        pool,
    });

    debug.poolId = poolId;
    debug.balances = balances;

    return (
        <Box className='liquidity-container'>
            <SearchHeader setPoolId={setPoolId} />
            {poolId && (
                <AddLiquidityV3
                    pool={pool}
                    balances={balances}
                    gasPrices={gasPrices}
                />
            )}
            {/* <ActionBar /> */}
            {poolId && <TransactionSettings gasPrices={gasPrices} />}
        </Box>
    );
};
