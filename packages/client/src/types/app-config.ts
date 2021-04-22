export type Environments = 'production' | 'development' | 'test' | 'staging';

export type NetworkNamespace = 'mainnet' | 'rinkeby' | 'goerli' | 'ropsten' | 'kovan';
export type NetworkIds = '1' | '4' | '5' | '3' | '42'
type ContractABI =
    | 'ADD_LIQUIDITY'
    | 'REMOVE_LIQUIDITY'
    | 'TWO_SIDE_ADD_LIQUIDITY'
    | 'ADD_LIQUIDITY_V3';

type Network = {
    [key in NetworkIds]: {
        id: number;
        name: NetworkNamespace;
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
}
