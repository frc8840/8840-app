import logo from './logo.svg';
import './App.css';

import { Route, Routes } from 'react-router';
import Home from './pages/home/Home';

import init from './scripts/pynetworktables2js/wrapper'

//Init pynetworktables2js and extra wrapper for some extra functionality for 8840-lib
init("192.168.5.143", 8888);

function App() {
    return (
        <div className="App">
            <Routes>
                <Route path="/">

                    <Route 
                        index 
                        element={<Home/>}
                    />
                </Route>
            </Routes>
        </div>
    );
}

export default App;
