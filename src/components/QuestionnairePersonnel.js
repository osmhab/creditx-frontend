// version safe de saveToFirestore avec fusion locale
import React, { useState, useEffect } from "react";

import {
  Dialog, DialogTitle, DialogContent, DialogActions, Button,
  Typography, FormControlLabel, Checkbox, TextField, Box, Fade, ToggleButtonGroup, ToggleButton, Chip
} from "@mui/material";

import { Stepper, Step, StepLabel, StepContent } from "@mui/material";



import { doc, updateDoc, getDoc } from "firebase/firestore";
import { db } from "../firebase-config";

const QuestionnairePersonnel = ({ open, onClose, personIndex, docRef }) => {
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    aDesCredits: null,
    montantCredits: "",
    aUnLeasing: null,
    montantLeasing: "",
    mensualiteLeasing: "",
    payePension: null,
    montantPension: "",
    aDesEnfants: null,
    enfants: [],
    aDesPoursuites: null
  });
  

  const progress = Math.min((step / 5) * 100, 100);


  const [showErrors, setShowErrors] = useState(false);



  useEffect(() => {
    const chargerDonneesExistantes = async () => {
      if (!open || personIndex === null) return; // Pas besoin de charger si fermé ou personne inconnue
  
      try {
        const snap = await getDoc(docRef);
        const data = snap.data();
        const personnes = data.personnes || [];
        const personne = personnes[personIndex];
  
        if (personne) {
          setForm((prevForm) => ({
            ...prevForm,
            aDesCredits: personne.aDesCredits ?? null,
            montantCredits: personne.montantCredits ?? "",
            mensualiteCredits: personne.mensualiteCredits ?? "",
            aUnLeasing: personne.aUnLeasing ?? null,
            montantLeasing: personne.montantLeasing ?? "",
            mensualiteLeasing: personne.mensualiteLeasing ?? "",
            payePension: personne.payePension ?? null,
            montantPension: personne.montantPension ?? "",
            aDesEnfants: personne.aDesEnfants ?? null,
            enfants: personne.enfants ?? [],
            aDesPoursuites: personne.aDesPoursuites ?? null
          }));
        }
      } catch (error) {
        console.error("Erreur lors du chargement des données:", error);
      }
    };
  
    chargerDonneesExistantes();
  }, [open, personIndex, docRef]);
  
  


  useEffect(() => {
    const loadEnfantsCommun = async () => {
      if (!open || personIndex === null) return;
  
      const snap = await getDoc(docRef);
      const data = snap.data();
      const personnes = data.personnes || [];
  
      if (Array.isArray(personnes[0]?.enfants) && personnes[0].enfants.length > 0 && personIndex === 1) {
        const enfantsPourPersonne2 = personnes[0].enfants.filter((enfant) => 
          enfant.parents?.includes("2") &&
          typeof enfant.prenom === "string" &&
          typeof enfant.dateNaissance === "string" &&
          Array.isArray(enfant.parents)
        );
  
        if (enfantsPourPersonne2.length > 0) {
          setForm((prevForm) => ({
            ...prevForm,
            aDesEnfants: true,
            enfants: enfantsPourPersonne2
          }));
        }
      }
    };
  
    loadEnfantsCommun();
  }, [open, personIndex, docRef]);
  
  

  const steps = ["Crédits", "Leasing", "Pension alimentaire", "Enfants à charge", "Poursuites"];

  const saveToFirestore = async (field, value) => {
    if (!docRef || personIndex === null) return;
    setLoading(true);

    const snap = await getDoc(docRef);
    const data = snap.data();
    const personnes = data.personnes || [];
    const personne = personnes[personIndex] || {};

    const updatedPersonne = { ...personne, [field]: value };
    const updatedPersonnes = [...personnes];
    updatedPersonnes[personIndex] = updatedPersonne;

    await updateDoc(docRef, { personnes: updatedPersonnes });
    setLoading(false);
  };

  const handleNext = async () => {
    if (step === 0) {
      await saveToFirestore("aDesCredits", form.aDesCredits);
      if (form.aDesCredits) {
        await saveToFirestore("montantCredits", form.montantCredits);
        await saveToFirestore("mensualiteCredits", form.mensualiteCredits);
      }
    }
    if (step === 1) {
      await saveToFirestore("aUnLeasing", form.aUnLeasing);
      if (form.aUnLeasing) {
        await saveToFirestore("montantLeasing", form.montantLeasing);
        await saveToFirestore("mensualiteLeasing", form.mensualiteLeasing);
      }
    }

    if (step === 2) {
      await saveToFirestore("payePension", form.payePension);
      if (form.payePension) {
        await saveToFirestore("montantPension", form.montantPension);
      }
    }

    if (step === 3) {
      await saveToFirestore("aDesEnfants", form.aDesEnfants);
    
      if (form.aDesEnfants) {
        const enfantsValides = form.enfants.filter(
          (enfant) =>
            enfant.prenom?.trim() !== "" &&
            enfant.dateNaissance?.trim() !== "" &&
            Array.isArray(enfant.parents)
        );
    
        if (enfantsValides.length > 0) {
          await saveToFirestore("enfants", enfantsValides);
    
          const snap = await getDoc(docRef);
          const data = snap.data();
          const personnes = data.personnes || [];
    
          if (personnes.length >= 2) {
            const enfantsPourPersonne1 = personnes[0]?.enfants || [];
            const enfantsPourPersonne2 = personnes[1]?.enfants || [];
    
            // 🔵 Synchroniser dans personnes[0] pour les enfants ayant ["1", "2"]
            const enfantsASynchroniserPourPersonne1 = enfantsValides.filter(
              (enfant) => enfant.parents.includes("1")
            );
    
            const nouveauxEnfantsPourPersonne1 = [...enfantsPourPersonne1];
            enfantsASynchroniserPourPersonne1.forEach((enfant) => {
              const existeDeja = enfantsPourPersonne1.some(
                (existant) =>
                  existant.prenom === enfant.prenom &&
                  existant.dateNaissance === enfant.dateNaissance
              );
              if (!existeDeja) {
                nouveauxEnfantsPourPersonne1.push(enfant);
              }
            });
    
            // 🔵 Synchroniser dans personnes[1] pour les enfants ayant ["2"]
            const enfantsASynchroniserPourPersonne2 = enfantsValides.filter(
              (enfant) => enfant.parents.includes("2")
            );
    
            const nouveauxEnfantsPourPersonne2 = [...enfantsPourPersonne2];
            enfantsASynchroniserPourPersonne2.forEach((enfant) => {
              const existeDeja = enfantsPourPersonne2.some(
                (existant) =>
                  existant.prenom === enfant.prenom &&
                  existant.dateNaissance === enfant.dateNaissance
              );
              if (!existeDeja) {
                nouveauxEnfantsPourPersonne2.push(enfant);
              }
            });
    
            // 🔥 Mettre à jour Firestore si changements
            const updatedPersonnes = [...personnes];
            updatedPersonnes[0] = { ...updatedPersonnes[0], enfants: nouveauxEnfantsPourPersonne1 };
            updatedPersonnes[1] = { ...updatedPersonnes[1], enfants: nouveauxEnfantsPourPersonne2 };
    
            await updateDoc(docRef, { personnes: updatedPersonnes });
          }
        }
      }
    }
    


    if (step === 4) {
      await saveToFirestore("aDesPoursuites", form.aDesPoursuites);
    }
    
    
    setStep(step + 1);
  };

  const handleClose = () => {
    setStep(0);    // Je reviens simplement à l'étape 0
    onClose();     // Je ferme le modal sans toucher aux réponses
  };
  

  const isStepCompleted = (stepNumber) => {
    switch (stepNumber) {
      case 0: // Crédits
        return form.aDesCredits !== null && (form.aDesCredits === false || (form.montantCredits.trim() !== "" && form.mensualiteCredits.trim() !== ""));
      case 1: // Leasing
        return form.aUnLeasing !== null && (form.aUnLeasing === false || (form.montantLeasing.trim() !== "" && form.mensualiteLeasing.trim() !== ""));
      case 2: // Pension alimentaire
        return form.payePension !== null && (form.payePension === false || form.montantPension.trim() !== "");
      case 3: // Enfants
        return form.aDesEnfants !== null && (form.aDesEnfants === false || (form.enfants.length > 0 && form.enfants.every((e) => e.prenom.trim() !== "" && e.dateNaissance.trim() !== "")));
      case 4: // Poursuites
        return form.aDesPoursuites !== null;
      default:
        return false;
    }
  };
  

  const getQuestionForStep = (index) => {
    switch (index) {
      case 0:
        return "Avez-vous un ou plusieurs crédits en cours ?";
      case 1:
        return "Avez-vous un leasing en cours ?";
      case 2:
        return "Payez-vous une pension alimentaire ?";
      case 3:
        return "Avez-vous des enfants à charge ?";
      case 4:
        return "Avez-vous des poursuites en cours ?";
      default:
        return "";
    }
  };




  const getAnswerForStep = (index) => {
    switch (index) {
      case 0:
        return form.aDesCredits === null ? "Non renseigné" :
          form.aDesCredits ? `Oui, montant restant : ${form.montantCredits || "non précisé"} CHF` : "Non";
      case 1:
        return form.aUnLeasing === null ? "Non renseigné" :
          form.aUnLeasing ? `Oui, montant : ${form.montantLeasing || "non précisé"} CHF / mensualité : ${form.mensualiteLeasing || "non précisée"} CHF` : "Non";
      case 2:
        return form.payePension === null ? "Non renseigné" :
          form.payePension ? `Oui, montant : ${form.montantPension || "non précisé"} CHF` : "Non";
      case 3:
        return form.aDesEnfants === null ? "Non renseigné" :
          form.aDesEnfants ? `${form.enfants.length} enfant(s)` : "Non";
      case 4:
        return form.aDesPoursuites === null ? "Non renseigné" :
          form.aDesPoursuites ? "Oui" : "Non";
      default:
        return "";
    }
  };
  
  
  
  
  
  

  return (


    <Dialog
  open={open}
  onClose={handleClose}
  fullWidth
  maxWidth={false}
  sx={{
    "& .MuiPaper-root": {
      width: "950px",
      p: 4,
      borderRadius: 3
    }
  }}
>


      <DialogTitle>
        Questionnaire personnel - {steps[step]}
      </DialogTitle>

      <Box 
      sx={{
      backgroundColor: "#fafafa",
      borderRadius: 2,
      p: 3,
      mt: 2
    }}
        >
        

      <Stepper activeStep={step} orientation="vertical" sx={{ my: 2 }}>
  {steps.map((stepData, index) => (
    <Step key={index} completed={isStepCompleted(index)}>
    <StepLabel
  onClick={() => setStep(index)}
  sx={{
    cursor: "pointer",
    "& .MuiStepLabel-label": {
      transition: "color 0.3s ease",
      color: showErrors && !isStepCompleted(index) ? "red" : "#000",
    },
    "& .MuiStepLabel-label:hover": {
      color: "#001BFF",
    },
    "& .MuiStepLabel-label.Mui-active": {
      color: "#001BFF",
    },
    "& .MuiStepIcon-root": {
      color: showErrors && !isStepCompleted(index) ? "red" : "#c4c4c4",
    },
    "& .MuiStepIcon-root.Mui-active": {
      color: showErrors && !isStepCompleted(index) ? "red" : "#1976d2",
    },
    "& .MuiStepIcon-root.Mui-completed": {
      color: "#4CAF50",
    },
  }}
>
  {getQuestionForStep(index)}
</StepLabel>


      {/* 🎯 Voici ce qui change : on ajoute un StepContent ! */}
      <StepContent>
      <Fade in={true} timeout={500}>
        <Box mt={2}>




        {index === 0 && (
  <>
    <ToggleButtonGroup
      value={form.aDesCredits}
      exclusive
      onChange={(e, val) => {
        if (val !== null) setForm({ ...form, aDesCredits: val });
      }}
      fullWidth
      sx={{ mb: 2 }}
    >
      <ToggleButton value={true}>Oui</ToggleButton>
      <ToggleButton value={false}>Non</ToggleButton>
    </ToggleButtonGroup>

    {form.aDesCredits && (
      <>
        <TextField
          label="Montant total restant à rembourser (CHF)"
          type="number"
          fullWidth
          margin="normal"
          value={form.montantCredits}
          onChange={(e) => setForm({ ...form, montantCredits: e.target.value })}
        />
        <TextField
          label="Montant de la mensualité du crédit (CHF)"
          type="number"
          fullWidth
          margin="normal"
          value={form.mensualiteCredits || ""}
          onChange={(e) => setForm({ ...form, mensualiteCredits: e.target.value })}
          sx={{ mt: 2 }}
        />
      </>
    )}
  </>
)}


          

          {index === 1 && (
  <>
    <ToggleButtonGroup
      value={form.aUnLeasing}
      exclusive
      onChange={(e, val) => {
        if (val !== null) setForm({ ...form, aUnLeasing: val });
      }}
      fullWidth
      sx={{ mb: 2 }}
    >
      <ToggleButton value={true}>Oui</ToggleButton>
      <ToggleButton value={false}>Non</ToggleButton>
    </ToggleButtonGroup>

    {form.aUnLeasing && (
      <>
        <TextField
          label="Montant du leasing restant (CHF)"
          type="number"
          fullWidth
          margin="normal"
          value={form.montantLeasing}
          onChange={(e) => setForm({ ...form, montantLeasing: e.target.value })}
        />
        <TextField
          label="Montant de la mensualité (CHF)"
          type="number"
          fullWidth
          margin="normal"
          value={form.mensualiteLeasing}
          onChange={(e) => setForm({ ...form, mensualiteLeasing: e.target.value })}
          sx={{ mt: 2 }}
        />
      </>
    )}
  </>
)}




{index === 2 && (
  <>
    <ToggleButtonGroup
      value={form.payePension}
      exclusive
      onChange={(e, val) => {
        if (val !== null) setForm({ ...form, payePension: val });
      }}
      fullWidth
      sx={{ mb: 2 }}
    >
      <ToggleButton value={true}>Oui</ToggleButton>
      <ToggleButton value={false}>Non</ToggleButton>
    </ToggleButtonGroup>

    {form.payePension && (
      <TextField
        label="Montant de la pension alimentaire par mois (CHF)"
        type="number"
        fullWidth
        margin="normal"
        value={form.montantPension}
        onChange={(e) => setForm({ ...form, montantPension: e.target.value })}
      />
    )}
  </>
)}


{index === 3 && (
  <>
    <ToggleButtonGroup
      value={form.aDesEnfants}
      exclusive
      onChange={(e, val) => {
        if (val !== null) {
          setForm((prev) => ({
            ...prev,
            aDesEnfants: val,
            enfants: val ? prev.enfants : [],
          }));
        }
      }}
      fullWidth
      sx={{ mb: 2 }}
    >
      <ToggleButton value={true}>Oui</ToggleButton>
      <ToggleButton value={false}>Non</ToggleButton>
    </ToggleButtonGroup>

    {form.aDesEnfants && (
      <>
        {form.enfants.map((enfant, idx) => (
          <Box key={idx} mb={2}>
            <TextField
              label={`Prénom de l'enfant ${idx + 1}`}
              fullWidth
              margin="normal"
              value={enfant.prenom}
              onChange={(e) => {
                const newEnfants = [...form.enfants];
                newEnfants[idx].prenom = e.target.value;
                setForm({ ...form, enfants: newEnfants });
              }}
            />
            <TextField
              label={`Date de naissance de l'enfant ${idx + 1}`}
              type="date"
              fullWidth
              margin="normal"
              value={enfant.dateNaissance}
              onChange={(e) => {
                const newEnfants = [...form.enfants];
                newEnfants[idx].dateNaissance = e.target.value;
                setForm({ ...form, enfants: newEnfants });
              }}
              InputLabelProps={{ shrink: true }}
            />

            {/* 🔵 Checkbox : est-ce aussi l'enfant de la personne 2 ? */}
            <FormControlLabel
              control={
                <Checkbox
                  checked={enfant.parents?.includes("2") || false}
                  onChange={(e) => {
                    const newEnfants = [...form.enfants];
                    if (e.target.checked) {
                      newEnfants[idx].parents = newEnfants[idx].parents
                        ? Array.from(new Set([...newEnfants[idx].parents, "1", "2"]))
                        : ["1", "2"];
                    } else {
                      newEnfants[idx].parents = ["1"];
                    }
                    setForm({ ...form, enfants: newEnfants });
                  }}
                />
              }
              label="Cet enfant est aussi celui de la 2ᵉ personne ?"
              sx={{ mt: 1 }}
            />
          </Box>
        ))}

        <Button
          variant="outlined"
          sx={{ mt: 2 }}
          onClick={() =>
            setForm((prev) => ({
              ...prev,
              enfants: [
                ...prev.enfants,
                { prenom: "", dateNaissance: "", parents: personIndex === 1 ? ["2"] : ["1"] },
              ],
            }))
          }
        >
          Ajouter un enfant
        </Button>
      </>
    )}
  </>
)}




{index === 4 && (
  <>
    <ToggleButtonGroup
      value={form.aDesPoursuites}
      exclusive
      onChange={(e, val) => {
        if (val !== null) setForm({ ...form, aDesPoursuites: val });
      }}
      fullWidth
      sx={{ mb: 2 }}
    >
      <ToggleButton value={true}>Oui</ToggleButton>
      <ToggleButton value={false}>Non</ToggleButton>
    </ToggleButtonGroup>
  </>
)}


          
<Box display="flex" justifyContent="flex-end" mt={2}>
  <Button
  variant="contained"
  onClick={async () => {
    if (index === 4) {
      // 🔥 Vérifier toutes les étapes
      const allStepsCompleted = [0, 1, 2, 3, 4].every((step) => isStepCompleted(step));
      if (allStepsCompleted) {
        setShowErrors(false);
        onClose();
      } else {
        setShowErrors(true);
      }
    } else {
      await handleNext();
      setShowErrors(false);
    }
  }}
  sx={{ mt: 2 }}
>
  {index === 4 ? "Terminer" : "Confirmer et continuer"}
</Button>

</Box>



        </Box>
        </Fade>
      </StepContent>
    </Step>
  ))}
</Stepper>





      </Box>
  

  
    </Dialog>
  );
  
};

export default QuestionnairePersonnel;
