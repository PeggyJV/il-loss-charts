import { ethers } from 'ethers';
import { WalletBalances } from 'types/states';

export const WalletBalance = ({
    balances,
}: {
    balances: WalletBalances;
}): JSX.Element => {
    return (
        <div className='balances-container'>
            <p className='sub-heading'>
                <strong>Wallet Balance</strong>
            </p>
            <table>
                {Object.keys(balances).map((token) => {
                    if (token === 'currentPair') return null;
                    const b = balances?.[token].balance;

                    return (
                        <tr key={token}>
                            <td>
                                <strong>{token}</strong>
                            </td>
                            <td>
                                {ethers.utils.formatUnits(
                                    b || 0,
                                    parseInt(
                                        balances[token]?.decimals || '0',
                                        10,
                                    ),
                                )}
                            </td>
                        </tr>
                    );
                })}
            </table>
        </div>
    );
};
