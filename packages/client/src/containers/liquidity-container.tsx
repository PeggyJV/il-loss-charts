import {
    useState,
    useContext,
    createContext,
    Dispatch,
    SetStateAction,
} from 'react';
import { PoolSearch } from 'components/pool-search';
import { Box } from '@material-ui/core';
import { AddLiquidityV3 } from 'components/add-liquidity/add-liquidity-v3';
import { useBalance } from 'hooks/use-balance';
import { usePoolOverview } from 'hooks/data-fetchers';
import { debug } from 'util/debug';
import { EthGasPrices } from '@sommelier/shared-types';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCheckCircle, faCog } from '@fortawesome/free-solid-svg-icons';
import './liquidity-container.scss';
import { ThreeDots } from 'react-loading-icons';
import classNames from 'classnames';

type LiquidityContext = {
    poolId: string | null;
    currentGasPrice: number | null;
    slippageTolerance: number;
    setPoolId: Dispatch<SetStateAction<string | null>>;
    setCurrentGasPrice: Dispatch<SetStateAction<number | null>>;
};
const initialContext = {
    poolId: null,
    selectedGasPrice: null,
    slippageTolerance: 3.0,
    currentGasPrice: null,
};
export const LiquidityContext = createContext<Partial<LiquidityContext>>(
    initialContext
);
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

// const ActionBar = () => {
//     return (
//         <Box className='action-bar'>
//             <button>Add Liquidity</button>
//         </Box>
//     );
// };

const TransactionSettings = ({
    gasPrices,
}: {
    gasPrices: EthGasPrices | null;
}) => {
    // TODO why does TS think this could be undefined ?
    const { currentGasPrice, setCurrentGasPrice } = useContext(
        LiquidityContext
    );

    // TODO show loader only for prices
    if (!gasPrices) return <ThreeDots height='1rem' />;
    const isSlowActive = currentGasPrice === gasPrices?.standard;
    const isNormalActive = currentGasPrice === gasPrices?.fast;
    const isFastActive = currentGasPrice === gasPrices?.fastest;

    return (
        <>
            {gasPrices && setCurrentGasPrice && (
                <Box
                    display='flex'
                    alignItems='center'
                    justifyContent='space-between'
                >
                    <div>Speed</div>
                    <div className='transaction-speed'>
                        <div
                            className={classNames({ active: isSlowActive })}
                            onClick={() =>
                                setCurrentGasPrice(gasPrices?.standard)
                            }
                        >
                            {isSlowActive && (
                                <FontAwesomeIcon icon={faCheckCircle} />
                            )}
                            {gasPrices ? (
                                <span>{`Slow ${gasPrices.standard} Gwei`}</span>
                            ) : (
                                <ThreeDots />
                            )}
                        </div>
                        <div
                            className={classNames({ active: isNormalActive })}
                            onClick={() => setCurrentGasPrice(gasPrices.fast)}
                        >
                            {isNormalActive && (
                                <FontAwesomeIcon icon={faCheckCircle} />
                            )}
                            {!currentGasPrice && (
                                <FontAwesomeIcon icon={faCheckCircle} />
                            )}
                            <span>{`Normal ${gasPrices.fast} Gwei`}</span>
                        </div>
                        <div
                            className={classNames({ active: isFastActive })}
                            onClick={() =>
                                setCurrentGasPrice(gasPrices.fastest)
                            }
                        >
                            {isFastActive && (
                                <FontAwesomeIcon icon={faCheckCircle} />
                            )}
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
    const [currentGasPrice, setCurrentGasPrice] = useState<number | null>(
        gasPrices?.fast ?? null
    );
    const balances = useBalance({
        pool,
    });

    debug.poolId = poolId;
    debug.balances = balances;

    return (
        <LiquidityContext.Provider
            value={{ poolId, setPoolId, currentGasPrice, setCurrentGasPrice }}
        >
            <Box className='liquidity-container'>
                <SearchHeader setPoolId={setPoolId} />
                {poolId && pool && (
                    <AddLiquidityV3 pool={pool} balances={balances} />
                )}
                {/* <ActionBar /> */}
                {poolId && <TransactionSettings gasPrices={gasPrices} />}
            </Box>
        </LiquidityContext.Provider>
    );
};
