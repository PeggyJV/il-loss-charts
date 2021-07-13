import { EthNetwork, NetworkIds } from '@sommelier/shared-types';

export type Environments = 'production' | 'development' | 'test' | 'staging';
type ContractABI =
    | 'ADD_LIQUIDITY'
    | 'REMOVE_LIQUIDITY'
    | 'TWO_SIDE_ADD_LIQUIDITY'
    | 'ADD_LIQUIDITY_V3'
    | 'REMOVE_LIQUIDITY_V3'
    | 'NON_FUNGIBLE_POSITION_MANAGER';

type Network = {
    [key in NetworkIds]: {
        id: number;
        name: EthNetwork;
        contracts?: Partial<
            {
                [key in ContractABI]: string;
            }
        >;
    };
};
export default interface AppConfig {
    wsApi: string;
    networks: Network;
    ethAddress: string;
}
