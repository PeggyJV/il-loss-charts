import { ThreeDots } from 'react-loading-icons';
import { Box } from '@material-ui/core';

import { BoundsState } from 'types/states';

interface Props {
    pendingBounds: boolean;
    isFlipped: boolean;
    bounds: BoundsState;
    updateRange: (value: number, index: 0 | 1) => void;
}

export const LiquidityRange = ({
    pendingBounds,
    isFlipped,
    bounds,
    updateRange,
}: Props): JSX.Element => {
    const leftPrice = isFlipped ? 1 / bounds.prices[1] : bounds.prices[0];
    const rightPrice = isFlipped ? 1 / bounds.prices[0] : bounds.prices[1];
    return (
        <>
            <Box display='flex' justifyContent='space-between'>
                <div className='liquidity-range-container'>
                    <div className='liquidity-range-label'>
                        Liquidity Range Lower Bound
                    </div>
                    <div className='liquidity-range'>
                        {pendingBounds ? (
                            <ThreeDots width='24px' height='10px' />
                        ) : (
                            <div>
                                <input
                                    className='liquidity-range-price-input'
                                    type='number'
                                    min='0'
                                    value={leftPrice}
                                    onChange={(e) => {
                                        const val = parseFloat(e.target.value);
                                        if (isFlipped) {
                                            updateRange(1 / val, 1);
                                        } else {
                                            updateRange(val, 0);
                                        }
                                    }}
                                />
                            </div>
                        )}
                    </div>
                </div>
            </Box>
            <Box display='flex' justifyContent='space-between'>
                <div className='liquidity-range-container'>
                    <div className='liquidity-range-label'>
                        Liquidity Range Upper Bound
                    </div>
                    <div className='liquidity-range'>
                        {pendingBounds ? (
                            <ThreeDots width='24px' height='10px' />
                        ) : (
                            <div>
                                <input
                                    className='liquidity-range-price-input'
                                    type='number'
                                    min='0'
                                    value={rightPrice}
                                    onChange={(e) => {
                                        const val = parseFloat(e.target.value);
                                        if (isFlipped) {
                                            updateRange(1 / val, 0);
                                        } else {
                                            updateRange(val, 1);
                                        }
                                    }}
                                />
                            </div>
                        )}
                    </div>
                </div>
            </Box>
        </>
    );
};
