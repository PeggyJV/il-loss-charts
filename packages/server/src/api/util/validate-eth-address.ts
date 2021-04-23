import { HTTPError } from 'api/util/errors';
import { isValidEthAddress } from 'util/eth';

export default function validateEthAddress(id: any, paramName = 'id'): void {
    const isValidId = isValidEthAddress(id);
    if (!isValidId) {
        throw new HTTPError(400, `'${paramName}' must be a valid ETH address.`);
    }
}