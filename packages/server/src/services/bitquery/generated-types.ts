import { DocumentNode } from 'graphql';
import gql from 'graphql-tag';
export type Maybe<T> = T | null;
export type Exact<T extends { [key: string]: unknown }> = { [K in keyof T]: T[K] };
export type MakeOptional<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]?: Maybe<T[SubKey]> };
export type MakeMaybe<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]: Maybe<T[SubKey]> };
/** All built-in and custom scalars, mapped to their actual values */
export type Scalars = {
  ID: string;
  String: string;
  Boolean: boolean;
  Int: number;
  Float: number;
};

export type BaseCurrency = {
  is: Scalars['String'];
};

export type DexTrades = {
  __typename?: 'DexTrades';
  baseCurrency: Token;
  quoteCurrency: Token;
  timeInterval?: Maybe<TimeInterval>;
  baseAmount: Scalars['Int'];
  quoteAmount: Scalars['String'];
  count: Scalars['Int'];
  quotePrice: Scalars['Int'];
  maximum_price: Scalars['Int'];
  minimum_price: Scalars['Int'];
  open_price: Scalars['String'];
  close_price: Scalars['String'];
};


export type DexTradesQuotePriceArgs = {
  calculate?: Maybe<Scalars['String']>;
};

export type Exchange = {
  is: Scalars['String'];
};

export type Options = {
  asc?: Maybe<Scalars['String']>;
  desc?: Maybe<Scalars['String']>;
};

export type Query = {
  __typename?: 'Query';
  ethereum?: Maybe<Ethereum>;
};


export type QueryEthereumArgs = {
  network?: Maybe<Scalars['String']>;
};

export type QuoteCurrency = {
  is: Scalars['String'];
};

export type SearchDate = {
  between?: Maybe<Array<Maybe<Scalars['String']>>>;
  since?: Maybe<Scalars['String']>;
};

export type TimeInterval = {
  __typename?: 'TimeInterval';
  day?: Maybe<Scalars['String']>;
};


export type TimeIntervalDayArgs = {
  count?: Maybe<Scalars['Int']>;
};

export type Token = {
  __typename?: 'Token';
  symbol: Scalars['String'];
  address: Scalars['String'];
};

export type Ethereum = {
  __typename?: 'ethereum';
  network: Scalars['String'];
  dexTrades: DexTrades;
  date: Scalars['String'];
  exchangeName: Scalars['String'];
};


export type EthereumDexTradesArgs = {
  options?: Maybe<Options>;
  date?: Maybe<SearchDate>;
  exchangeName?: Maybe<Exchange>;
  baseCurrency?: Maybe<BaseCurrency>;
  quoteCurrency?: Maybe<QuoteCurrency>;
};

export type GetPoolDailyOhlcQueryVariables = Exact<{
  baseTokenId: Scalars['String'];
  quoteTokenId: Scalars['String'];
  startDate?: Maybe<Scalars['String']>;
  endDate?: Maybe<Scalars['String']>;
}>;


export type GetPoolDailyOhlcQuery = (
  { __typename?: 'Query' }
  & { ethereum?: Maybe<(
    { __typename?: 'ethereum' }
    & { dexTrades: (
      { __typename?: 'DexTrades' }
      & Pick<DexTrades, 'baseAmount' | 'quoteAmount' | 'quotePrice'>
      & { trades: DexTrades['count'], maximum_price: DexTrades['quotePrice'], minimum_price: DexTrades['quotePrice'] }
      & { timeInterval?: Maybe<(
        { __typename?: 'TimeInterval' }
        & Pick<TimeInterval, 'day'>
      )>, baseCurrency: (
        { __typename?: 'Token' }
        & Pick<Token, 'symbol' | 'address'>
      ), quoteCurrency: (
        { __typename?: 'Token' }
        & Pick<Token, 'symbol' | 'address'>
      ) }
    ) }
  )> }
);


export const GetPoolDailyOhlcDocument = gql`
    query getPoolDailyOHLC($baseTokenId: String!, $quoteTokenId: String!, $startDate: String, $endDate: String) {
  ethereum(network: "ethereum") {
    dexTrades(
      options: {asc: "timeInterval.day"}
      date: {between: [$startDate, $endDate]}
      exchangeName: {is: "Uniswap"}
      baseCurrency: {is: "$baseTokenId"}
      quoteCurrency: {is: "$quoteTokenId"}
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
      maximum_price: quotePrice(calculate: "maximum")
      minimum_price: quotePrice(calculate: "minimum")
    }
  }
}
    `;
export type Requester<C= {}> = <R, V>(doc: DocumentNode, vars?: V, options?: C) => Promise<R>
export function getSdk<C>(requester: Requester<C>) {
  return {
    getPoolDailyOHLC(variables: GetPoolDailyOhlcQueryVariables, options?: C): Promise<GetPoolDailyOhlcQuery> {
      return requester<GetPoolDailyOhlcQuery, GetPoolDailyOhlcQueryVariables>(GetPoolDailyOhlcDocument, variables, options);
    }
  };
}
export type Sdk = ReturnType<typeof getSdk>;