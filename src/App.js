// src/App.js

import React from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';

import HomeRedirect from './pages/HomeRedirect';
import MentionsLegales from './pages/MentionsLegales';
import CreditSimulation from './CreditSimulation';
import EstimationBien from './EstimationBien';
import TestFirebase from './TestFirebase';
import LoginClient from './pages/LoginClient';
import LoginBanque from './pages/LoginBanque';
import InscriptionBanque from './InscriptionBanque';
import DossierDetails from './DossierDetails';
import DemandesEnCours from './components/DemandesEnCours';
import FormulaireDossier from './FormulaireDossier';
import DashboardBanque from './DashboardBanque';
import ProtectedRoute from './components/ProtectedRoute';
import Navbar from './components/Navbar';
import DashboardClient from "./pages/DashboardClient";
import NouvelleDemande from './pages/NouvelleDemande';
import DemandesClient from './pages/DemandesClient';




import useCreateUserDossier from './hooks/useCreateUserDossier';
import useUserRole from './hooks/useUserRole';

function App() {
  const { role, loading } = useUserRole();
  useCreateUserDossier();
  const location = useLocation();

  return (
    <>
     

      <Routes>
        <Route path="/" element={<HomeRedirect />} />
        <Route path="/mentions-legales" element={<MentionsLegales />} />
        <Route path="/simulateur" element={<CreditSimulation />} />
        <Route path="/estimation" element={<EstimationBien />} />
        <Route path="/test-firebase" element={<TestFirebase />} />
        <Route path="/login-client" element={<LoginClient />} />
        <Route path="/login-banque" element={<LoginBanque />} />
        <Route path="/inscription-banque" element={<InscriptionBanque />} />
        <Route path="/dossier/:id" element={<DossierDetails />} />
        <Route path="/demandes" element={<DemandesEnCours />} />
        <Route path="/demandes-client" element={<DemandesClient />} />


        <Route
            path="/nouvelle-demande"
            element={
              <ProtectedRoute role="client">
                <NouvelleDemande />
              </ProtectedRoute>
            }
          />

        <Route
          path="/formulaire"
          element={
            <ProtectedRoute role="client">
              <FormulaireDossier />
            </ProtectedRoute>
          }
        />
        <Route
          path="/banque"
          element={
            <ProtectedRoute role="banque">
              <DashboardBanque />
            </ProtectedRoute>
          }
        />

        <Route
          path="/dashboard"
          element={
            <ProtectedRoute role="client">
              <DashboardClient />
            </ProtectedRoute>
          }
        />

      </Routes>
    </>
  );
}

export default App;
