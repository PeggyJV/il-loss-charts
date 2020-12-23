import { EventEmitter } from 'events';
import Web3 from 'web3';

import { tokenizeTopic } from 'util/parse-topics';


class InfuraWs extends EventEmitter {
    // TODO make long-lived, add reconnection logic
    // TODO clean up anys
    // Define 'subscribable' type for this WS and polling interface

    static web3 = new Web3(
        new Web3.providers.WebsocketProvider(`wss://mainnet.infura.io/ws/v3/${process.env.INFURA_PROJECT_ID}`)
    );

    activeTopics: {
        [key: string]: { subscription: any };
    } = {};

    subscribe(topic, address?: string): any {
        if (this.activeTopics[topic]) {
            return this.activeTopics[topic].subscription;
        }

        const subscription = InfuraWs.web3.eth.subscribe(topic);

        this.activeTopics[topic] = { subscription };

        return subscription;
    }

    unsubscribe(topic): void {
        if (!this.activeTopics[topic]) {
            return;
        }

        // unsubscribes the subscription
        const { subscription } = this.activeTopics[topic];
        subscription.unsubscribe(function (error, success) {
            if (success)
                console.log('Successfully unsubscribed!');
        });
    }
}

export default new InfuraWs();