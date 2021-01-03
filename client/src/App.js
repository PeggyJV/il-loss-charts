import 'bootstrap/dist/css/bootstrap.min.css';
import 'react-widgets/dist/css/react-widgets.css';
import 'styles/app.scss';

import { BrowserRouter as Router, Switch } from 'react-router-dom';

import PairContainer from 'containers/pair-container';

function App() {
    return (
        <Router>
            <div className="app">
                <Switch>
                    <Route path='/'>
                    </Route>
                    <Route path='/pair/:id'>
                        <PairContainer />
                    </Route>
                </Switch>
            </div>
        </Router>
    );
}

export default App;
