
import PropTypes from 'prop-types';
import { MarketStats } from '@sommelier/shared-types';
import { Pair, DailyData, LPStats } from 'constants/prop-types';

import { PairCard } from 'components/card/pair-card';

function TopPairsWidget({
    topPairs,
    mode,
    handleAddLiquidity,
}: {
    topPairs: MarketStats[];
    mode: 'daily' | 'weekly';
    handleAddLiquidity: (pairId: MarketStats) => void;
}): JSX.Element {
    return (
        <div className='pool-stats-container'>
            {topPairs.slice(0, 10).map((pairStats, index) => (
                <PairCard
                    pairStats={pairStats}
                    mode={mode}
                    handleAddLiquidity={handleAddLiquidity}
                    key={index}
                />
                // <Card
                //     key={index}
                //     style={{
                //         width: '15em',
                //         minWidth: '15em',
                //         maxWidth: '15em',
                //         marginBottom: '1em',
                //         background: 'var(--bgDeep)',
                //         border: '1px solid var(--borderMain)',
                //         borderRadius: 'none',
                //     }}
                //     body
                // >
                //     <Card.Title>{formatPair(pairStats)}</Card.Title>
                //     <Card.Text className='annualized-apy-card-text'>
                //         <strong>
                //             <PercentChangeStat
                //                 value={pairStats.pctReturn * multiplier}
                //             />{' '}
                //             Annualized APY
                //         </strong>
                //     </Card.Text>
                //     <Card.Text>
                //         <PercentChangeStat value={pairStats.pctReturn} />{' '}
                //         {mode === 'daily' ? '24h' : '7d'} return
                //     </Card.Text>
                // </Card>
            ))}
        </div>
    );
}

TopPairsWidget.propTypes = {
    allPairs: PropTypes.shape({
        lookups: PropTypes.object.isRequired,
    }),
    lpInfo: PropTypes.shape({
        pairData: Pair.isRequired,
        historicalData: PropTypes.arrayOf(DailyData),
    }),
    lpStats: LPStats,
};

export default TopPairsWidget;
