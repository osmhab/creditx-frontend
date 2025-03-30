import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import CreditSimulation from './CreditSimulation';
import EstimationBien from './EstimationBien';
import TestFirebase from "./TestFirebase";
import Login from './Login';
import useCreateUserDossier from "./hooks/useCreateUserDossier";
import FormulaireDossier from "./FormulaireDossier";
import DashboardBanque from './DashboardBanque';
import useUserRole from './hooks/useUserRole';
import InscriptionBanque from './InscriptionBanque';
import DossierDetails from './DossierDetails';




function App() {
  const { role, loading } = useUserRole();
  useCreateUserDossier();

  return (
    <Router>
      <div className="App">
        <nav style={{ marginBottom: '20px' }}>
          <Link to="/" style={{ marginRight: '20px' }}>Simulation de crédit</Link>
          <Link to="/estimation" style={{ marginRight: '20px' }}>Estimation immobilière</Link>
          <Link to="/test-firebase" style={{ marginRight: '20px' }}>Test Firebase</Link>
          <Link to="/login" style={{ marginRight: '20px' }}>Connexion</Link>
          <Link to="/formulaire" style={{ marginRight: '20px' }}>Dossier</Link>
          <Link to="/inscription-banque">Créer un compte banque</Link>

          {role === "banque" && <Link to="/banque">Dashboard Banque</Link>}
        </nav>

        <Routes>
          <Route path="/" element={<CreditSimulation />} />
          <Route path="/estimation" element={<EstimationBien />} />
          <Route path="/test-firebase" element={<TestFirebase />} />
          <Route path="/login" element={<Login />} />
          <Route path="/formulaire" element={<FormulaireDossier />} />
          <Route path="/inscription-banque" element={<InscriptionBanque />} />
          <Route path="/dossier/:id" element={<DossierDetails />} />



          {role === "banque" && (
            <Route path="/banque" element={<DashboardBanque />} />
          )}
          {!loading && role !== "banque" && (
            <Route path="/banque" element={<p>⛔ Accès réservé à la banque</p>} />
          )}
        </Routes>
      </div>
    </Router>
  );
}

export default App;
