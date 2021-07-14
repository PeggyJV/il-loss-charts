import { Box } from '@material-ui/core';
import { useState, Dispatch, SetStateAction, useContext } from 'react';
import Slider from '@material-ui/core/Slider';
import { V3PositionData } from '@sommelier/shared-types/src/api';
import BigNumber from 'bignumber.js';
import { resolveLogo } from 'components/token-with-logo';
import { ethers } from 'ethers';
import config from 'config/app';
import removeLiquidityAbi from 'constants/abis/uniswap_v3_remove_liquidity.json';
import erc721Abi from 'constants/abis/uniswap_nfpm.json';
import { LiquidityContext } from 'containers/liquidity-container';
import { toastSuccess, toastWarn, toastError } from 'util/toasters';
import { compactHash } from 'util/formats';
import { useWallet } from 'hooks/use-wallet';
import { usePendingTx, PendingTx } from 'hooks/use-pending-tx';
import { handleGasEstimationError } from 'components/add-liquidity/add-liquidity-v3';
import { debug } from 'util/debug';
import Sentry, { SentryError } from 'util/sentry';
import { EthGasPrices } from '@sommelier/shared-types';
import './positions.scss';

export const RemovePosition = ({
    positionPoolStats,
    setShowRemoveLiquidity,
    gasPrices,
}: {
    positionPoolStats: V3PositionData;
    setShowRemoveLiquidity: Dispatch<SetStateAction<boolean>>;
    gasPrices: EthGasPrices | null;
}): JSX.Element => {
    const [removeAmountPercent, setRemoveAmountPercent] = useState<number>(100);
    const { stats, position } = positionPoolStats;
    const { wallet } = useWallet();
    const [pendingApproval, setPendingApproval] = useState(false);
    const { setPendingTx } = usePendingTx();
    let provider: ethers.providers.Web3Provider | null = null;
    if (wallet?.provider) {
        provider = new ethers.providers.Web3Provider(wallet?.provider);
    }

    // gas works
    const { selectedGasPrice } = useContext(LiquidityContext);
    let currentGasPrice: number | null = null;
    let baseGasPrice: string | null;
    if (gasPrices && selectedGasPrice) {
        currentGasPrice = gasPrices[selectedGasPrice];
        baseGasPrice = ethers.utils
            .parseUnits(currentGasPrice.toString(), 9)
            .toString();
    }

    const doRemoveLiquidity = async (): Promise<void> => {
        // bail out if we dont have some stuff
        if (!position || !provider || !currentGasPrice) return;

        // get remove contract address
        const removeLiquidityV3ContractAddress =
            config.networks[wallet.network || '1']?.contracts
                ?.REMOVE_LIQUIDITY_V3;

        if (!removeLiquidityV3ContractAddress) {
            throw new Error(
                'Remove liquidity contract not available on this network.',
            );
        }

        // Create signer
        const signer = provider.getSigner();

        const removeLiquidityContract = new ethers.Contract(
            removeLiquidityV3ContractAddress,
            (removeLiquidityAbi as unknown) as typeof removeLiquidityV3ContractAddress,
            signer,
        );

        debug.contract = removeLiquidityContract;
        const nfpmContractAddress =
            config.networks[wallet.network || '1']?.contracts
                ?.NON_FUNGIBLE_POSITION_MANAGER;
        if (!nfpmContractAddress) {
            throw new Error(
                'Remove liquidity contract not available on this network.',
            );
        }

        const erc721Contract = new ethers.Contract(
            nfpmContractAddress,
            erc721Abi,
            signer,
        );

        // get approved address for the NFLP
        const approvedAddress = await erc721Contract.getApproved(position?.id);
        // check if our remove contract is the approved address
        const needsApproval =
            approvedAddress !== removeLiquidityV3ContractAddress;

        if (needsApproval) {
            // approve removal of position
            let approvalEstimate: ethers.BigNumber | null = null;

            try {
                approvalEstimate = await erc721Contract.estimateGas.approve(
                    removeLiquidityV3ContractAddress,
                    position?.id,
                    { gasPrice: baseGasPrice },
                );
                approvalEstimate = approvalEstimate.add(
                    approvalEstimate.div(3),
                );
            } catch (err) {
                // TODO: ADD TOAST MESSAGE
                // Send event to sentry
                return handleGasEstimationError(err, {
                    type: 'remove::liquidity::gasEstimate',
                    method: 'approve',
                    account: wallet?.account,
                    to: nfpmContractAddress,
                    tokenId: position?.id,
                });
            }

            setPendingApproval(true);
            let approveHash: string | undefined;
            try {
                const { hash } = await erc721Contract.approve(
                    removeLiquidityV3ContractAddress,
                    position?.id,

                    {
                        gasPrice: baseGasPrice,
                        gasLimit: approvalEstimate,
                    },
                );
                approveHash = hash;
            } catch (e) {
                setPendingApproval(false);
                return;
            }

            // setApprovalState('pending');
            if (approveHash) {
                toastWarn(`Approving tx ${compactHash(approveHash)}`);
                setPendingTx &&
                    setPendingTx(
                        (state: PendingTx): PendingTx =>
                            ({
                                approval: [...state.approval, approveHash],
                                confirm: [...state.confirm],
                            } as PendingTx),
                    );
                await provider.waitForTransaction(approveHash);
                setPendingApproval(false);
                setPendingTx &&
                    setPendingTx(
                        (state: PendingTx): PendingTx =>
                            ({
                                approval: [
                                    ...state.approval.filter(
                                        (h) => h != approveHash,
                                    ),
                                ],
                                confirm: [...state.confirm],
                            } as PendingTx),
                    );
            }
        }
        // volumeFi contract tx fee
        const baseMsgValue = ethers.utils.parseEther('0.005');
        const value = baseMsgValue.toString();
        let gasEstimate: ethers.BigNumber;
        const deadline = Math.floor(Date.now() / 1000) + 86400000;
        // calculate what % of liquidity to remove from slider input
        const liquidityMultiplier = removeAmountPercent / 100;
        const liquidity = new BigNumber(position?.liquidity)
            .times(liquidityMultiplier)
            .toFixed(0)
            .toString();
        const removeParams = [liquidity, wallet?.account, deadline];

        try {
            gasEstimate = await removeLiquidityContract.estimateGas[
                'removeLiquidityFromUniV3NFLP(uint256,(uint256,address,uint256),bool)'
            ](position?.id, removeParams, false, {
                gasPrice: baseGasPrice,
                value, // flat fee sent to contract - 0.0005 ETH - with ETH added if used as entry
            });

            // Add a 30% buffer over the ethers.js gas estimate. We don't want transactions to fail
            gasEstimate.add(gasEstimate.div(2));
        } catch (err) {
            return handleGasEstimationError(err, {
                type: 'remove::liquidity',
                method: 'removeLiquidityFromUniV3NFLP',
                account: wallet?.account,
                to: removeLiquidityV3ContractAddress,
            });
        }

        const { hash } = await removeLiquidityContract[
            'removeLiquidityFromUniV3NFLP(uint256,(uint256,address,uint256),bool)'
        ](position?.id, removeParams, false, {
            gasPrice: baseGasPrice,
            value, // flat fee sent to contract - 0.0005 ETH - with ETH added if used as entry
        });

        if (hash) {
            toastWarn(`Confirming tx ${compactHash(hash)}`);
            setPendingTx &&
                setPendingTx(
                    (state: PendingTx): PendingTx =>
                        ({
                            approval: [...state.approval],
                            confirm: [...state.confirm, hash],
                        } as PendingTx),
                );

            if (provider) {
                const txStatus: ethers.providers.TransactionReceipt = await provider.waitForTransaction(
                    hash,
                );

                const { status } = txStatus;

                if (status === 1) {
                    toastSuccess(`Confirmed tx ${compactHash(hash)}`);
                    setPendingTx &&
                        setPendingTx(
                            (state: PendingTx): PendingTx =>
                                ({
                                    approval: [...state.approval],
                                    confirm: [
                                        ...state.approval.filter(
                                            (hash) => hash !== hash,
                                        ),
                                    ],
                                } as PendingTx),
                        );
                } else {
                    toastError(`Rejected tx ${compactHash(hash)}`);
                    setPendingTx &&
                        setPendingTx(
                            (state: PendingTx): PendingTx =>
                                ({
                                    approval: [...state.approval],
                                    confirm: [
                                        ...state.approval.filter(
                                            (hash) => hash !== hash,
                                        ),
                                    ],
                                } as PendingTx),
                        );
                }
            }
        }
    };

    const percentStyle = {
        borderRadius: '4px',
        padding: '0.5rem 1rem',
        border: '1px solid borderPrimary',
        bgcolor: 'var(--objPrimary)',
        margin: '0 0.5rem',
    };

    return (
        <>
            <Box
                p='1rem'
                display='flex'
                alignItems='center'
                justifyContent='space-between'
            >
                <Box>
                    Remove Amount{' '}
                    <span
                        style={{ fontSize: '2rem', color: 'var(--faceDeep)' }}
                    >
                        {removeAmountPercent}
                        <span style={{ color: 'var(--faceSecondary)' }}>%</span>
                    </span>
                </Box>
                <Box display='flex' flexDirection='column'>
                    <Box display='flex' justifyContent='center'>
                        <Box
                            sx={percentStyle}
                            style={{ cursor: 'pointer' }}
                            onClick={() => setRemoveAmountPercent(25)}
                        >
                            25%
                        </Box>
                        <Box
                            sx={percentStyle}
                            style={{ cursor: 'pointer' }}
                            onClick={() => setRemoveAmountPercent(50)}
                        >
                            50%
                        </Box>
                        <Box
                            sx={percentStyle}
                            style={{ cursor: 'pointer' }}
                            onClick={() => setRemoveAmountPercent(75)}
                        >
                            75%
                        </Box>
                        <Box
                            sx={percentStyle}
                            style={{ cursor: 'pointer' }}
                            onClick={() => setRemoveAmountPercent(100)}
                        >
                            Max
                        </Box>
                    </Box>
                    <Box>
                        <Slider
                            aria-label='Small'
                            valueLabelDisplay='auto'
                            onChange={(_, value) =>
                                setRemoveAmountPercent(value as number)
                            }
                            min={1}
                            value={removeAmountPercent}
                        />
                    </Box>
                </Box>
            </Box>
            <Box
                display='flex'
                justifyContent='space-between'
                borderRadius='4px'
                border='1px solid var(--borderDefault)'
                bgcolor='var(--bgDeep)'
                mb='1rem'
                p='0.5rem'
                // lineHeight='1.75rem'
            >
                <table width='100%'>
                    <thead>
                        <tr
                            style={{
                                color: 'var(--faceSecondary)',
                                fontSize: '0.75rem',
                            }}
                        >
                            <td></td>
                            <td>Pooled</td>
                            <td>Fees</td>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td>
                                {resolveLogo(position?.pool?.token0?.id)}{' '}
                                <span
                                    style={{
                                        fontWeight: 'bold',
                                        color: 'var(--faceDeep)',
                                        fontSize: '1rem',
                                    }}
                                >
                                    {position?.pool?.token0?.symbol}
                                </span>
                            </td>
                            <td>
                                {new BigNumber(stats?.token0Amount)
                                    .times(removeAmountPercent / 100)
                                    .toFixed(8)}
                            </td>
                            <td>
                                {new BigNumber(stats?.uncollectedFees0).toFixed(
                                    8,
                                )}
                            </td>
                        </tr>
                        <tr>
                            <td>
                                {resolveLogo(position?.pool?.token1?.id)}{' '}
                                <span
                                    style={{
                                        fontWeight: 'bold',
                                        color: 'var(--faceDeep)',
                                        fontSize: '1rem',
                                    }}
                                >
                                    {position?.pool?.token1?.symbol}
                                </span>
                            </td>
                            <td>
                                {new BigNumber(stats?.token1Amount)
                                    .times(removeAmountPercent / 100)
                                    .toFixed(8)}
                            </td>
                            <td>
                                {new BigNumber(stats?.uncollectedFees1).toFixed(
                                    8,
                                )}
                            </td>
                        </tr>
                    </tbody>
                </table>
            </Box>
            <Box display='flex' textAlign='center'>
                <button
                    className='cancel-remove'
                    onClick={() => setShowRemoveLiquidity(false)}
                >
                    Cancel
                </button>
                &nbsp;
                <button
                    className='remove-position'
                    onClick={() => doRemoveLiquidity()}
                    disabled={pendingApproval}
                >
                    Remove
                </button>
            </Box>
        </>
    );
};
