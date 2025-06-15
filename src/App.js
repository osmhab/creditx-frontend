// src/App.js

import React from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
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
import DemandesEnCours from './components/DemandesEnCours';
import HomePage from './pages/HomePage';

import Navbar from './components/Navbar';

function App() {
  const { role, loading } = useUserRole();
  useCreateUserDossier();
  const location = useLocation();

  return (
    <>
      {/* Masquer la Navbar sur la page d’accueil */}
      {location.pathname !== '/' && <Navbar role={role} />}

      <Routes>
        {/* Page publique d'accueil */}
        <Route path="/" element={<HomePage />} />

        {/* Fonctionnalités internes */}
        {/* Tu peux commenter temporairement les routes ci-dessous si besoin */}
        <Route path="/simulateur" element={<CreditSimulation />} />
        <Route path="/estimation" element={<EstimationBien />} />
        <Route path="/test-firebase" element={<TestFirebase />} />
        <Route path="/login" element={<Login />} />
        <Route path="/formulaire" element={<FormulaireDossier />} />
        <Route path="/inscription-banque" element={<InscriptionBanque />} />
        <Route path="/dossier/:id" element={<DossierDetails />} />
        <Route path="/demandes" element={<DemandesEnCours />} />

        {/* Dashboard banque */}
        {role === "banque" && (
          <Route path="/banque" element={<DashboardBanque />} />
        )}
        {!loading && role !== "banque" && (
          <Route path="/banque" element={<p>⛔ Accès réservé à la banque</p>} />
        )}
      </Routes>
    </>
  );
}

export default App;
