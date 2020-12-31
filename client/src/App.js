import 'bootstrap/dist/css/bootstrap.min.css';
import 'react-widgets/dist/css/react-widgets.css';
import 'styles/app.scss';

import AppContainer from 'containers/app-container';
import GA, { init as initGA } from 'util/google-analytics';

function App() {
    return (
        <div className="app">
            { initGA() && <GA />}
            <AppContainer />
        </div>
    );
}

export default App;
