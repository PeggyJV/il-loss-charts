import fetch from 'cross-fetch';

import { EthGasPrices } from '@sommelier/shared-types';

export default class EthGasFetcher {
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
