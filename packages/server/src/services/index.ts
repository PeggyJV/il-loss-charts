import uniswap from './uniswap';
import infura from './infura';
import ethGas from './eth-gas';

export default {
    uniswap,
    infura,
    ethGas,
};

export type DataSource = 'uniswap' | 'infura' | 'ethGas';
