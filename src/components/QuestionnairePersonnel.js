// version safe de saveToFirestore avec fusion locale
import React, { useState, useEffect } from "react";

import {
  Dialog, DialogTitle, DialogContent, DialogActions, Button,
  Typography, FormControlLabel, Checkbox, TextField, Box, Fade, ToggleButtonGroup, ToggleButton, Chip, CircularProgress
} from "@mui/material";

import { Stepper, Step, StepLabel, StepContent } from "@mui/material";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";



import { doc, updateDoc, getDoc } from "firebase/firestore";
import { db } from "../firebase-config";

import ChampMontantSimple from "./ChampMontantSimple";







const QuestionnairePersonnel = ({ open, onClose, personIndex, employeurIndex, docRef, showErrors, setShowErrors, refreshFormData }) => {
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    aDesCredits: null,
    mensualiteCredits: "",
    aUnLeasing: null,
    mensualiteLeasing: "",
    payePension: null,
    montantPension: "",
    aDesEnfants: null,
    enfants: [],
    aDesRevenusLocatifs: null,
    montantRevenusLocatifs: "", 
    aDesPoursuites: null
  });
  

const [prenomPersonne1, setPrenomPersonne1] = useState("1ère personne");
const [prenomPersonne2, setPrenomPersonne2] = useState("2ᵉ personne");
const [hasDeuxiemePersonne, setHasDeuxiemePersonne] = useState(false);


  

  const progress = Math.min((step / 5) * 100, 100);






  useEffect(() => {
    const chargerDonneesExistantes = async () => {
      if (!open || personIndex === null) return; 
  
      try {
        const snap = await getDoc(docRef);
        const data = snap.data();
        const personnes = data.personnes || [];
        const personne = personnes[personIndex];
  
        if (personne) {
          let enfantsAssocies = [];

          if (personnes[0]?.prenom) {
            setPrenomPersonne1(personnes[0].prenom);
          }
          if (personnes.length > 1 && personnes[1]?.prenom) {
            setHasDeuxiemePersonne(true);
            setPrenomPersonne2(personnes[1].prenom);
          } else {
            setHasDeuxiemePersonne(false);
          }
          
          
  
          if (Array.isArray(personnes[0]?.enfants)) {
            enfantsAssocies = personnes[0].enfants.filter(
              (enfant) => enfant.parents?.includes(personIndex === 0 ? "1" : "2")
            );
          }
  
          if (Array.isArray(personnes[1]?.enfants)) {
            const enfantsPerso2 = personnes[1].enfants.filter(
              (enfant) => enfant.parents?.includes(personIndex === 0 ? "1" : "2")
            );
            enfantsAssocies = [...enfantsAssocies, ...enfantsPerso2];
          }
  
          // Supprimer les doublons éventuels
          enfantsAssocies = enfantsAssocies.filter(
            (enfant, index, self) =>
              index === self.findIndex((e) => 
                e.prenom === enfant.prenom && 
                e.dateNaissance === enfant.dateNaissance
              )
          );
  
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
            aDesEnfants: enfantsAssocies.length > 0,
            enfants: enfantsAssocies,
            aDesRevenusLocatifs: personne.aDesRevenusLocatifs ?? null,
            montantRevenusLocatifs: personne.montantRevenusLocatifs ?? "",
            aDesPoursuites: personne.aDesPoursuites ?? null
          }));
        }
      } catch (error) {
        console.error("Erreur lors du chargement des données:", error);
      }
    };
  
    chargerDonneesExistantes();
  }, [open, personIndex, docRef]);
  
  

  
  

  const steps = ["Crédits", "Leasing", "Pension alimentaire", "Enfants à charge", "Revenus locatifs", "Poursuites"];

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

  await updateDoc(docRef, {
    personnes: updatedPersonnes,
    lastModificationAt: new Date().toISOString(), // ✅ horodatage ici
  });

  setLoading(false);
};


  const handleNext = async () => {
    if (step === 0) {
      await saveToFirestore("aDesCredits", form.aDesCredits);
      if (form.aDesCredits) {
        await saveToFirestore("mensualiteCredits", Number(form.mensualiteCredits));

      } else {
        await saveToFirestore("mensualiteCredits", "");
      }
      
    }
    if (step === 1) {
      await saveToFirestore("aUnLeasing", form.aUnLeasing);
      if (form.aUnLeasing) {
        await saveToFirestore("mensualiteLeasing", Number(form.mensualiteLeasing));

      } else {
        await saveToFirestore("mensualiteLeasing", "");
      }
      
    }

    if (step === 2) {
      await saveToFirestore("payePension", form.payePension);
      if (form.payePension) {
        await saveToFirestore("montantPension", Number(form.montantPension));
      } else {
        await saveToFirestore("montantPension", "");
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
    
            await updateDoc(docRef, {
              personnes: updatedPersonnes,
              lastModificationAt: new Date().toISOString(),
            });

          }
        }
      }
    }

    if (step === 4) {
      await saveToFirestore("aDesRevenusLocatifs", form.aDesRevenusLocatifs);
      if (form.aDesRevenusLocatifs) {
        await saveToFirestore("montantRevenusLocatifs", Number(form.montantRevenusLocatifs));
      } else {
        await saveToFirestore("montantRevenusLocatifs", "");
      }
    }
    
    


    if (step === 5) {
      await saveToFirestore("aDesPoursuites", form.aDesPoursuites);
    }
    
    
    setStep(step + 1);
  };

  const handleClose = async () => {
    setStep(0);
    await refreshFormData();
    onClose();
  };
  
  
  

  const isStepCompleted = (stepNumber) => {
    switch (stepNumber) {
      case 0: // Crédits
        return form.aDesCredits !== null && (
          form.aDesCredits === false || form.mensualiteCredits > 0
        );
      case 1: // Leasing
        return form.aUnLeasing !== null && (
          form.aUnLeasing === false || form.mensualiteLeasing > 0
        );
      case 2: // Pension alimentaire
        return form.payePension !== null && (
          form.payePension === false || form.montantPension > 0
        );
      case 3: // Enfants
        return form.aDesEnfants !== null && (
          form.aDesEnfants === false || (
            form.enfants.length > 0 &&
            form.enfants.every(
              (e) => e.prenom.trim() !== "" && e.dateNaissance.trim() !== ""
            )
          )
        );
      case 4: // Revenus locatifs
        return form.aDesRevenusLocatifs !== null && (
          form.aDesRevenusLocatifs === false || form.montantRevenusLocatifs > 0
        );
      case 5: // Poursuites
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
        return "Avez-vous des revenus locatifs ?";
      case 5:
        return "Avez-vous des poursuites en cours ?";
        
    }
  };




  const getAnswerForStep = (index) => {
    switch (index) {
      case 0:
        return form.aDesCredits === null ? "Non renseigné" :
          form.aDesCredits ? `Oui, mensualité : ${form.mensualiteCredits || "non précisée"} CHF` : "Non";
      case 1:
        return form.aUnLeasing === null ? "Non renseigné" :
          form.aUnLeasing ? `Oui, mensualité : ${form.mensualiteLeasing || "non précisée"} CHF` : "Non";
      case 2:
        return form.payePension === null ? "Non renseigné" :
          form.payePension ? `Oui, montant : ${form.montantPension || "non précisé"} CHF` : "Non";
      case 3:
        return form.aDesEnfants === null ? "Non renseigné" :
          form.aDesEnfants ? `${form.enfants.length} enfant(s)` : "Non";
      case 4:
        return form.aDesRevenusLocatifs === null ? "Non renseigné" :
          form.aDesRevenusLocatifs
            ? `Oui, ${form.montantRevenusLocatifs || "non précisé"} CHF/mois`
            : "Non";
      case 5:
        return form.aDesPoursuites === null ? "Non renseigné" :
          form.aDesPoursuites ? "Oui" : "Non";
          
    }
  };



  const retirerEnfantsSiParentDecline = async (docRef, personIndex) => {
    if (!docRef || personIndex === null) return;
  
    const snap = await getDoc(docRef);
    const data = snap.data();
    const personnes = data.personnes || [];
    const updatedPersonnes = [...personnes];
  
    const autreIndex = personIndex === 0 ? 1 : 0;
    const parentTag = personIndex === 0 ? "1" : "2";
  
    // 🔥 1. Vider totalement la liste d'enfants de la personne qui refuse
    updatedPersonnes[personIndex] = {
      ...updatedPersonnes[personIndex],
      enfants: [],
      aDesEnfants: false,
    };
  
    // 🔥 2. Supprimer tous les enfants liés à ce parent chez l'autre personne
    if (updatedPersonnes[autreIndex]?.enfants) {
      updatedPersonnes[autreIndex].enfants = updatedPersonnes[autreIndex].enfants
        .filter((enfant) => !enfant.parents?.includes(parentTag));
    }
  
    // 🔥 3. Supprimer tous les enfants liés à ce parent dans la base commune (personnes[0])
    if (updatedPersonnes[0]?.enfants) {
      updatedPersonnes[0].enfants = updatedPersonnes[0].enfants
        .filter((enfant) => !enfant.parents?.includes(parentTag));
    }
  
    // 🔥 4. Sauvegarder
    await updateDoc(docRef, {
      personnes: updatedPersonnes,
      lastModificationAt: new Date().toISOString(),
    });

  };

  
  const [confirmRemove, setConfirmRemove] = useState({
    open: false,
    enfantIndex: null,
  });
  
  
  
  
  
  
  
  
  
  
  

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
  color:
    step === index
      ? "#000" // question active = noir
      : "#888888", // inactives = gris clair
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
  onChange={async (e, val) => {
    if (val !== null) {
      setForm((prev) => ({
        ...prev,
        aDesCredits: val,
        mensualiteCredits: val ? prev.mensualiteCredits : "",
      }));

      await saveToFirestore("aDesCredits", val);

      if (val === false) {
        // 🔥 Efface directement la mensualité dans Firestore
        await saveToFirestore("mensualiteCredits", "");
      }
    }
  }}
  fullWidth
  sx={{ mb: 2 }}
>

      <ToggleButton value={true}>Oui</ToggleButton>
      <ToggleButton value={false}>Non</ToggleButton>
    </ToggleButtonGroup>

    {form.aDesCredits && (
      <>
  
      <ChampMontantSimple
        label="Montant de la mensualité du crédit (CHF)"
        value={form.mensualiteCredits}
        onChange={(val) => setForm({ ...form, mensualiteCredits: val })}
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
  onChange={async (e, val) => {
    if (val !== null) {
      setForm((prev) => ({
        ...prev,
        aUnLeasing: val,
        mensualiteLeasing: val ? prev.mensualiteLeasing : "",
      }));

      await saveToFirestore("aUnLeasing", val);

      if (val === false) {
        // 🔥 Efface directement la mensualité dans Firestore
        await saveToFirestore("mensualiteLeasing", "");
      }
    }
  }}
  fullWidth
  sx={{ mb: 2 }}
>

      <ToggleButton value={true}>Oui</ToggleButton>
      <ToggleButton value={false}>Non</ToggleButton>
    </ToggleButtonGroup>

    {form.aUnLeasing && (
      <>
      <ChampMontantSimple
        label="Montant total des mensualités de leasing (CHF)"
        value={form.mensualiteLeasing}
        onChange={(val) => setForm({ ...form, mensualiteLeasing: val })}
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
  onChange={async (e, val) => {
    if (val !== null) {
      setForm((prev) => ({
        ...prev,
        payePension: val,
        montantPension: val ? prev.montantPension : "",
      }));

      await saveToFirestore("payePension", val);

      if (val === false) {
        // 🔥 Efface directement le montant de pension dans Firestore
        await saveToFirestore("montantPension", "");
      }
    }
  }}
  fullWidth
  sx={{ mb: 2 }}
>

      <ToggleButton value={true}>Oui</ToggleButton>
      <ToggleButton value={false}>Non</ToggleButton>
    </ToggleButtonGroup>

    {form.payePension && (
      <ChampMontantSimple
        label="Montant de la pension alimentaire par mois (CHF)"
        value={form.montantPension}
        onChange={(val) => setForm({ ...form, montantPension: val })}
      />

    )}
  </>
)}

{index === 3 && (
  <>
    {loading && (
      <Box display="flex" justifyContent="center" mt={2}>
        <CircularProgress />
      </Box>
    )}

    <ToggleButtonGroup
      value={form.aDesEnfants}
      exclusive
      onChange={async (e, val) => {
  if (val !== null) {
    setLoading(true);

    if (val === false) {
      setForm((prev) => ({
        ...prev,
        aDesEnfants: false,
        enfants: [],
      }));

      await retirerEnfantsSiParentDecline(docRef, personIndex);
      await refreshFormData();
    } else {
      const nouvelEnfant = { prenom: "", dateNaissance: "", parents: hasDeuxiemePersonne ? ["1", "2"] : ["1"] };


      setForm((prev) => ({
        ...prev,
        aDesEnfants: true,
        enfants: prev.enfants.length > 0 ? prev.enfants : [nouvelEnfant],
      }));

      await saveToFirestore("aDesEnfants", true);
      await saveToFirestore("enfants", form.enfants.length > 0 ? form.enfants : [nouvelEnfant]);
      await refreshFormData();
    }

    setLoading(false);
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
      <Box key={idx} mb={2} display="flex" gap={2}>
        <Box flexGrow={1}>
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

          {hasDeuxiemePersonne && (
            <>
              <Typography sx={{ mt: 1, mb: 1 }}>À la charge de :</Typography>
              <ToggleButtonGroup
                value={enfant.parents || []}
                onChange={async (e, newParents) => {
                  const newEnfants = [...form.enfants];
                  newEnfants[idx].parents = newParents;
                  setForm({ ...form, enfants: newEnfants });

                  const snap = await getDoc(docRef);
                  const data = snap.data();
                  const personnes = data.personnes || [];

                  const updatedPersonnes = [...personnes];
                  if (!updatedPersonnes[0].enfants) updatedPersonnes[0].enfants = [];
                  if (!updatedPersonnes[1].enfants) updatedPersonnes[1].enfants = [];

                  updatedPersonnes[0].enfants = updatedPersonnes[0].enfants.map((e) =>
                    e.prenom === enfant.prenom && e.dateNaissance === enfant.dateNaissance
                      ? { ...e, parents: newParents }
                      : e
                  );
                  updatedPersonnes[1].enfants = updatedPersonnes[1].enfants.map((e) =>
                    e.prenom === enfant.prenom && e.dateNaissance === enfant.dateNaissance
                      ? { ...e, parents: newParents }
                      : e
                  );

                  await updateDoc(docRef, {
                    personnes: updatedPersonnes,
                    lastModificationAt: new Date().toISOString(),
                  });

                }}
                size="small"
                fullWidth
              >
                <ToggleButton value="1">{prenomPersonne1}</ToggleButton>
                <ToggleButton value="2">{prenomPersonne2}</ToggleButton>
              </ToggleButtonGroup>
            </>
          )}
        </Box>

        <Box display="flex" alignItems="center" mt={4}>
          <Button
            color="inherit"
            onClick={() => {
              const newEnfants = [...form.enfants];
              newEnfants.splice(idx, 1);
              setForm({ ...form, enfants: newEnfants });
            }}
          >
            <DeleteOutlineIcon />
          </Button>
        </Box>
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
            {
              prenom: "",
              dateNaissance: "",
              parents: hasDeuxiemePersonne ? ["1", "2"] : ["1"]
            }
          ]
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
      value={form.aDesRevenusLocatifs}
      exclusive
      onChange={async (e, val) => {
        if (val !== null) {
          setForm((prev) => ({
            ...prev,
            aDesRevenusLocatifs: val,
            montantRevenusLocatifs: val ? prev.montantRevenusLocatifs : "",
          }));

          await saveToFirestore("aDesRevenusLocatifs", val);

          if (!val) {
            await saveToFirestore("montantRevenusLocatifs", "");
          }
        }
      }}
      fullWidth
      sx={{ mb: 2 }}
    >
      <ToggleButton value={true}>Oui</ToggleButton>
      <ToggleButton value={false}>Non</ToggleButton>
    </ToggleButtonGroup>

    {form.aDesRevenusLocatifs && (
      <ChampMontantSimple
        label="Montant mensuel des revenus locatifs (CHF)"
        value={form.montantRevenusLocatifs}
        onChange={(val) =>
          setForm((prev) => ({
            ...prev,
            montantRevenusLocatifs: val,
          }))
        }
      />

    )}
  </>
)}










{index === 5 && (
  <>
  <ToggleButtonGroup
  value={form.aDesPoursuites}
  exclusive
  onChange={async (e, val) => {
    if (val !== null) {
      setForm((prev) => ({ ...prev, aDesPoursuites: val }));
      await saveToFirestore("aDesPoursuites", val);
    }
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
    if (index === 5) {
      const allStepsCompleted = [0, 1, 2, 3, 4, 5].every((step) => isStepCompleted(step));
      if (allStepsCompleted) {
        setShowErrors(false);

        const snap = await getDoc(docRef);
        const data = snap.data();
        const personnes = data.personnes || [];
        const updatedPersonnes = [...personnes];

        // ✅ Mise à jour sur la personne elle-même
        updatedPersonnes[personIndex] = {
          ...updatedPersonnes[personIndex],
          questionnaireComplet: true,
        };

        await updateDoc(docRef, {
          personnes: updatedPersonnes,
          lastModificationAt: new Date().toISOString(),
        });

        await refreshFormData();
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
  {index === 5 ? "Terminer" : "Confirmer et continuer"}
</Button>



</Box>



        </Box>
        </Fade>
      </StepContent>
    </Step>
  ))}
</Stepper>





      </Box>



      <Dialog
  open={confirmRemove.open}
  onClose={() => setConfirmRemove({ open: false, enfantIndex: null })}
>
  <DialogTitle>Retirer ce parent ?</DialogTitle>
  <DialogContent>
    Êtes-vous sûr de vouloir retirer ce parent de l'enfant ?
  </DialogContent>
  <DialogActions>
    <Button onClick={() => setConfirmRemove({ open: false, enfantIndex: null })}>
      Annuler
    </Button>
    <Button
      color="error"
      onClick={() => {
        const idx = confirmRemove.enfantIndex;
        const newEnfants = [...form.enfants];
        const parentTag = personIndex === 1 ? "2" : "1";
        newEnfants[idx].parents = newEnfants[idx].parents?.filter((p) => p !== parentTag);
        setForm({ ...form, enfants: newEnfants });
        setConfirmRemove({ open: false, enfantIndex: null });
      }}
    >
      Confirmer
    </Button>
  </DialogActions>
</Dialog>




  

  
    </Dialog>
  );
  
};

export default QuestionnairePersonnel;
