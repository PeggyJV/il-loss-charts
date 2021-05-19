import { Modal } from 'react-bootstrap';

type Props = {
    show: boolean;
    handleClose: () => void;
    titleText: string;
    renderBody: string | JSX.Element;
    renderFooter: string | JSX.Element;
};
export const InfoModal = ({
    show,
    handleClose,
    titleText,
    renderBody,
    renderFooter,
}: Props): JSX.Element => (
    <Modal show={show} onHide={handleClose} dialogClassName='dark'>
        <Modal.Header className='connect-wallet-modal-header' closeButton>
            <Modal.Title className='connect-wallet-modal-title'>
                {titleText}
            </Modal.Title>
        </Modal.Header>

        <Modal.Body className='connect-wallet-modal'>
            <p className='centered'>{renderBody}</p>
        </Modal.Body>

        <Modal.Footer className='manage-liquidity-modal-footer'>
            {renderFooter}
        </Modal.Footer>
    </Modal>
);
