import { Container, Row, Col } from 'react-bootstrap';

function Header() {
    return (
        <Container fluid>
            <Row>
                <Col>
                    <h6 className="social-cta">
                        <a href="https://t.me/getsomm">Join the Sommelier Community</a>
                    </h6>
                </Col>
            </Row>
            <Row>
                <Col>
                    <h2 className="page-title">
                        Uniswap Impermanent Loss Calculator
                    </h2>
                </Col>
            </Row>
        </Container>
    );
}

export default Header;