import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  MenuItem,
  Typography,
} from "@mui/material";

import ChampMontantSimple from "./ChampMontantSimple";


const ModalFondsPropres = ({ open, onClose, onSave, initialData }) => {
  const [data, setData] = useState({
    montant: "",
    type: "",
    origine: "",
    institution: "",
    institutionAutre: "",
  });

  useEffect(() => {
    
    if (initialData) {
      setData({
        montant: initialData.montant ?? 0,
        type: initialData.type || "",
        origine: initialData.origine || "",
        institution: initialData.institution || "",
        institutionAutre: initialData.institutionAutre || "",
      });
    } else {
      setData({
        montant: 0,
        type: "",
        origine: "",
        institution: "",
        institutionAutre: "",
      });
    }
  }, [initialData]);

  const typesOptions = ["Comptes / titres", "3e pilier", "2e pilier"];
  const banques = [
    "UBS",
    "Credit Suisse (UBS)",
    "Raiffeisen",
    "Banque Cantonale Vaudoise (BCV)",
    "Banque Cantonale du Valais",
    "PostFinance",
    "Migros Bank",
    "Banque Cler",
    "Autre",
  ];
  const assurances = [
    "AXA",
    "Swiss Life",
    "Zurich",
    "Bâloise",
    "Helvetia",
    "Vaudoise",
    "Allianz",
    "Groupe Mutuel",
    "Autre",
  ];

  const showOrigine = data.type === "3e pilier";
  const showInstitution = data.type !== "" && (data.type !== "3e pilier" || data.origine);
  const isAutreInstitution = data.institution === "Autre";

  const isValid =
  data.montant > 0 &&
  data.type.trim() !== "" &&
  (!showOrigine || data.origine.trim() !== "") &&
  (!showInstitution || data.institution.trim() !== "") &&
  (!isAutreInstitution || data.institutionAutre.trim() !== "");


  const handleSave = () => {
    onSave({
      montant: Number(data.montant),
      type: data.type,
      origine: data.type === "3e pilier" ? data.origine : null,
      institution: data.institution,
      institutionAutre: data.institution === "Autre" ? data.institutionAutre : null,
    });
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>Ajouter des fonds propres</DialogTitle>
      <DialogContent>
      <ChampMontantSimple
        label="Montant"
        value={data.montant}
        onChange={(val) => setData({ ...data, montant: val })}
      />


        <TextField
          label="Type de fonds"
          select
          fullWidth
          margin="normal"
          value={data.type}
          onChange={(e) =>
            setData({
              ...data,
              type: e.target.value,
              origine: "",
              institution: "",
              institutionAutre: "",
            })
          }
        >
          {typesOptions.map((option, index) => (
            <MenuItem key={index} value={option}>
              {option}
            </MenuItem>
          ))}
        </TextField>

        {showOrigine && (
          <TextField
            label="Origine"
            select
            fullWidth
            margin="normal"
            value={data.origine}
            onChange={(e) =>
              setData({
                ...data,
                origine: e.target.value,
                institution: "",
                institutionAutre: "",
              })
            }
          >
            <MenuItem value="banque">Banque</MenuItem>
            <MenuItem value="assurance">Assurance</MenuItem>
          </TextField>
        )}

        {showInstitution && (
          <TextField
            label="Institution"
            select
            fullWidth
            margin="normal"
            value={data.institution}
            onChange={(e) =>
              setData({ ...data, institution: e.target.value, institutionAutre: "" })
            }
          >
            {(data.origine === "banque" ? banques : data.origine === "assurance" ? assurances : banques).map(
              (option, index) => (
                <MenuItem key={index} value={option}>
                  {option}
                </MenuItem>
              )
            )}
          </TextField>
        )}

        {isAutreInstitution && (
          <TextField
            label="Nom de l’institution"
            fullWidth
            margin="normal"
            value={data.institutionAutre}
            onChange={(e) => setData({ ...data, institutionAutre: e.target.value })}
          />
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Annuler</Button>
        <Button variant="contained" onClick={handleSave} disabled={!isValid}>
          Enregistrer
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ModalFondsPropres;
