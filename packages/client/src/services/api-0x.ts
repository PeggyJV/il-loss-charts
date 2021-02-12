export async function get0xSwapQuote(
    buyToken: string,
    sellToken: string,
    sellAmount: string
): Promise<any> {
    try {
        const headers = {
            'Content-Type': 'application/json;charset=utf-8',
            Accept: '*/*',
        };

        const response = await fetch(
            `https://api.0x.org/swap/v1/quote?buyToken=${buyToken}&sellToken=${sellToken}&sellAmount=${sellAmount}`,
            {
                headers,
            }
        );
        const quote = await response.json();
        (window as any).quote = quote;

        return quote as { quote: string };
    } catch (err) {
        console.log('0x swap quote error:', JSON.stringify(err));
        throw err;
    }
}
