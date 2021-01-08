
import logoMappings from 'constants/trustwallet-mappings';
import { Pair } from 'constants/prop-types';

const TokenWithLogo = (side) => {
    const TokenOnGivenSide = ({ item: pair }) => {
        let token;

        if (side === 'left') token = pair.token0;
        else if (side === 'right') token = pair.token1;
        else throw new Error('Unknown side');

        return (
            <span>
                {resolveLogo(token.id)}{' '}{token.symbol}
            </span>
        );
    }

    TokenOnGivenSide.propTypes = { item: Pair };

    return TokenOnGivenSide;
}

TokenWithLogo.displayName = 'TokenWithLogo';

export function resolveLogo(addressLower) {
    const address = logoMappings[addressLower];

    if (!address) return <span>🍇</span>;

    const imgUrl = `https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/${address}/logo.png`;
    return <span><img style={{ height: '1rem' }} src={imgUrl} alt="🍇" /></span>
}

export default TokenWithLogo;