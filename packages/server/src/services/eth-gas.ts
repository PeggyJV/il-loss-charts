import fetch from 'cross-fetch';
import { EventEmitter } from 'events';
import WebSocket from 'ws';
import BigNumber from 'bignumber.js';

import { EthGasPrices } from '@sommelier/shared-types';

export class EthGasFetcher {
    static async getGasPrices(): Promise<EthGasPrices> {
        const res = await fetch(
            'https://www.etherchain.org/api/gasPriceOracle',
        );
        const gasPrices: EthGasPrices | null = await res.json();

        if (!gasPrices) {
            throw new Error('Could not get gas prices.');
        }

        return gasPrices;
    }
}

export class EthGasStream extends EventEmitter {
    static ws: WebSocket | null;
    static emitter = new EventEmitter();

    static startConnection(): WebSocket {
        EthGasStream.ws = new WebSocket('wss://www.gasnow.org/ws/gasprice');
        return EthGasStream.ws;
    }

    static registerMessageHandler(ws: WebSocket): void {
        const convertToGwei = (num: string) =>
            parseInt(new BigNumber(num).shiftedBy(-9).toFixed(0), 10);
        ws.on('message', (data: string) => {
            const { data: parsedData } = JSON.parse(data);

            const gasPrices: EthGasPrices = {
                safeLow: convertToGwei(parsedData.slow),
                standard: convertToGwei(parsedData.standard),
                fast: convertToGwei(parsedData.fast),
                fastest: convertToGwei(parsedData.rapid),
            };

            EthGasStream.emitter.emit('data', gasPrices);
        });
    }

    static subscribe(): EventEmitter {
        let ws = EthGasStream.ws;

        if (!ws) {
            console.log(
                '[WS:GAS]: Opening connection to gasnow.org gas price oracle...',
            );
            ws = EthGasStream.startConnection();

            ws.on('open', () => {
                console.log(
                    '[WS:GAS]: Connected to gasnow.org gas price oracle.',
                );
            });

            ws.on('close', () => {
                console.log(
                    '[WS:GAS]: Disconnected from gasnow.org gas price oracle.',
                );
                console.log(
                    '[WS:GAS]: Attempting to reconnect in 5 seconds...',
                );

                setTimeout(() => {
                    EthGasStream.ws = null;
                    EthGasStream.subscribe();
                }, 5000);
            });

            ws.on('error', (err) => {
                console.error(
                    '[WS:GAS]: Error connecting to gasnow.org gas price oracle.: ',
                    err.message,
                );
            });

            EthGasStream.registerMessageHandler(ws);
        }

        if (!ws) {
            throw new Error('Websocket not properly instantiated');
        }
        return EthGasStream.emitter;
    }
}
