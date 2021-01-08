export const ETH_ADDRESS_LENGTH = 42;

// TODO use eth library for this
export function isValidEthAddress(str?: string): boolean {
    if (!str) return false;

    if (str.length !== ETH_ADDRESS_LENGTH) {
        return false;
    }

    if (!str.startsWith('0x')) {
        return false;
    }

    return true;
}
