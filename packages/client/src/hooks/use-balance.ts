import { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import erc20Abi from 'constants/abis/erc20.json';
import { WalletBalances } from 'types/states';
import { PoolOverview } from 'hooks/data-fetchers';
import { useWallet } from 'hooks/use-wallet';
import { poolSymbol } from 'util/formats';
import config from 'config';
const EXCHANGE_ADD_ABI_ADDRESS = '0xFd8A61F94604aeD5977B31930b48f1a94ff3a195';
const EXCHANGE_REMOVE_ABI_ADDRESS =
    '0x418915329226AE7fCcB20A2354BbbF0F6c22Bd92';
const EXCHANGE_TWO_SIDE_ADD_ABI_ADDRESS =
    '0xA522AA47C40F2BAC847cbe4D37455c521E69DEa7';

type Props = {
    pool: PoolOverview | void;
};
export const useBalance = ({ pool }: Props): WalletBalances => {
    const { wallet } = useWallet();
    let provider: ethers.providers.Web3Provider;
    if (wallet.provider) {
        provider = new ethers.providers.Web3Provider(wallet?.provider);
    }

    const [balances, setBalances] = useState<WalletBalances>({});

    useEffect(() => {
        // get balances of both tokens
        const getBalances = async () => {
            if (!provider || !wallet.account) return;
            if (!pool || !pool.token0 || !pool.token1) return;

            const getTokenBalances = [pool.token0.id, pool.token1.id].map(
                async (tokenAddress) => {
                    if (!tokenAddress) {
                        throw new Error(
                            'Could not get balance for pair without token address'
                        );
                    }
                    const token = new ethers.Contract(
                        tokenAddress,
                        erc20Abi
                    ).connect(provider);

                    try {
                        const balance: ethers.BigNumber = await token.balanceOf(
                            wallet.account
                        );
                        return balance;
                    } catch (e) {
                        console.error(
                            // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
                            `Could not get balance of token ${tokenAddress} for wallet ${wallet.account}`
                        );
                        console.error(`Error; ${e.message as string}`);
                        return ethers.BigNumber.from(0);
                    }
                }
            );

            const getAllowances = [pool.token0.id, pool.token1.id].map(
                async (tokenAddress) => {
                    if (!tokenAddress) {
                        throw new Error(
                            'Could not get balance for pair without token address'
                        );
                    }
                    const token = new ethers.Contract(
                        tokenAddress,
                        erc20Abi
                    ).connect(provider);

                    const targetAddress =
                        config.networks[wallet.network || '1']?.contracts
                            ?.ADD_LIQUIDITY_V3;

                    try {
                        const allowance: ethers.BigNumber = await token.allowance(
                            wallet.account,
                            targetAddress
                        );
                        return allowance;
                    } catch (e) {
                        console.error(
                            `Could not get allowance of contract ${targetAddress as string} on behalf of ${
                                wallet?.account ?? ''
                                // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
                            } for token ${tokenAddress}`
                        );
                        // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
                        console.error(`Error; ${e.message}`);
                        return ethers.BigNumber.from(0);
                    }
                }
            );

            const getTwoSideAllowances = [pool.token0.id, pool.token1.id].map(
                async (tokenAddress) => {
                    if (!tokenAddress) {
                        throw new Error(
                            'Could not get balance for pair without token address'
                        );
                    }
                    const token = new ethers.Contract(
                        tokenAddress,
                        erc20Abi
                    ).connect(provider);

                    const targetAddress = EXCHANGE_TWO_SIDE_ADD_ABI_ADDRESS;

                    try {
                        const allowance: ethers.BigNumber = await token.allowance(
                            wallet.account,
                            targetAddress
                        );
                        return allowance;
                    } catch (e) {
                        console.error(
                            `Could not get two-sided allowance of contract ${targetAddress} on behalf of ${
                                wallet?.account ?? ''
                                // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
                            } for token ${tokenAddress}`
                        );
                        // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
                        console.error(`Error; ${e.message}`);
                        return ethers.BigNumber.from(0);
                    }
                }
            );

            const getEthBalance = provider.getBalance(wallet.account);
            const [
                ethBalance,
                token0Balance,
                token1Balance,
                pairBalance,
                token0Allowance,
                token1Allowance,
                pairAllowance,
            ] = await Promise.all([
                getEthBalance,
                ...getTokenBalances,
                ...getAllowances,
            ]);

            const [
                addTwoToken0Allowance,
                addTwoToken1Allowance,
                addTwoPairAllowance,
            ] = await Promise.all([...getTwoSideAllowances]);

            // Get balance for other two tokens
            setBalances({
                ETH: {
                    id: '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE',
                    symbol: 'ETH',
                    balance: ethBalance,
                    decimals: '18',
                    allowance: {
                        [EXCHANGE_ADD_ABI_ADDRESS]: ethers.BigNumber.from(0),
                        [EXCHANGE_TWO_SIDE_ADD_ABI_ADDRESS]: ethers.BigNumber.from(
                            0
                        ),
                    },
                },
                [pool.token0.symbol]: {
                    id: pool.token0.id,
                    symbol: pool.token0.symbol,
                    balance: token0Balance,
                    decimals: pool.token0.decimals,
                    allowance: {
                        [EXCHANGE_ADD_ABI_ADDRESS]: token0Allowance,
                        [EXCHANGE_TWO_SIDE_ADD_ABI_ADDRESS]: addTwoToken0Allowance,
                    },
                },
                [pool.token1.symbol]: {
                    id: pool.token1.id,
                    symbol: pool.token1.symbol,
                    balance: token1Balance,
                    decimals: pool.token0.decimals,
                    allowance: {
                        [EXCHANGE_ADD_ABI_ADDRESS]: token1Allowance,
                        [EXCHANGE_TWO_SIDE_ADD_ABI_ADDRESS]: addTwoToken1Allowance,
                    },
                },
                currentPair: {
                    id: pool.id,
                    symbol: poolSymbol(pool),
                    balance: pairBalance,
                    decimals: '18',
                    allowance: {
                        [EXCHANGE_ADD_ABI_ADDRESS]: pairAllowance,
                        [EXCHANGE_REMOVE_ABI_ADDRESS]: addTwoPairAllowance,
                    },
                },
            });
        };

        void getBalances();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [wallet, pool]);

    return balances;
};
