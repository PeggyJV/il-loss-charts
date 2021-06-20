import { EthGasPrices } from '@sommelier/shared-types';
import { useContext } from 'react';
import {
    LiquidityContext,
    GasPriceSelection,
} from 'containers/liquidity-container';
import classNames from 'classnames';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faCheckCircle,
    faTimesCircle,
} from '@fortawesome/free-solid-svg-icons';
import { faCircle } from '@fortawesome/free-regular-svg-icons';
import { ThreeDots } from 'react-loading-icons';
import { Box } from '@material-ui/core';

export const SettingsPopover = ({
    show,
    onClose,
    gasPrices,
}: {
    show: boolean;
    onClose: (e: React.MouseEvent<SVGSVGElement>) => void;
    gasPrices: EthGasPrices | null;
}): JSX.Element | null => {
    console.log(show);
    return (
        <div className='settings-popover'>
            <div style={{ padding: '1rem' }}>
                <Box display='flex' justifyContent='space-between'>
                    <div>Settings</div>
                    <FontAwesomeIcon icon={faTimesCircle} onClick={onClose} />
                </Box>
                <br />
                <TransactionSettings gasPrices={gasPrices} />
            </div>
        </div>
    );
};

const TransactionSettings = ({
    gasPrices,
}: {
    gasPrices: EthGasPrices | null;
}) => {
    const { selectedGasPrice, setSelectedGasPrice } = useContext(
        LiquidityContext,
    );

    const isStandardActive = selectedGasPrice === GasPriceSelection.Standard;
    const isFastActive = selectedGasPrice === GasPriceSelection.Fast;
    const isFastestActive = selectedGasPrice === GasPriceSelection.Fastest;

    return (
        <>
            {setSelectedGasPrice && (
                <Box
                    display='flex'
                    flexDirection='column'
                    justifyContent='space-between'
                    className='transaction-speed'
                >
                    <Box
                        display='flex'
                        justifyContent='space-between'
                        alignItems='center'
                        className={classNames({ active: isStandardActive })}
                        onClick={() =>
                            setSelectedGasPrice(GasPriceSelection.Standard)
                        }
                    >
                        <div>
                            {isStandardActive ? (
                                <FontAwesomeIcon icon={faCheckCircle} />
                            ) : (
                                <FontAwesomeIcon icon={faCircle} />
                            )}
                            <span>Standard </span>
                        </div>
                        <div>
                            {gasPrices?.standard ?? (
                                <ThreeDots width='24px' height='24px' />
                            )}{' '}
                            Gwei
                        </div>
                    </Box>
                    <Box
                        display='flex'
                        justifyContent='space-between'
                        alignItems='center'
                        className={classNames({ active: isFastActive })}
                        onClick={() =>
                            setSelectedGasPrice(GasPriceSelection.Fast)
                        }
                    >
                        <div>
                            {isFastActive ? (
                                <FontAwesomeIcon icon={faCheckCircle} />
                            ) : (
                                <FontAwesomeIcon icon={faCircle} />
                            )}
                            <span>Fast</span>
                        </div>
                        <div>
                            {gasPrices?.fast ?? (
                                <ThreeDots width='24px' height='24px' />
                            )}{' '}
                            Gwei
                        </div>
                    </Box>
                    <Box
                        display='flex'
                        justifyContent='space-between'
                        alignItems='center'
                        className={classNames({ active: isFastestActive })}
                        onClick={() =>
                            setSelectedGasPrice(GasPriceSelection.Fastest)
                        }
                    >
                        <div>
                            {isFastestActive ? (
                                <FontAwesomeIcon icon={faCheckCircle} />
                            ) : (
                                <FontAwesomeIcon icon={faCircle} />
                            )}
                            <span>Fastest</span>
                        </div>
                        <div>
                            {gasPrices?.fastest ?? (
                                <ThreeDots width='24px' height='24px' />
                            )}{' '}
                            Gwei
                        </div>
                    </Box>
                </Box>
            )}
        </>
    );
};
