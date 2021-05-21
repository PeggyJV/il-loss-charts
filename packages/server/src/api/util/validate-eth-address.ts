import { CustomHelpers } from 'joi';
import { isValidEthAddress } from 'util/eth';

export default function validateEthAddress(
    id: string,
    helpers: CustomHelpers,
): string {
    const prop = helpers?.state?.path?.[0] ?? 'id';
    const isValidId = isValidEthAddress(id);
    if (!isValidId) {
        throw new Error(`"${prop}" must be a valid ETH address.`);
    }

    const validAddress: string = id;
    return validAddress;
}
