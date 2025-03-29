import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import CreditSimulation from './CreditSimulation';
import EstimationBien from './EstimationBien';

function App() {
  return (
    <Router>
      <div className="App">
        <nav style={{ marginBottom: '20px' }}>
          <Link to="/" style={{ marginRight: '20px' }}>Simulation de crédit</Link>
          <Link to="/estimation">Estimation immobilière</Link>
        </nav>

        <Routes>
          <Route path="/" element={<CreditSimulation />} />
          <Route path="/estimation" element={<EstimationBien />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
