import 'bootstrap/dist/css/bootstrap.min.css';
import 'react-widgets/dist/css/react-widgets.css';
import 'styles/app.scss';

import { Container, Row, Col } from 'react-bootstrap';
import AppContainer from 'containers/app-container';

function App() {
    return (
        <div className="app">
            <Container fluid>
                <Row>
                    <Col><h2 className="page-title">Uniswap Impermanent Loss Calculator</h2></Col>
                </Row>
                <AppContainer />
            </Container>
        </div>
    );
}

export default App;
