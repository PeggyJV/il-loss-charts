import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { ButtonGroup, Modal } from 'react-bootstrap';
import classNames from 'classnames';
import { toastWarn, toastSuccess, toastError } from 'util/toasters';
import { ethers } from 'ethers';
import { EthGasPrices, LPPositionData } from '@sommelier/shared-types';
import { Wallet } from 'types/states';
import { compactHash } from 'util/formats';
import { UniswapApiFetcher as Uniswap } from 'services/api';
import { usePairDataOverview } from 'hooks/use-pair-data-overview';
import AddLiquidity from 'components/add-liquidity';
import RemoveLiquidity from 'components/remove-liquidity';
import { usePendingTx, PendingTx } from 'hooks/use-pending-tx';
import { useBalance } from 'hooks/use-balance-v2';
import { debug } from 'util/debug';

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

    const pairData = usePairDataOverview(pairId, wallet.network || '1');

    const [
        positionData,
        setPositionData,
    ] = useState<LPPositionData<string> | null>(null);
    const { setPendingTx } = usePendingTx();
    let provider: ethers.providers.Web3Provider | null = null;

    if (wallet.provider) {
        provider = new ethers.providers.Web3Provider(wallet?.provider);
    }
    const balances = useBalance({ pairData, wallet });

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
                    } as PendingTx),
            );

        toastWarn(`Confirming tx ${compactHash(txHash)}`);
        if (provider) {
            const txStatus: ethers.providers.TransactionReceipt = await provider.waitForTransaction(
                txHash,
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
                                        (hash) => hash !== txHash,
                                    ),
                                ],
                            } as PendingTx),
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
                                        (hash) => hash !== txHash,
                                    ),
                                ],
                            } as PendingTx),
                    );
            }
        }
    };
    const handleClose = () => {
        setMode('add');
        setShow(false);
    };

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
    debug.balances = balances;
    debug.pairData = pairData;
    debug.positionData = positionData;
    debug.ethers = ethers;
    debug.gasPrices = gasPrices;

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

export default ManageLiquidityModal;
