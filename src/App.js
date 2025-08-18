// src/App.js

import React from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';

import HomeRedirect from './pages/HomeRedirect';
import MentionsLegales from './pages/MentionsLegales';
import ContactFormPage from "./pages/contactform";

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
import TypeDemande from './pages/TypeDemande';
import DonneesPersonnelles from "./pages/DossierInformationsPersonnelles/DonneesPersonnelles";
import InformationsPersonnelles from "./pages/DossierInformationsPersonnelles/InformationsPersonnelles";
import InformationsPrenom from "./pages/DossierInformationsPersonnelles/InformationsPrenom";
import InformationsCivilite from "./pages/DossierInformationsPersonnelles/InformationsCivilite";
import InformationsNomFamille from "./pages/DossierInformationsPersonnelles/InformationsNomFamille";
import InformationsNaissance from "./pages/DossierInformationsPersonnelles/InformationsNaissance";
import InformationsEtatCivil from "./pages/DossierInformationsPersonnelles/InformationsEtatCivil";
import InformationsDegreFormation from "./pages/DossierInformationsPersonnelles/InformationsDegreFormation";
import InformationsAdresse from "./pages/DossierInformationsPersonnelles/InformationsAdresse";
import InformationsNationalite from "./pages/DossierInformationsPersonnelles/InformationsNationalite";
import InformationsEnfants from "./pages/DossierInformationsPersonnelles/InformationsEnfants";
import InformationsRelation from "./pages/DossierInformationsPersonnelles/InformationsRelation";
import FormulaireEmployeur from "./pages/DossierInformationsPersonnelles/FormulaireEmployeur";











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
<Route path="/contactform" element={<ContactFormPage />} />
<Route path="/simulateur" element={<CreditSimulation />} />
<Route path="/estimation" element={<EstimationBien />} />
<Route path="/test-firebase" element={<TestFirebase />} />
<Route path="/login-client" element={<LoginClient />} />
<Route path="/login-banque" element={<LoginBanque />} />
<Route path="/inscription-banque" element={<InscriptionBanque />} />
<Route path="/dossier/:id" element={<DossierDetails />} />
<Route path="/demandes" element={<DemandesEnCours />} />
<Route path="/type-demande" element={<TypeDemande />} />
<Route path="/informations-personnelles" element={<DonneesPersonnelles />} />

{/* Vue d’ensemble d’une personne */}
<Route path="/informations/:personneId/:id" element={<InformationsPersonnelles />} />

{/* Champs individuels dynamiques */}
<Route path="/informations/:personneId/:id/prenom" element={<InformationsPrenom />} />
<Route path="/informations/:personneId/:id/civilite" element={<InformationsCivilite />} />
<Route path="/informations/:personneId/:id/nom" element={<InformationsNomFamille />} />
<Route path="/informations/:personneId/:id/naissance" element={<InformationsNaissance />} />
<Route path="/informations/:personneId/:id/etat-civil" element={<InformationsEtatCivil />} />
<Route path="/informations/:personneId/:id/formation" element={<InformationsDegreFormation />} />
<Route path="/informations/:personneId/:id/adresse" element={<InformationsAdresse />} />
<Route path="/informations/:personneId/:id/nationalite" element={<InformationsNationalite />} />
<Route path="/informations/:personneId/:id/enfants" element={<InformationsEnfants />} />
<Route path="/informations/:personneId/:id/relation" element={<InformationsRelation />} />

<Route path="/informations/:personneId/:id/employeurs/:employeurId" element={<FormulaireEmployeur />}/>








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
