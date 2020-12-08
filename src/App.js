import './App.css';
import { Container } from '@material-ui/core';
import AppContainer from 'containers/app-container';

function App() {
    return (
        <Container maxWidth="md">
            <div className="App">
                <h2 className="page-title">Impermanent Loss Calculator</h2>
                <AppContainer />
            </div>
        </Container>
    );
}

export default App;
