import './App.css';
import { Container } from '@material-ui/core';
import ChartsContainer from 'containers/charts-container';

function App() {
    return (
        <Container maxWidth="md">
            <div className="App">
                <h2 className="page-title">Impermanent Loss Calculator</h2>
                <ChartsContainer />
            </div>
        </Container>
    );
}

export default App;
