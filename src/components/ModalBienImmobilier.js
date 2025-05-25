import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  MenuItem,
  FormControlLabel,
  Switch,
  Stepper,
  Step,
  StepLabel,
  Box,
  Grid,
  Typography,
  Autocomplete
} from "@mui/material";

import ChampMontantSimple from "./ChampMontantSimple";

import { db } from "../firebase-config";
import { doc, updateDoc } from "firebase/firestore";
import localitesSuisse from "./localitesSuisse";

const ModalBienImmobilier = ({ open, onClose, onSave, initialData, user }) => {
  const [activeStep, setActiveStep] = useState(0);
  const steps = [
    "Adresse et identification",
    "Surfaces et pièces",
    "Construction et état",
    "Confort et équipements",
  ];

  const [data, setData] = useState({
    adresseComplete: "",
    npaLocalite: "",
    latitude: null,
    longitude: null,
    type: "",
    valeur: "",
    surfaceHabitable: "",
    surfaceTerrain: "",
    nbPieces: "",
    nbSallesEau: "",
    surfaceBalcon: "",
    surfaceCave: "",
    anneeConstruction: "",
    anneeRenovation: "",
    typeConstruction: "",
    etat: "",
    ascenseur: false,
    chauffageType: "",
    chauffageDistribution: "",
    vueDegagee: false,
    placesInt: "",
    placesExt: "",
  });

  const handleBlur = (field) => {
    setTouchedFields((prev) => ({ ...prev, [field]: true }));
  };
  

  const [touchedFields, setTouchedFields] = useState({});


  const getMissingFields = () => {
    const missing = [];
  
    if (activeStep === 0) {
      if (!data.adresseComplete) missing.push("Adresse complète");
      if (!data.npaLocalite) missing.push("NPA / Localité");
      if (!data.type) missing.push("Type de bien");
      if (!data.valeur) missing.push("Montant estimé");
    }
  
    if (activeStep === 1) {
      if (!data.surfaceHabitable) missing.push("Surface habitable");
      if (!data.nbPieces) missing.push("Nombre de pièces");
    }
  
    if (activeStep === 2) {
      if (!data.anneeConstruction) missing.push("Année de construction");
      if (!data.typeConstruction) missing.push("Type de construction");
      if (!data.etat) missing.push("État du bien");
    }
  
    return missing;
  };
  

  useEffect(() => {
    if (initialData) {
      setData((prev) => ({ ...prev, ...initialData }));
    }
  }, [initialData]);

  const types = ["Appartement PPE", "Maison individuelle", "Villa mitoyenne", "Duplex", "Attique", "Chalet"];
  const etats = ["Bon", "Moyen", "Médiocre"];
  const chauffageTypes = ["Pompe à chaleur", "Mazout", "Gaz", "Chauffage à distance", "Électrique"];
  const chauffageDistributions = ["Sol", "Radiateurs", "Mixte"];

  const isLastStep = activeStep === steps.length - 1;

  const isStepValid = () => {
    if (activeStep === 0) {
      return (
        data.adresseComplete &&
        data.npaLocalite &&
        data.type &&
        data.valeur
      );
    }
  
    if (activeStep === 1) {
      return (
        data.surfaceHabitable &&
        data.nbPieces
      );
    }
  
    if (activeStep === 2) {
      return (
        data.anneeConstruction &&
        data.typeConstruction &&
        data.etat
      );
    }
  
    // Étape 3 : pas bloquante
    return true;
  };
  

  const saveStepToFirestore = async () => {
    if (!user) return;

    const cleaned = {
      ...data,
      surfaceHabitable: Number(data.surfaceHabitable),
      surfaceTerrain: Number(data.surfaceTerrain || 0),
      nbPieces: Number(data.nbPieces),
      nbSallesEau: Number(data.nbSallesEau || 0),
      surfaceBalcon: Number(data.surfaceBalcon || 0),
      surfaceCave: Number(data.surfaceCave || 0),
      anneeConstruction: Number(data.anneeConstruction),
      anneeRenovation: data.anneeRenovation ? Number(data.anneeRenovation) : null,
      typeConstruction: data.typeConstruction || null,
      placesInt: Number(data.placesInt || 0),
      placesExt: Number(data.placesExt || 0),
      valeur: Number(data.valeur),
      userId: user.uid,
      dateModification: new Date(),
    };

    try {
      const ref = doc(db, "dossiers", user.uid);
      await updateDoc(ref, { immobilier: cleaned });
      console.log("✅ Champ 'immobilier' mis à jour dans le dossier du user");
    } catch (err) {
      console.error("❌ Erreur Firestore:", err);
    }
  };

  const handleNext = async () => {
    if (isStepValid()) {
      await saveStepToFirestore();
      setActiveStep((prev) => prev + 1);
    }
  };

  const handleBack = () => setActiveStep((prev) => prev - 1);

  const handleSave = async () => {
    await saveStepToFirestore();
    onSave(data);
    onClose();
  };

  const renderStepContent = (step) => {
    switch (step) {
        case 0:
            return (
              <>
                <TextField
                  fullWidth
                  label="Adresse complète"
                  placeholder="Rue, numéro"
                  value={data.adresseComplete}
                  onChange={(e) => setData({ ...data, adresseComplete: e.target.value })}
                  onBlur={() => handleBlur("adresseComplete")}
                  error={touchedFields.adresseComplete && !data.adresseComplete}
                  margin="normal"
                />
                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <Autocomplete
                      options={localitesSuisse}
                      value={data.npaLocalite}
                      onChange={(e, newValue) =>
                        setData({ ...data, npaLocalite: newValue })
                      }
                      onBlur={() => handleBlur("npaLocalite")}
                      renderInput={(params) => (
                        <TextField
                          {...params}
                          label="NPA et localité"
                          margin="normal"
                          fullWidth
                          sx={{ minWidth: 400 }}
                          error={touchedFields.npaLocalite && !data.npaLocalite}
                        />
                      )}
                    />
                  </Grid>
                </Grid>
          
                <TextField
                  label="Type de bien"
                  select
                  fullWidth
                  margin="normal"
                  value={data.type}
                  onChange={(e) => setData({ ...data, type: e.target.value })}
                  onBlur={() => handleBlur("type")}
                  error={touchedFields.type && !data.type}
                >
                  {types.map((opt) => (
                    <MenuItem key={opt} value={opt}>
                      {opt}
                    </MenuItem>
                  ))}
                </TextField>
          
                <ChampMontantSimple
                  label="Montant estimé ou d’acquisition"
                  value={data.valeur}
                  onChange={(val) => setData({ ...data, valeur: val })}
                  onBlur={() => handleBlur("valeur")}
                  error={touchedFields.valeur && !data.valeur}
                />
              </>
            );

            
            case 1:
                return (
                  <>
                    <TextField
                      label="Surface habitable (m²)"
                      fullWidth
                      type="number"
                      margin="normal"
                      value={data.surfaceHabitable}
                      onChange={(e) => setData({ ...data, surfaceHabitable: e.target.value })}
                      onBlur={() => handleBlur("surfaceHabitable")}
                      error={touchedFields.surfaceHabitable && !data.surfaceHabitable}
                    />
                    <TextField
                      label="Surface terrain (m²)"
                      fullWidth
                      type="number"
                      margin="normal"
                      value={data.surfaceTerrain}
                      onChange={(e) => setData({ ...data, surfaceTerrain: e.target.value })}
                    />
                    <TextField
                      label="Nombre de pièces"
                      fullWidth
                      type="number"
                      margin="normal"
                      value={data.nbPieces}
                      onChange={(e) => setData({ ...data, nbPieces: e.target.value })}
                      onBlur={() => handleBlur("nbPieces")}
                      error={touchedFields.nbPieces && !data.nbPieces}
                    />
                    <TextField
                      label="Nombre de salles d’eau"
                      fullWidth
                      type="number"
                      margin="normal"
                      value={data.nbSallesEau}
                      onChange={(e) => setData({ ...data, nbSallesEau: e.target.value })}
                    />
                    <TextField
                      label="Surface balcon / terrasse (m²)"
                      fullWidth
                      type="number"
                      margin="normal"
                      value={data.surfaceBalcon}
                      onChange={(e) => setData({ ...data, surfaceBalcon: e.target.value })}
                    />
                    <TextField
                      label="Surface cave / disponible (m²)"
                      fullWidth
                      type="number"
                      margin="normal"
                      value={data.surfaceCave}
                      onChange={(e) => setData({ ...data, surfaceCave: e.target.value })}
                    />
                  </>
                );

                
                case 2:
                    return (
                      <>
                        <TextField
                          label="Année de construction"
                          fullWidth
                          type="number"
                          margin="normal"
                          value={data.anneeConstruction}
                          onChange={(e) =>
                            setData({ ...data, anneeConstruction: e.target.value })
                          }
                          onBlur={() => handleBlur("anneeConstruction")}
                          error={touchedFields.anneeConstruction && !data.anneeConstruction}
                        />
                  
                        <TextField
                          label="Année de rénovation (si existante)"
                          fullWidth
                          type="number"
                          margin="normal"
                          value={data.anneeRenovation}
                          onChange={(e) =>
                            setData({ ...data, anneeRenovation: e.target.value })
                          }
                        />
                  
                        <TextField
                          label="Type de construction"
                          select
                          fullWidth
                          margin="normal"
                          value={data.typeConstruction || ""}
                          onChange={(e) =>
                            setData({ ...data, typeConstruction: e.target.value })
                          }
                          onBlur={() => handleBlur("typeConstruction")}
                          error={touchedFields.typeConstruction && !data.typeConstruction}
                        >
                          {[
                            "Traditionnelle (maçonnerie/béton)",
                            "Ossature bois",
                            "Préfabriquée",
                            "Mixte",
                            "Conteneur",
                            "Autre",
                          ].map((opt) => (
                            <MenuItem key={opt} value={opt}>
                              {opt}
                            </MenuItem>
                          ))}
                        </TextField>
                  
                        <TextField
                          label="État d’entretien"
                          select
                          fullWidth
                          margin="normal"
                          value={data.etat}
                          onChange={(e) => setData({ ...data, etat: e.target.value })}
                          onBlur={() => handleBlur("etat")}
                          error={touchedFields.etat && !data.etat}
                        >
                          {etats.map((opt) => (
                            <MenuItem key={opt} value={opt}>
                              {opt}
                            </MenuItem>
                          ))}
                        </TextField>
                      </>
                    );
                  
          
      case 3:
        return (
          <>
            <TextField label="Nombre de places intérieures" fullWidth type="number" margin="normal" value={data.placesInt} onChange={(e) => setData({ ...data, placesInt: e.target.value })} />
            <TextField label="Nombre de places extérieures" fullWidth type="number" margin="normal" value={data.placesExt} onChange={(e) => setData({ ...data, placesExt: e.target.value })} />
            <FormControlLabel control={<Switch checked={data.ascenseur} onChange={(e) => setData({ ...data, ascenseur: e.target.checked })} />} label="Ascenseur" sx={{ mt: 2 }} />
            <Box mt={1} mb={2}>
              <FormControlLabel control={<Switch checked={data.vueDegagee} onChange={(e) => setData({ ...data, vueDegagee: e.target.checked })} />} label="Vue dégagée" />
            </Box>
            <TextField label="Type de chauffage" select fullWidth margin="normal" value={data.chauffageType} onChange={(e) => setData({ ...data, chauffageType: e.target.value })}>{chauffageTypes.map((opt) => <MenuItem key={opt} value={opt}>{opt}</MenuItem>)}</TextField>
            <TextField label="Distribution du chauffage" select fullWidth margin="normal" value={data.chauffageDistribution} onChange={(e) => setData({ ...data, chauffageDistribution: e.target.value })}>{chauffageDistributions.map((opt) => <MenuItem key={opt} value={opt}>{opt}</MenuItem>)}</TextField>
          </>
        );
      default:
        return null;
    }
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="md">
      <DialogTitle>Informations sur le bien immobilier</DialogTitle>
      <DialogContent dividers>
      <Stepper activeStep={activeStep} alternativeLabel sx={{ mb: 3 }}>
  {steps.map((label, index) => (
    <Step key={label}>
      <StepLabel
        onClick={() => {
          if (index <= activeStep) setActiveStep(index);
        }}
        sx={{
          cursor: index <= activeStep ? "pointer" : "default",
        }}
      >
        {label}
      </StepLabel>
    </Step>
  ))}
</Stepper>

        <Box>{renderStepContent(activeStep)}</Box>

        {getMissingFields().length > 0 && (
  <Typography variant="caption" color="error" sx={{ mt: 1 }}>
    Champs essentiels manquants pour une estimation fiable : {getMissingFields().join(", ")}.
  </Typography>
)}



      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Annuler</Button>
        {activeStep > 0 && <Button onClick={handleBack}>Retour</Button>}
        {!isLastStep && (<Button onClick={handleNext} disabled={!isStepValid()} variant="contained">Suivant</Button>)}
        {isLastStep && (<Button onClick={handleSave} variant="contained" disabled={!isStepValid()}>Enregistrer</Button>)}
      </DialogActions>
    </Dialog>
  );
};

export default ModalBienImmobilier;