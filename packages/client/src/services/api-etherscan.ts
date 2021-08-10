import axios from 'axios';

export async function getSafeGasPrice() {
    const response = await axios.get(
        'https://ethgasstation.info/json/ethgasAPI.json',
    );

    const prices = {
        low: response.data.safeLow / 10,
        medium: response.data.average / 10,
        high: response.data.fast / 10,
        fastest: Math.round(response.data.fastest / 10),
    };
    return prices.high;
}
