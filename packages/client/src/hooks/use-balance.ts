import {useState, useEffect} from 'react';

export const useBalance = () => {

  const [balance, setBalance] = useState();
    useEffect(() => {
        // get balances of both tokens
        const getBalances = async () => {
            if (!provider || !wallet.account || !pairData) return;

            const getTokenBalances = [
                pairData.token0.id,
                pairData.token1.id,
                pairData.id,
            ].map(async (tokenAddress) => {
                if (!tokenAddress) {
                    throw new Error(
                        'Could not get balance for pair without token address'
                    );
                }
                const token = new ethers.Contract(
                    tokenAddress,
                    erc20Abi
                ).connect(provider as ethers.providers.Web3Provider);
                const balance: ethers.BigNumber = await token.balanceOf(
                    wallet.account
                );
                return balance;
            });

            const getAllowances = [
                pairData.token0.id,
                pairData.token1.id,
                pairData.id,
            ].map(async (tokenAddress) => {
                if (!tokenAddress) {
                    throw new Error(
                        'Could not get balance for pair without token address'
                    );
                }
                const token = new ethers.Contract(
                    tokenAddress,
                    erc20Abi
                ).connect(provider as ethers.providers.Web3Provider);
                const allowance: ethers.BigNumber = await token.allowance(
                    wallet.account,
                    tokenAddress === pairData.id
                        ? EXCHANGE_REMOVE_ABI_ADDRESS
                        : EXCHANGE_ADD_ABI_ADDRESS
                );

                return allowance;
            });

            const getTwoSideAllowances = [
                pairData.token0.id,
                pairData.token1.id,
                pairData.id,
            ].map(async (tokenAddress) => {
                if (!tokenAddress) {
                    throw new Error(
                        'Could not get balance for pair without token address'
                    );
                }
                const token = new ethers.Contract(
                    tokenAddress,
                    erc20Abi
                ).connect(provider as ethers.providers.Web3Provider);
                const allowance: ethers.BigNumber = await token.allowance(
                    wallet.account,
                    tokenAddress === pairData.id
                        ? EXCHANGE_REMOVE_ABI_ADDRESS
                        : EXCHANGE_TWO_SIDE_ADD_ABI_ADDRESS
                );

                return allowance;
            });

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
                [pairData.token0.symbol]: {
                    id: pairData.token0.id,
                    symbol: pairData.token0.symbol,
                    balance: token0Balance,
                    decimals: pairData.token0.decimals,
                    allowance: {
                        [EXCHANGE_ADD_ABI_ADDRESS]: token0Allowance,
                        [EXCHANGE_TWO_SIDE_ADD_ABI_ADDRESS]: addTwoToken0Allowance,
                    },
                },
                [pairData.token1.symbol]: {
                    id: pairData.token1.id,
                    symbol: pairData.token1.symbol,
                    balance: token1Balance,
                    decimals: pairData.token0.decimals,
                    allowance: {
                        [EXCHANGE_ADD_ABI_ADDRESS]: token1Allowance,
                        [EXCHANGE_TWO_SIDE_ADD_ABI_ADDRESS]: addTwoToken1Allowance,
                    },
                },
                currentPair: {
                    id: pairData.id,
                    symbol: pairData.pairReadable,
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
    }, [wallet, show, pairData]);
};
