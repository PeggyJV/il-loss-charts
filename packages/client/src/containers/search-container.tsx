import { useHistory } from 'react-router-dom';
import { Container } from 'react-bootstrap';

import { AllPairsState } from 'types/states';

import PairSearch from 'components/pair-search';

function SearchContainer({
    allPairs,
}: {
    allPairs: AllPairsState;
}): JSX.Element {
    const history = useHistory();

    if (!allPairs.pairs) {
        return (
            <Container className='loading-container'>
                <div className='wine-pulse'>🍷</div>
            </Container>
        );
    }

    (window as any).allPairs = allPairs;

    const setPairId = (pairId: string) => {
        // Update URL to go to the pair container
        history.push(`/pair?id=${pairId}`);
    };

    return (
        <Container className='pair-search-container' fluid>
            <h4 className='heading-main'>Search :: Uniswap Pairs</h4>
            <PairSearch pairs={allPairs.pairs} setPair={setPairId} />
        </Container>
    );
}

export default SearchContainer;
