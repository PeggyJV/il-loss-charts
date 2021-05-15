import fetch from 'cross-fetch';
import { EventEmitter } from 'events';
import WebSocket from 'ws';
import BigNumber from 'bignumber.js';

import { EthGasPrices } from '@sommelier/shared-types';

export class EthGasFetcher {
    static async getGasPrices(): Promise<EthGasPrices> {
        const res = await fetch(
            'https://www.etherchain.org/api/gasPriceOracle'
        );
        const gasPrices: EthGasPrices | null = await res.json();

        if (!gasPrices) {
            throw new Error('Could not get gas prices.');
        }

        return gasPrices;
    }
}

export class EthGasStream extends EventEmitter {
    static ws: WebSocket;
    static emitter = new EventEmitter();

    static subscribe(): EventEmitter {
        if (!EthGasStream.ws) {
            EthGasStream.ws = new WebSocket('wss://www.gasnow.org/ws/gasprice');
        }

        const convertToGwei = (num: string) => parseInt(new BigNumber(num).shiftedBy(-9).toFixed(0), 10);
        EthGasStream.ws.on('message', (data: string) => {
            const { data: parsedData } = JSON.parse(data);

            const gasPrices: EthGasPrices = {
                safeLow: convertToGwei(parsedData.slow),
                standard: convertToGwei(parsedData.standard),
                fast: convertToGwei(parsedData.fast),
                fastest: convertToGwei(parsedData.rapid),
            };

            EthGasStream.emitter.emit('data', gasPrices);
        });
        return EthGasStream.emitter;
    }
}
