export type Maybe<T> = T | null;
export type Exact<T extends { [key: string]: unknown }> = { [K in keyof T]: T[K] };
export type MakeOptional<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]?: Maybe<T[SubKey]> };
export type MakeMaybe<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]: Maybe<T[SubKey]> };
/** All built-in and custom scalars, mapped to their actual values */
export interface Scalars {
  ID: string;
  String: string;
  Boolean: boolean;
  Int: number;
  Float: number;
  ISO8601DateTime: string;
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
  Maximum = 'maximum'
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
  QuotePrice = 'quote_price'
}

export enum Network {
  Ethereum = 'ethereum'
}

export enum OfFilter {
  Block = 'block'
}
