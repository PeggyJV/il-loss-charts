import { ApolloClient, QueryOptions, MutationOptions } from '@apollo/client/core';
import { DocumentNode } from 'graphql';

import * as UniswapV3Types from '../uniswap-v3/generated-types';
import * as BitqueryTypes from '../bitquery/generated-types';

type Requester<C= {}> = <R, V>(doc: DocumentNode, vars?: V, options?: C) => Promise<R>

export type ApolloRequesterOptions<V, R> =
  | Omit<QueryOptions<V>, 'variables' | 'query'>
  | Omit<MutationOptions<R, V>, 'variables' | 'mutation'>;

const validDocDefOps = ['mutation', 'query', 'subscription'];

export function generateRequester<C>(client: ApolloClient<C>) {
  const requester: Requester = async <R, V>(
    doc: DocumentNode,
    variables: V,
    options?: ApolloRequesterOptions<V, R>,
  ): Promise<R> => {
    // Valid document should contain *single* query or mutation unless it's has a fragment
    if (
      doc.definitions.filter(
        d =>
          d.kind === 'OperationDefinition' &&
          validDocDefOps.includes(d.operation),
      ).length !== 1
    ) {
      throw new Error(
        'DocumentNode passed to Apollo Client must contain single query or mutation',
      );
    }

    const definition = doc.definitions[0];

    // Valid document should contain *OperationDefinition*
    if (definition.kind !== 'OperationDefinition') {
      throw new Error(
        'DocumentNode passed to Apollo Client must contain single query or mutation',
      );
    }

    switch (definition.operation) {
      case 'query': {
        const response = await client.query<R, V>({
          query: doc,
          variables,
          ...options,
        });

        if (response.errors) {
          throw new Error(JSON.stringify(response.errors));
        }

        if (response.data === undefined || response.data === null) {
          throw new Error('No data presented in the GraphQL response');
        }

        return response.data;
      }
      case 'mutation': {
        throw new Error(
          'Mutation requests through SDK interface are not supported',
        );
      }
      case 'subscription': {
        throw new Error(
          'Subscription requests through SDK interface are not supported',
        );
      }
    }
  };

  return requester;
}

export function getUniswapV3Sdk<C>(client: ApolloClient<C>) {
  const requester = generateRequester(client);
  return UniswapV3Types.getSdk(requester);
}

export function getBitquerySdk<C>(client: ApolloClient<C>) {
  const requester = generateRequester(client);
  return BitqueryTypes.getSdk(requester);
}

export type UniswapV3Sdk = ReturnType<typeof getUniswapV3Sdk>;
export type BitquerySdk = ReturnType<typeof getBitquerySdk>;