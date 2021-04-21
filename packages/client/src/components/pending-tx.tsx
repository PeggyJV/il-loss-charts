import { useContext, ReactElement } from 'react';
import { PendingTxContext } from 'app';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faExternalLinkAlt } from '@fortawesome/free-solid-svg-icons';

// TODO Make a scroll UI component
const PendingTx = (): ReactElement => {
    const { pendingTx } = useContext(PendingTxContext);

    const awaitingApproval = pendingTx?.approval.length ?? 0;
    const awaitingConfirm = pendingTx?.confirm.length ?? 0;

    const totalPending = awaitingApproval + awaitingConfirm;

    return (
        <div className='scroll'>
            <div>
                <span>
                    <span className='bullet'>{totalPending}</span>
                    &nbsp; &nbsp; Pending
                </span>
            </div>
            <ul>
                {pendingTx?.approval.map((hash) => (
                    <li key={hash}>
                        <a
                            rel='noreferrer'
                            href={`https://www.etherscan.io/tx/${hash}`}
                            target='_blank'
                        >
                            approve {hash.substring(0, 6).concat('... ')}
                            <FontAwesomeIcon icon={faExternalLinkAlt} />
                        </a>
                    </li>
                ))}
                {pendingTx?.confirm.map((hash) => (
                    <li key={hash}>
                        <a
                            rel='noreferrer'
                            href={`https://www.etherscan.io/tx/${hash}`}
                            target='_blank'
                        >
                            confirm {hash.substring(0, 6).concat('... ')}
                            <FontAwesomeIcon icon={faExternalLinkAlt} />
                        </a>
                    </li>
                ))}
            </ul>
        </div>
    );
};

export default PendingTx;
