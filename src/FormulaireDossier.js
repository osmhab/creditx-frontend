import React, { useEffect, useState } from "react";
import { doc, getDoc, updateDoc, setDoc } from "firebase/firestore";
import { db } from "./firebase-config";
import { useAuth } from "./AuthContext";
import { useLocation } from "react-router-dom";


import { ArrowBack, ArrowForward } from "@mui/icons-material";
import { CircularProgress, Container, Box, Typography, Button } from "@mui/material";
import { Collapse } from "@mui/material";
import { Alert } from "@mui/material";
import { Backdrop } from "@mui/material";




import Etape0ChoixProduit from "./components/Etape0ChoixProduit";
import Etape1Personnes from "./components/Etape1Personnes";
import Etape1InformationsPersonnelles from "./components/Etape1InformationsPersonnelles";
import Etape2SituationFinanciere from "./components/Etape2SituationFinanciere";
import Etape3Produit from "./Etape3Produit";
import NouvelleEtape3Financement from "./components/NouvelleEtape3Financement";
import Etape5Documents from "./Etape5Documents";
import CustomStepper from "./components/CustomStepper";
import { estimerValeurBienAvecOpenAI } from "./utils/estimationAI";
import ModalFaisabilite from "./ModalFaisabiliteCredit";




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
  const [personneAvecPoursuitesIndex, setPersonneAvecPoursuitesIndex] = useState(null);
  const [ouvrirQuestionnaireDepuisAlerte, setOuvrirQuestionnaireDepuisAlerte] = useState(false);
  const [modalFaisabiliteOpen, setModalFaisabiliteOpen] = useState(false);


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
          personnes: [],
          dateCreation: new Date().toISOString(),
          userId: user.uid,
        };
      
        try {
          await updateDoc(ref, emptyDossier);
          const newSnap = await getDoc(ref);
          setFormData(newSnap.data());
        } catch {
          await setDoc(ref, emptyDossier);
          const snapAfterSet = await getDoc(ref);
          setFormData(snapAfterSet.data());
        }
      
        setStep(0);
      }
       else if (snap.exists()) {
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

  const reloadFormData = async () => {
    if (!user) return;
    const ref = doc(db, "dossiers", user.uid);
    const snap = await getDoc(ref);
    if (snap.exists()) {
      const data = snap.data();
      setFormData(data);
    }
  };

  const reloadResultatsFaisabilite = async () => {
  if (!user) return;
  const ref = doc(db, "dossiers", user.uid);
  const snap = await getDoc(ref);
  if (snap.exists()) {
    const data = snap.data();
    if (data?.resultatsFaisabilite) {
      setFormData((prev) => ({
        ...prev,
        resultatsFaisabilite: data.resultatsFaisabilite,
      }));
    }
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

  const etape2Valide = formData?.personnes?.every((personne) =>
    Array.isArray(personne.employeurs) &&
    personne.employeurs.length > 0 &&
    personne.questionnaireComplet === true
  );
  
  const poursuitesDeclarees = formData?.personnes?.some(
    (p) => p.aDesPoursuites === true
  );


  const corrigerPoursuites = () => {
    const index = formData?.personnes?.findIndex(
      (p) => p.aDesPoursuites === true
    );
    if (index !== -1) {
      setStep(2); // Aller à l’étape 2
  
      // ⏳ Attendre que la page ait le temps de se rendre (important)
      setTimeout(() => {
        const boutons = document.querySelectorAll('[data-bouton-questionnaire]');
        const bouton = boutons[index]; // ex: personne 0, personne 1, etc.
        if (bouton) bouton.click();
      }, 300);
    }
  };
  
  
const handleContinuerEtape4 = async () => {
  if (!user) return;
  setLoadingContinuer(true);

  const ref = doc(db, "dossiers", user.uid);
  const snap = await getDoc(ref);
  const data = snap.data();

  const estimationExistante = data?.resultatsFaisabilite;
  const modifServeur = data?.lastModificationAt;
  const horodatage = estimationExistante?.horodatage;

  const estimationValide = horodatage && modifServeur && horodatage === modifServeur;

  if (estimationValide) {
    setModalFaisabiliteOpen(true);
  } else {
    await estimerValeurBienAvecOpenAI(data, user, (updatedData) => {
      // 🛠️ Corrigé ici : on fusionne avec les données existantes
      setFormData((prev) => ({
        ...prev,
        ...updatedData,
      }));

      setModalFaisabiliteOpen(true);
    });
  }

  setLoadingContinuer(false);
};





  
  
  
  

  return (
    <Box sx={{ background: "#ffffff", minHeight: "100vh", py: 4 }}>

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
    refreshFormData={reloadFormData}
    ouvrirModalPourIndex={personneAvecPoursuitesIndex}
    ouvrirModalSiDemande={ouvrirQuestionnaireDepuisAlerte}
  />
)}



        {step === 3 && (
  <Etape3Produit
    selectedProduit={formData.produit}
    onSelectProduit={async (val) => {
      const newData = { ...formData, produit: val };
      setFormData(newData);
      if (user) {
        await updateDoc(doc(db, "dossiers", user.uid), {
          produit: val,
          etape: 4 // passer automatiquement à l'étape suivante
        });
      }
      setStep(4);
    }}
  />
)}


{step === 4 && (
  <NouvelleEtape3Financement
    formData={formData}
    setFormData={setFormData}
    docRef={docRef}
    onContinuer={nextStep} // ✅ à transmettre
    reloadFaisabilite={reloadResultatsFaisabilite}
  />
)}






        {step === 5 && (
  <Etape5Documents
    dossierId={user.uid}
    onReady={(val) => setDocumentsComplets(val)}
      />
    )}


        {step > 0 && step <= 6 && (
  <>
    {/* ✅ Message d'erreur en cas de poursuites - au-dessus du bloc de boutons */}
    {step === 2 && poursuitesDeclarees && (
      <Alert
  severity="error"
  sx={{ mb: 3 }}
  action={
    <Button
      color="inherit"
      size="small"
      onClick={corrigerPoursuites}
    >
      Corriger
    </Button>
  }
>
  Une ou plusieurs personnes ont déclaré avoir des poursuites en cours. <br />
  Le dossier ne peut pas être poursuivi sans un extrait de poursuites vierge.
</Alert>

)}


    <Box mt={4} display="flex" justifyContent="space-between" gap={2}>
      {/* 🔙 Bouton Retour */}
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

      {/* ✅ Étape 6 : bouton de soumission */}
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

      {/* ▶️ Bouton Continuer (étapes 2 à 5) */}
      {step < 6 && step !== 3 && (

<>
        <Button
          variant="contained"
          endIcon={
            loadingContinuer ? (
              <CircularProgress size={20} color="inherit" />
            ) : (
              <ArrowForward />
            )
          }
          sx={{
            minWidth: 150,
            height: 56,
            cursor:
              step === 3 && formData.poursuites === "oui"
                ? "not-allowed"
                : "pointer",
          }}
          disabled={
            (step === 2 && (!etape2Valide || poursuitesDeclarees)) ||
            loadingContinuer
          }
          onClick={() => {
            if (step === 4) {
              handleContinuerEtape4();
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

<Backdrop
  sx={{
    color: '#000',
    zIndex: (theme) => theme.zIndex.drawer + 1,
    backgroundColor: 'rgba(255, 255, 255, 0.85)',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
  }}
  open={loadingContinuer}
>
  <Box
    sx={{
      backgroundColor: '#fff',
      p: 4,
      borderRadius: 4,
      boxShadow: 3,
      textAlign: 'center',
      maxWidth: 300,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
    }}
  >
    <img
      src="/logo.png"
      alt="CreditX"
      style={{ height: 50, marginBottom: 16 }}
    />
    <CircularProgress size={28} color="secondary" sx={{ mb: 2 }} />
    <Typography variant="h6" gutterBottom>
      CreditX AI
    </Typography>
    <Typography variant="body2">
      Analyse de faisabilité en cours...
    </Typography>
  </Box>
</Backdrop>


</>

      )}
    </Box>
  </>
)}

<ModalFaisabilite
  open={modalFaisabiliteOpen}
  onClose={() => setModalFaisabiliteOpen(false)}
  formData={formData}
  user={user}
  onContinuer={() => {
    setModalFaisabiliteOpen(false);
    saveStep(5);
  }}
  reloadFaisabilite={reloadResultatsFaisabilite} // ✅ AJOUT
/>





      </Container>
    </Box>
  );
}

export default FormulaireDossier;