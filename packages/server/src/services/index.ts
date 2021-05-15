import uniswap from './uniswap';
import infura from './infura';
import { EthGasStream as ethGas } from './eth-gas';

export default {
    uniswap,
    infura,
    ethGas,
};

export type DataSource = 'uniswap' | 'infura' | 'ethGas';
