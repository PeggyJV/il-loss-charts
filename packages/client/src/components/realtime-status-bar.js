import { useEffect, useState } from 'react';
import { Col, Toast } from 'react-bootstrap';

function RealtimeStatusBar({ latestBlock }) {
    const [show, setShow] = useState(false);

    useEffect(() => {
        if (latestBlock) setShow(true);
    }, [latestBlock]);

    return (
        <Col xs={12}>
            <Toast onClose={() => setShow(false)} show={show} delay={3000} autohide>
                <Toast.Body>Block update - #{latestBlock} confirmed</Toast.Body>
            </Toast>
        </Col>
    );
}

export default RealtimeStatusBar;