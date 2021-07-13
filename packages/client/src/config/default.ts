import AppConfig from 'types/app-config';

const config: AppConfig = {
    wsApi: 'ws://localhost:3001/realtime',
    networks: {
        '1': {
            id: 1, // https://chainid.network/
            name: 'mainnet',
            contracts: {
                ADD_LIQUIDITY: '0xFd8A61F94604aeD5977B31930b48f1a94ff3a195',
                REMOVE_LIQUIDITY: '0x430f33353490b256D2fD7bBD9DaDF3BB7f905E78',
                TWO_SIDE_ADD_LIQUIDITY:
                    '0xA522AA47C40F2BAC847cbe4D37455c521E69DEa7',
                ADD_LIQUIDITY_V3: '0xE76427463FdBacdD0e794e5Ea30269f30Dd9B8eB',
                REMOVE_LIQUIDITY_V3:
                    '0x356Ab692955cC3cBa5de3E9bA4b0390c39353DFD',
                NON_FUNGIBLE_POSITION_MANAGER:
                    '0xC36442b4a4522E871399CD717aBDD847Ab11FE88',
            },
        },
        '4': {
            id: 4,
            name: 'rinkeby',
            contracts: {
                // ADD_LIQUIDITY_V3: '0xfc9Ce938f67897882e42A23771751a2175e266a1',
            },
        },
        '5': {
            id: 5,
            name: 'goerli',
        },
        '3': {
            id: 3,
            name: 'ropsten',
        },
        '42': {
            id: 42,
            name: 'kovan',
        },
    },
    ethAddress: '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE',
};

export default config;
