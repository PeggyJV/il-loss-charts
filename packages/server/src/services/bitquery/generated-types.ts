import { DocumentNode } from 'graphql';
import gql from 'graphql-tag';
export type Maybe<T> = T | null;
export type Exact<T extends { [key: string]: unknown }> = {
    [K in keyof T]: T[K];
};
export type MakeOptional<T, K extends keyof T> = Omit<T, K> &
    { [SubKey in K]?: Maybe<T[SubKey]> };
export type MakeMaybe<T, K extends keyof T> = Omit<T, K> &
    { [SubKey in K]: Maybe<T[SubKey]> };
/** All built-in and custom scalars, mapped to their actual values */
export interface Scalars {
    ID: string;
    String: string;
    Boolean: boolean;
    Int: number;
    Float: number;
    ISO8601DateTime: any;
}

export interface BaseCurrency {
    is: Scalars['String'];
}

export interface DexTrade {
    __typename?: 'DexTrade';
    baseCurrency: Token;
    quoteCurrency: Token;
    timeInterval?: Maybe<TimeInterval>;
    baseAmount: Scalars['Int'];
    quoteAmount: Scalars['String'];
    trades?: Maybe<Scalars['Int']>;
    count?: Maybe<Scalars['Int']>;
    quotePrice: Scalars['Int'];
    maximum_price: Scalars['Int'];
    minimum_price: Scalars['Int'];
    open_price?: Maybe<Scalars['String']>;
    close_price?: Maybe<Scalars['String']>;
    minimum?: Maybe<Scalars['String']>;
    maximum?: Maybe<Scalars['String']>;
}

export interface DexTradeQuotePriceArgs {
    calculate?: Maybe<Calculation>;
}

export interface DexTradeMinimumArgs {
    of?: Maybe<OfFilter>;
    get?: Maybe<GetFilter>;
}

export interface DexTradeMaximumArgs {
    of?: Maybe<OfFilter>;
    get?: Maybe<GetFilter>;
}

export interface Exchange {
    is: Scalars['String'];
}

export interface Options {
    asc?: Maybe<Scalars['String']>;
    desc?: Maybe<Scalars['String']>;
}

export interface Query {
    __typename?: 'Query';
    ethereum?: Maybe<Ethereum>;
}

export interface QueryEthereumArgs {
    network?: Maybe<Network>;
}

export interface QuoteCurrency {
    is: Scalars['String'];
}

export interface SearchDate {
    between?: Maybe<Array<Maybe<Scalars['ISO8601DateTime']>>>;
    since?: Maybe<Scalars['ISO8601DateTime']>;
}

export interface TimeInterval {
    __typename?: 'TimeInterval';
    day?: Maybe<Scalars['String']>;
}

export interface TimeIntervalDayArgs {
    count?: Maybe<Scalars['Int']>;
}

export interface Token {
    __typename?: 'Token';
    symbol: Scalars['String'];
    address: Scalars['String'];
}

export enum Calculation {
    Minimum = 'minimum',
    Maximum = 'maximum',
}

export interface Ethereum {
    __typename?: 'ethereum';
    dexTrades?: Maybe<Array<DexTrade>>;
    date: Scalars['String'];
    exchangeName: Scalars['String'];
}

export interface EthereumDexTradesArgs {
    options?: Maybe<Options>;
    date?: Maybe<SearchDate>;
    exchangeName?: Maybe<Exchange>;
    baseCurrency?: Maybe<BaseCurrency>;
    quoteCurrency?: Maybe<QuoteCurrency>;
}

export enum GetFilter {
    QuotePrice = 'quote_price',
}

export enum Network {
    Ethereum = 'ethereum',
}

export enum OfFilter {
    Block = 'block',
}

export type GetPoolDailyOhlcQueryVariables = Exact<{
    baseTokenId: Scalars['String'];
    quoteTokenId: Scalars['String'];
    startDate: Scalars['ISO8601DateTime'];
    endDate: Scalars['ISO8601DateTime'];
}>;

export type GetPoolDailyOhlcQuery = { __typename?: 'Query' } & {
    ethereum?: Maybe<
        { __typename?: 'ethereum' } & {
            dexTrades?: Maybe<
                Array<
                    { __typename?: 'DexTrade' } & Pick<
                        DexTrade,
                        'baseAmount' | 'quoteAmount' | 'quotePrice'
                    > & {
                            trades: DexTrade['count'];
                            open_price: DexTrade['minimum'];
                            close_price: DexTrade['maximum'];
                            maximum_price: DexTrade['quotePrice'];
                            minimum_price: DexTrade['quotePrice'];
                        } & {
                            timeInterval?: Maybe<
                                { __typename?: 'TimeInterval' } & Pick<
                                    TimeInterval,
                                    'day'
                                >
                            >;
                            baseCurrency: { __typename?: 'Token' } & Pick<
                                Token,
                                'symbol' | 'address'
                            >;
                            quoteCurrency: { __typename?: 'Token' } & Pick<
                                Token,
                                'symbol' | 'address'
                            >;
                        }
                >
            >;
        }
    >;
};

export const GetPoolDailyOhlcDocument = gql`
    query getPoolDailyOHLC(
        $baseTokenId: String!
        $quoteTokenId: String!
        $startDate: ISO8601DateTime!
        $endDate: ISO8601DateTime!
    ) {
        ethereum(network: ethereum) {
            dexTrades(
                options: { desc: "timeInterval.day" }
                date: { between: [$startDate, $endDate] }
                exchangeName: { is: "Uniswap" }
                baseCurrency: { is: $baseTokenId }
                quoteCurrency: { is: $quoteTokenId }
            ) {
                timeInterval {
                    day(count: 1)
                }
                baseCurrency {
                    symbol
                    address
                }
                baseAmount
                quoteCurrency {
                    symbol
                    address
                }
                baseAmount
                quoteAmount
                trades: count
                quotePrice
                open_price: minimum(of: block, get: quote_price)
                close_price: maximum(of: block, get: quote_price)
                maximum_price: quotePrice(calculate: maximum)
                minimum_price: quotePrice(calculate: minimum)
            }
        }
    }
`;
export type Requester<C = {}> = <R, V>(
    doc: DocumentNode,
    vars?: V,
    options?: C,
) => Promise<R>;
export function getSdk<C>(requester: Requester<C>) {
    return {
        getPoolDailyOHLC(
            variables: GetPoolDailyOhlcQueryVariables,
            options?: C,
        ): Promise<GetPoolDailyOhlcQuery> {
            return requester<
                GetPoolDailyOhlcQuery,
                GetPoolDailyOhlcQueryVariables
            >(GetPoolDailyOhlcDocument, variables, options);
        },
    };
}
export type Sdk = ReturnType<typeof getSdk>;
