import { EventEmitter } from 'events';
import Web3 from 'web3';
import fetch from 'node-fetch';

if (!process.env.INFURA_PROJECT_ID) {
    throw new Error('Cannot instiate Infura handler without infura project id.')
}

export class Infura extends EventEmitter {
    [key: string]: unknown;

    // TODO make long-lived, add reconnection logic
    // TODO clean up anys
    // TODO add types to subscriptions
    // Define 'subscribable' type for this WS and polling interface

    static apiRoot = 'mainnet.infura.io';

    static web3 = new Web3(
        new Web3.providers.WebsocketProvider(`wss://${Infura.apiRoot}/ws/v3/${process.env.INFURA_PROJECT_ID as string}`)
    );

    activeTopics: {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        [key: string]: { subscription: any };
    } = {};

    subscribe(topic: string): unknown {
        if (this.activeTopics[topic]) {
            return this.activeTopics[topic].subscription;
        }

        let subscription;
        try {
            if (topic === 'newBlockHeaders') {
                subscription = Infura.web3.eth.subscribe('newBlockHeaders');
            } else if (topic === 'pendingTransactions') {
                subscription = Infura.web3.eth.subscribe('pendingTransactions');
            } else if (topic === 'newHeads') {
                // newHeads is mentioned in the docs below, but not supported as a type
                // https://infura.io/docs/ethereum#section/Make-Requests/Subscriptions-and-Filters
                subscription = Infura.web3.eth.subscribe('newHeads' as 'newBlockHeaders');
            } else {
                throw new Error();
            }
        } catch (e) {
            throw new Error(`Could not subscribe to web3.eth for topic ${topic}`);
        }

        this.activeTopics[topic] = { subscription };

        return subscription;
    }

    unsubscribe(topic: string): void {
        if (!this.activeTopics[topic]) {
            return;
        }

        // unsubscribes the subscription
        const { subscription } = this.activeTopics[topic];
        subscription.unsubscribe(function (error: Error, success: unknown) {
            if (success)
                console.log('Successfully unsubscribed!');
        });
    }

    async getLatestBlock(): Promise<{ result: number }> {
        const res = await fetch(`https://${Infura.apiRoot}/v3/${process.env.INFURA_PROJECT_ID as string}`);
        const data = await res.json();

        // Convert hex
        const blockNumber = parseInt(data.result.slice(2), 16);

        if (Number.isNaN(blockNumber)) {
            throw new Error(`Could not parse latest block number from Infura`);
        }

        return { result: blockNumber };
    }
}

export default new Infura();