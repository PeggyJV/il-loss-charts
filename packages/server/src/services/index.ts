import uniswap from './uniswap';
import infura from './infura';
import alchemy from './alchemy';

export default {
    uniswap,
    infura,
    alchemy
};

export type DataSource = 'uniswap' | 'infura' | 'alchemy';