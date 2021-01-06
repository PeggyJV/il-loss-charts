import { EventEmitter } from 'events';
import Web3 from 'web3';
import fetch from 'node-fetch';

export class Infura extends EventEmitter {
    [key: string]: any;

    // TODO make long-lived, add reconnection logic
    // TODO clean up anys
    // TODO add types to subscriptions
    // Define 'subscribable' type for this WS and polling interface

    static apiRoot = 'mainnet.infura.io';


    static web3 = new Web3(
        new Web3.providers.WebsocketProvider(`wss://${Infura.apiRoot}/ws/v3/${process.env.INFURA_PROJECT_ID}`)
    );

    activeTopics: {
        [key: string]: { subscription: any };
    } = {};

    subscribe(topic: any, address?: string): any {
        if (this.activeTopics[topic]) {
            return this.activeTopics[topic].subscription;
        }

        const subscription = Infura.web3.eth.subscribe(topic);

        this.activeTopics[topic] = { subscription };

        return subscription;
    }

    unsubscribe(topic: string): void {
        if (!this.activeTopics[topic]) {
            return;
        }

        // unsubscribes the subscription
        const { subscription } = this.activeTopics[topic];
        subscription.unsubscribe(function (error: Error, success: any) {
            if (success)
                console.log('Successfully unsubscribed!');
        });
    }

    async getLatestBlock(): Promise<{ result: number }> {
        const res = await fetch(`https://${Infura.apiRoot}/v3/${process.env.INFURA_PROJECT_ID}`);
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