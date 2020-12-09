import './App.scss';
import 'bootstrap/dist/css/bootstrap.min.css';

import { Container, Row, Col } from 'react-bootstrap';
import AppContainer from 'containers/app-container';

function App() {
    return (
        <div className="app">
            <Container fluid="lg">
                    <Row>
                        <Col><h2 className="page-title">Uniswap Impermanent Loss Calculator</h2></Col>
                    </Row>
                    <Row>
                        <AppContainer />
                    </Row>
            </Container>
        </div>
    );
}

export default App;
