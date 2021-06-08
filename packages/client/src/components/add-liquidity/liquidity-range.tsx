import { ThreeDots } from 'react-loading-icons';
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
        <div className='liquidity-range-container'>
            <p>Liquidity Range</p>
            <div className='preview liquidity-range'>
                {pendingBounds ? (
                    <ThreeDots width='24px' height='10px' />
                ) : (
                    <>
                        <input
                            className='liquidity-range-price-input left'
                            type='number'
                            min='0'
                            value={leftPrice}
                            onChange={(e) => {
                                const val = parseFloat(e.target.value);
                                console.log('THIS IS VAL', val);
                                if (isFlipped) {
                                    updateRange(1 / val, 1);
                                } else {
                                    updateRange(val, 0);
                                }
                            }}
                        />{' '}
                        to{' '}
                        <input
                            className='liquidity-range-price-input'
                            type='number'
                            min='0'
                            value={rightPrice}
                            onChange={(e) => {
                                const val = parseFloat(e.target.value);
                                console.log('THIS IS VAL', val);
                                if (isFlipped) {
                                    updateRange(1 / val, 0);
                                } else {
                                    updateRange(val, 1);
                                }
                            }}
                        />
                    </>
                )}
            </div>
        </div>
    );
};
