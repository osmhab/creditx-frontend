import React, { useEffect, useState } from "react";
import { doc, getDoc, updateDoc, setDoc } from "firebase/firestore";
import { db } from "./firebase-config";
import { useAuth } from "./AuthContext";
import { useLocation } from "react-router-dom";

import { ArrowBack, ArrowForward } from "@mui/icons-material";
import { CircularProgress, Container, Box, Typography, Button } from "@mui/material";
import { Collapse } from "@mui/material";


import Etape0ChoixProduit from "./components/Etape0ChoixProduit";
import Etape1Personnes from "./components/Etape1Personnes";
import Etape1InformationsPersonnelles from "./components/Etape1InformationsPersonnelles";
import Etape2SituationFinanciere from "./components/Etape2SituationFinanciere";
import Etape3Financement from "./components/Etape3Financement";
import Etape4Immeuble from "./components/Etape4Immeuble";
import Etape5Documents from "./components/Etape5Documents";
import CustomStepper from "./components/CustomStepper";
import { estimerValeurBienAvecOpenAI } from "./utils/estimationAI";



function FormulaireDossier() {
  const { user } = useAuth();
  const location = useLocation();
  const [step, setStep] = useState(0);
  const [formData, setFormData] = useState({});
  const [loading, setLoading] = useState(true);
  const [calculEffectue, setCalculEffectue] = useState(false);
  const [erreurFondPropre, setErreurFondPropre] = useState("");
  const [etape3Valide, setEtape3Valide] = useState(false);
  const [loadingContinuer, setLoadingContinuer] = useState(false);
  const [documentsComplets, setDocumentsComplets] = useState(false);

  const docRef = user ? doc(db, "dossiers", user.uid) : null;





  useEffect(() => {
    const fetchData = async () => {
      if (!user) return;
  
      const ref = doc(db, "dossiers", user.uid);
      const snap = await getDoc(ref);
      const params = new URLSearchParams(location.search);
      const isNew = params.get("new") === "1";
  
      if (isNew) {
        const emptyDossier = {
          etape: 0,
          produit: "",
          dateCreation: new Date().toISOString(),
          userId: user.uid,
        };
  
        try {
          await updateDoc(ref, emptyDossier);
        } catch {
          await setDoc(ref, emptyDossier);
        }
  
        setFormData(emptyDossier);
        setStep(0);
      } else if (snap.exists()) {
        const data = snap.data();
        setFormData(data);
        setStep(data.produit ? data.etape : 0);
      }
  
      setLoading(false);
    };
  
    fetchData();
  }, [user, location.search]);
  







  const handleChange = async (e) => {
    const { name, value } = e.target;
    const newData = { ...formData, [name]: value };
    setFormData(newData);
    if (user) {
      await updateDoc(doc(db, "dossiers", user.uid), { [name]: value });
    }
  };

  const saveStep = async (newStep) => {
    setStep(newStep);
    if (user) {
      await updateDoc(doc(db, "dossiers", user.uid), { etape: newStep });
    }
  };

  const nextStep = () => saveStep(step + 1);
  const prevStep = () => saveStep(step - 1);

  if (!user || loading) return <p>Chargement...</p>;

  const masquerDateNaissance = (val) => {
    const digits = val.replace(/\D/g, "").slice(0, 8);
    const parts = [];
    if (digits.length > 0) parts.push(digits.slice(0, 2));
    if (digits.length > 2) parts.push(digits.slice(2, 4));
    if (digits.length > 4) parts.push(digits.slice(4, 8));
    return parts.join(".");
  };

  const formaterMilliers = (val) => {
    const digits = val.replace(/\D/g, "");
    if (!digits) return "";
    return Number(digits).toLocaleString("fr-CH").replace(/\s/g, "’");
  };

  return (
    <Box sx={{ background: "#f9f9f9", minHeight: "100vh", py: 4 }}>
      <Container maxWidth="lg">
        <CustomStepper activeStep={step} />

        {step === 0 && (
          <Etape0ChoixProduit
            onSelect={async (val) => {
              const newData = { ...formData, produit: val };
              setFormData(newData);
              if (user) {
                await updateDoc(doc(db, "dossiers", user.uid), {
                  produit: val,
                  etape: 1,
                });
              }
              setStep(1);
            }}
          />
        )}

        {step === 1 && (
          <Etape1Personnes
            formData={formData}
            setFormData={setFormData}
            docRef={docRef}
            nextStep={() => saveStep(2)}
          />
        )}


        {step === 2 && (
          <Etape2SituationFinanciere
            formData={formData}
            setFormData={setFormData}
            handleChange={handleChange}
            user={user}
            docRef={docRef}
          />
        )}


        {step === 3 && (
          <Etape2SituationFinanciere
            formData={formData}
            setFormData={setFormData}
            handleChange={handleChange}
            user={user}
            docRef={docRef}
          />
        )}

        {step === 4 && (
          <Etape3Financement
            formData={formData}
            setFormData={setFormData}
            handleChange={handleChange}
            user={user}
            formaterMilliers={formaterMilliers}
            calculEffectue={calculEffectue}
            erreurFondPropre={erreurFondPropre}
            etape3Valide={etape3Valide}
            setCalculEffectue={setCalculEffectue}
            setErreurFondPropre={setErreurFondPropre}
            setEtape3Valide={setEtape3Valide}
          />
        )}

        {step === 5 && (
          <Etape4Immeuble
            formData={formData}
            setFormData={setFormData}
            user={user}
          />
        )}

        {step === 6 && (
          <Etape5Documents
            dossierId={user.uid}
            onReady={(val) => setDocumentsComplets(val)}
          />
        )}

        {step > 0 && step <= 6 && (
          <Box mt={4} display="flex" justifyContent="space-between" gap={2}>
            {step > 1 && (
              <Button
                variant="outlined"
                startIcon={<ArrowBack />}
                sx={{ minWidth: 150, height: 56 }}
                onClick={prevStep}
              >
                Retour
              </Button>
            )}

            {step === 6 && (
              <Button
                variant="contained"
                color="primary"
                sx={{ minWidth: 150, height: 56 }}
                disabled={!documentsComplets}
                onClick={() => {
                  alert("🎉 Dossier soumis avec succès !");
                }}
              >
                Soumettre le dossier
              </Button>
            )}

            {step < 6 && (step !== 4 || etape3Valide) && (
              <Button
                variant="contained"
                endIcon={
                  loadingContinuer ? (
                    <CircularProgress size={20} sx={{ color: "#fff" }} />
                  ) : (
                    <ArrowForward />
                  )
                }
                sx={{
                  minWidth: 150,
                  height: 56,
                  backgroundColor:
                    step === 3 && formData.poursuites === "oui"
                      ? "#ccc"
                      : undefined,
                  color:
                    step === 3 && formData.poursuites === "oui"
                      ? "#666"
                      : "white",
                  cursor:
                    step === 3 && formData.poursuites === "oui"
                      ? "not-allowed"
                      : "pointer",
                  "&:hover": {
                    backgroundColor:
                      step === 3 && formData.poursuites === "oui"
                        ? "#ccc"
                        : undefined,
                  },
                }}
                disabled={
                  (step === 3 && formData.poursuites === "oui") ||
                  loadingContinuer
                }
                onClick={() => {
                  if (step === 3 && formData.poursuites === "oui") {
                    alert(
                      "⚠️ Le dossier ne peut pas être poursuivi en cas de poursuites. Veuillez fournir un extrait de poursuites vierge."
                    );
                    return;
                  }
                  if (step === 4 && !etape3Valide) {
                    alert(
                      "⚠️ Merci de cliquer sur le bouton 🧮 Calculer et vérifier vos fonds propres avant de continuer."
                    );
                    return;
                  }
                  if (step === 5) {
                    setLoadingContinuer(true);
                    estimerValeurBienAvecOpenAI(formData, user, () => {
                      setLoadingContinuer(false);
                      nextStep();
                    }).finally(() => setLoadingContinuer(false));
                    return;
                  }
                  nextStep();
                }}
              >
                {loadingContinuer ? "Calcul en cours..." : "Continuer"}
              </Button>
            )}
          </Box>
        )}
      </Container>
    </Box>
  );
}

export default FormulaireDossier;