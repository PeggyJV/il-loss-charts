import { useState, useEffect, useContext } from 'react';
import PropTypes from 'prop-types';
import { ButtonGroup, Modal } from 'react-bootstrap';
import classNames from 'classnames';
import { toastWarn, toastSuccess, toastError } from 'util/toasters';
import { ethers } from 'ethers';

import erc20Abi from 'constants/abis/erc20.json';

const EXCHANGE_ADD_ABI_ADDRESS = '0xFd8A61F94604aeD5977B31930b48f1a94ff3a195';
const EXCHANGE_REMOVE_ABI_ADDRESS =
    '0x430f33353490b256D2fD7bBD9DaDF3BB7f905E78';
const EXCHANGE_TWO_SIDE_ADD_ABI_ADDRESS =
    '0xA522AA47C40F2BAC847cbe4D37455c521E69DEa7';
import {
    EthGasPrices,
    LPPositionData,
    UniswapPair,
} from '@sommelier/shared-types';
import { Wallet, WalletBalances } from 'types/states';
import { compactHash } from 'util/formats';
import { UniswapApiFetcher as Uniswap } from 'services/api';
import AddLiquidity from 'components/add-liquidity';
import RemoveLiquidity from 'components/remove-liquidity';
import { PendingTxContext, PendingTx } from 'app';

// TODO convert add, remove to a hook and separate UI from it
function ManageLiquidityModal({
    show,
    setShow,
    wallet,
    pairId,
    gasPrices,
}: {
    wallet: Wallet;
    show: boolean;
    setShow: (show: boolean) => void;
    // pair: MarketStats | null;
    pairId: string | null;
    gasPrices: EthGasPrices | null;
}): JSX.Element | null {
    const [mode, setMode] = useState<'add' | 'remove'>('add');
    const [balances, setBalances] = useState<WalletBalances>({});
    const [pairData, setPairData] = useState<UniswapPair | null>(null);
    const [
        positionData,
        setPositionData,
    ] = useState<LPPositionData<string> | null>(null);
    const { setPendingTx } = useContext(PendingTxContext);
    let provider: ethers.providers.Web3Provider | null = null;

    if (wallet.provider) {
        provider = new ethers.providers.Web3Provider(wallet?.provider);
    }
    // TODO abstract this cleanly with context and reducer to be a global notification system
    const onDone = async (txHash?: string) => {
        if (!txHash) return;
        setPendingTx &&
            setPendingTx(
                (state: PendingTx): PendingTx =>
                    ({
                        approval: [
                            ...state.approval.filter((hash) => hash !== txHash),
                        ],
                        confirm: [...state.confirm, txHash],
                    } as PendingTx)
            );

        toastWarn(`Confirming tx ${compactHash(txHash)}`);
        if (provider) {
            const txStatus: ethers.providers.TransactionReceipt = await provider.waitForTransaction(
                txHash
            );
            const { status } = txStatus;

            if (status === 1) {
                toastSuccess(`Confirmed tx ${compactHash(txHash)}`);
                setPendingTx &&
                    setPendingTx(
                        (state: PendingTx): PendingTx =>
                            ({
                                approval: [...state.approval],
                                confirm: [
                                    ...state.approval.filter(
                                        (hash) => hash !== txHash
                                    ),
                                ],
                            } as PendingTx)
                    );
            } else {
                toastError(`Rejected tx ${compactHash(txHash)}`);
                setPendingTx &&
                    setPendingTx(
                        (state: PendingTx): PendingTx =>
                            ({
                                approval: [...state.approval],
                                confirm: [
                                    ...state.approval.filter(
                                        (hash) => hash !== txHash
                                    ),
                                ],
                            } as PendingTx)
                    );
            }
        }
    };
    const handleClose = () => {
        setMode('add');
        setShow(false);
    };

    useEffect(() => {
        const fetchPairData = async () => {
            if (!pairId) return;

            // Fetch pair overview when pair ID changes
            // Default to createdAt date if LP date not set
            const { data: newPair, error } = await Uniswap.getPairOverview(
                pairId
            );

            if (error) {
                // we could not get data for this new pair
                console.warn(
                    `Could not fetch pair data for ${pairId}: ${error}`
                );
                return;
            }

            if (newPair) {
                setPairData(new UniswapPair(newPair));
            }
        };

        void fetchPairData();
    }, [pairId]);

    useEffect(() => {
        const fetchPositionsForWallet = async () => {
            if (!wallet.account) return;

            const {
                data: positionData,
                error,
            } = await Uniswap.getPositionStats(wallet.account);

            if (error) {
                // we could not list pairs
                console.warn(`Could not get position stats: ${error}`);
                return;
            }

            if (positionData) {
                setPositionData(positionData);
            }
        };

        if (wallet.account) {
            void fetchPositionsForWallet();
        }

        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [wallet.account]);

    if (!wallet || !provider || !pairId) {
        return (
            <Modal show={show} onHide={handleClose}>
                <Modal.Body className='connect-wallet-modal'>
                    <p className='centered'>Connect your wallet to continue.</p>
                </Modal.Body>
            </Modal>
        );
    }

    // Calculate expected LP shares
    (window as any).balances = balances;
    (window as any).pairData = pairData;
    (window as any).positionData = positionData;
    (window as any).ethers = ethers;
    (window as any).gasPrices = gasPrices;

    if (!pairData) {
        return null;
    }

    return (
        <Modal
            show={show}
            onHide={handleClose}
            dialogClassName='dark manage-liquidity-modal'
        >
            <Modal.Header className='manage-liquidity-modal-header' closeButton>
                <ButtonGroup>
                    <button
                        className={classNames({
                            'modal-tab': true,
                            active: mode === 'add',
                        })}
                        onClick={() => setMode('add')}
                    >
                        Add
                    </button>
                    <button
                        className={classNames({
                            'modal-tab': true,
                            active: mode === 'remove',
                        })}
                        onClick={() => setMode('remove')}
                    >
                        Remove
                    </button>
                </ButtonGroup>
            </Modal.Header>
            {mode === 'add' ? (
                <AddLiquidity
                    wallet={wallet}
                    provider={provider}
                    pairData={pairData}
                    positionData={positionData}
                    gasPrices={gasPrices}
                    balances={balances}
                    onClose={handleClose}
                    onDone={onDone}
                />
            ) : (
                <RemoveLiquidity
                    wallet={wallet}
                    provider={provider}
                    pairData={pairData}
                    positionData={positionData}
                    gasPrices={gasPrices}
                    balances={balances}
                    onClose={handleClose}
                    onDone={onDone}
                />
            )}
        </Modal>
    );
}

ManageLiquidityModal.propTypes = {
    show: PropTypes.bool.isRequired,
    setShow: PropTypes.func.isRequired,
    wallet: PropTypes.shape({
        account: PropTypes.string,
        providerName: PropTypes.string,
        provider: PropTypes.object,
    }).isRequired,
};

export default ManageLiquidityModal;
