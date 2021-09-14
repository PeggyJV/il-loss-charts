import { JSONRPCClient } from 'json-rpc-2.0';
import { ethers } from 'ethers';
import BigNumber from 'bignumber.js';
export async function getGasPriceFromInfura(): Promise<string> {
    const client: any = new JSONRPCClient((jsonRPCRequest) =>
        fetch('https://mainnet.infura.io/v3/24559873278a4505abdaf7d7d3ea57c7', {
            method: 'POST',
            headers: {
                'content-type': 'application/json',
            },
            body: JSON.stringify(jsonRPCRequest),
        }).then((response) => {
            if (response.status === 200) {
                // Use client.receive when you received a JSON-RPC response.
                return response.json().then((jsonRPCResponse) =>
                    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
                    client.receive(jsonRPCResponse),
                );
            } else if (jsonRPCRequest.id !== undefined) {
                return Promise.reject(new Error(response.statusText));
            }
        }),
    );
    let gasPrice = '0';
    // Use client.request to make a JSON-RPC request call.
    // The function returns a promise of the result.
    await client.request('eth_gasPrice', []).then((result: any) => {
        const gasPriceStr = ethers.utils.formatUnits(
            result || 0,
            parseInt('9', 10),
        );
        gasPrice = new BigNumber(gasPriceStr).plus(1).toFixed(0);
    });

    return gasPrice;
}
