import { EventEmitter } from 'events';
import { createAlchemyWeb3 } from "@alch/alchemy-web3";


export class AlchemyWs extends EventEmitter {
    [key: string]: any;

    // TODO make long-lived, add reconnection logic
    // TODO clean up anys
    // Define 'subscribable' type for this WS and polling interface

    // static web3 = createAlchemyWeb3(`wss://eth-mainnet.ws.alchemyapi.io/v2/${process.env.ALCHEMY_API_KEY}`);
    static web3 = createAlchemyWeb3(`wss://mainnet.infura.io/ws/v3/${process.env.INFURA_PROJECT_ID}`);
    static UNISWAP_ROUTER_ADDR = '0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D';

    activeTopics: {
        [key: string]: { subscription: any };
    } = {};

    subscribe(topic: string, address?: string): any {
        if (this.activeTopics[topic]) {
            return this.activeTopics[topic].subscription;
        }

        if (topic !== 'pendingTransactions') {
            throw new Error('Can only subscribe to pendingTransactions viw alchemy')
        }

        // Filter by args
        // if (!address) throw new Error('Did not get address for pendingTransactions');

        let subscription = new EventEmitter();

        AlchemyWs.web3.eth.subscribe('alchemy_fullPendingTransactions')
            .on('data', (tx) => {
                // Only emit transactions to the v2 uniswap router
                if (tx.to === AlchemyWs.UNISWAP_ROUTER_ADDR) {
                    subscription.emit('data', tx);
                }
            });

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
}

export default new AlchemyWs();