import fetch from 'cross-fetch';
import {
    ApolloClient,
    ApolloError,
    HttpLink,
    InMemoryCache,
    gql,
} from '@apollo/client/core';

import { HTTPError } from 'api/util/errors';

interface ApolloResponse<T> {
    data: T;
    error?: ApolloError;
}

export interface EthBlock {
    id: string;
    number: number;
    timestamp: Date;
}
export default class EthBlockFetcher {
    static FEE_RATIO = 0.003;

    static client = new ApolloClient({
        link: new HttpLink({
            uri:
                'https://api.thegraph.com/subgraphs/name/blocklytics/ethereum-blocks',
            fetch,
        }),
        cache: new InMemoryCache(),
        defaultOptions: {
            query: {
                fetchPolicy: 'no-cache',
            },
        },
    });

    static async getFirstBlockAfter(date: Date): Promise<EthBlock> {
        const response: ApolloResponse<{
            blocks: Array<{ id: string; number: string; timestamp: string }>;
        }> = await EthBlockFetcher.client.query({
            query: gql`
                {
                    blocks(first: 1, orderBy: timestamp, orderDirection: asc, where: {timestamp_gt: "${Math.floor(
                        date.getTime() / 1000,
                    )}"}) {
                        id
                        number
                        timestamp
                    }
                }
            `,
        });

        const {
            blocks: [block],
        } = response?.data;

        if (block == null && response.error) {
            throw new Error(
                `Could not find block for given date ${date.toISOString()}. Error from response: ${
                    response.error?.toString() || ''
                }`,
            );
        } else if (block == null) {
            throw new HTTPError(404);
        }

        return {
            id: block.id,
            number: parseInt(block.number, 10),
            timestamp: new Date(parseInt(block.timestamp, 10) * 1000),
        };
    }

    static async getLastBlockBefore(
        date: Date,
    ): Promise<{ id: string; number: number; timestamp: Date }> {
        const response: ApolloResponse<{
            blocks: Array<{ id: string; number: string; timestamp: string }>;
        }> = await EthBlockFetcher.client.query({
            query: gql`
                {
                    blocks(first: 1, orderBy: timestamp, orderDirection: desc, where: {timestamp_lt: "${Math.floor(
                        date.getTime() / 1000,
                    )}"}) {
                        id
                        number
                        timestamp
                    }
                }
            `,
        });

        const {
            blocks: [block],
        } = response?.data;

        if (block == null && response.error) {
            throw new Error(
                `Could not find block for given date ${date.toISOString()}. Error from response: ${
                    response.error?.toString() || ''
                }`,
            );
        } else if (block == null) {
            throw new HTTPError(404);
        }

        return {
            id: block.id,
            number: parseInt(block.number, 10),
            timestamp: new Date(parseInt(block.timestamp, 10) * 1000),
        };
    }
}
