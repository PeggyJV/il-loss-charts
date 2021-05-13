export const networkRex = /(mainnet|rinkeby|goerli|ropsten|kovan)/;

export function getNetwork(str: string): string | undefined {
    const result = networkRex.exec(str);
    if (result == null) return;

    return result[1];
}