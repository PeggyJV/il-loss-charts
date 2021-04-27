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
  ISO8601DateTime: any;
};

export type BaseCurrency = {
  is: Scalars['String'];
};

export type DexTrade = {
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
};


export type DexTradeQuotePriceArgs = {
  calculate?: Maybe<Calculation>;
};


export type DexTradeMinimumArgs = {
  of?: Maybe<OfFilter>;
  get?: Maybe<GetFilter>;
};


export type DexTradeMaximumArgs = {
  of?: Maybe<OfFilter>;
  get?: Maybe<GetFilter>;
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
  network?: Maybe<Network>;
};

export type QuoteCurrency = {
  is: Scalars['String'];
};

export type SearchDate = {
  between?: Maybe<Array<Maybe<Scalars['ISO8601DateTime']>>>;
  since?: Maybe<Scalars['ISO8601DateTime']>;
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

export enum Calculation {
  Minimum = 'minimum',
  Maximum = 'maximum'
}

export type Ethereum = {
  __typename?: 'ethereum';
  dexTrades?: Maybe<Array<DexTrade>>;
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

export enum GetFilter {
  QuotePrice = 'quote_price'
}

export enum Network {
  Ethereum = 'ethereum'
}

export enum OfFilter {
  Block = 'block'
}
