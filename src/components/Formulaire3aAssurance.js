import React from "react";

import {
  Box,
  Typography,
  TextField,
  IconButton,
  MenuItem,
  Button,
  Tooltip,
  InputAdornment
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import ChampMontant from "./ChampMontant";
import { enregistrerContrats3aAssurance } from "../utils/financeUtils";
import { useAuth } from "../AuthContext";



const institutionsAssurance = [
  "AXA", "Swiss Life", "Allianz", "Generali", "Helvetia", "Bâloise", "Zurich", "Autre"
];

const Formulaire3aAssurance = ({ contrats, setContrats }) => {
  const { user } = useAuth();

  const ajouterContrat = () => {
    const nouveaux = [...contrats, { compagnie: "", montant: 0 }];
    setContrats(nouveaux);
    enregistrerContrats3aAssurance(user, nouveaux);
  };

  const supprimerContrat = (index) => {
    const updated = contrats.filter((_, i) => i !== index);
    setContrats(updated);
    enregistrerContrats3aAssurance(user, updated);
  };

  const mettreAJourContrat = (index, champ, valeur) => {
    const updated = [...contrats];
    updated[index][champ] = valeur;
    setContrats(updated);
    enregistrerContrats3aAssurance(user, updated);
  };

  return (
    <Box sx={{ mt: 3 }}>
      <Typography variant="subtitle1" fontWeight={600} gutterBottom>
        🔐 Détails des contrats 3a assurance
      </Typography>

      {contrats.map((contrat, index) => (
        <Box
          key={index}
          sx={{
            border: "1px solid #E0E0E0",
            borderRadius: 2,
            p: 2,
            mb: 2,
            backgroundColor: "#F9F9F9",
            boxShadow: "0 1px 2px rgba(0,0,0,0.04)",
          }}
        >
          <TextField
            select
            fullWidth
            label="Compagnie d’assurance"
            value={contrat.compagnie}
            onChange={(e) => mettreAJourContrat(index, "compagnie", e.target.value)}
            margin="normal"
          >
            {institutionsAssurance.map((nom) => (
              <MenuItem key={nom} value={nom}>
                {nom}
              </MenuItem>
            ))}
          </TextField>

          <ChampMontant
            label="Valeur de rachat actuelle (CHF)"
            name={`montant-${index}`}
            formData={{ [`montant-${index}`]: contrat.montant }}
            setFormData={(data) =>
                mettreAJourContrat(index, "montant", data[`montant-${index}`])
            }
            user={null}
            InputProps={{
                endAdornment: (
                <InputAdornment position="end">
                    <Tooltip title="La valeur de rachat est le montant que vous pouvez retirer immédiatement de votre contrat 3e pilier assurance si vous décidez de le résilier aujourd’hui.

Elle représente l’épargne que vous avez déjà constituée, après déduction des frais du contrat. Elle est souvent indiquée sur votre relevé annuel.

⚠️ Cette valeur peut être inférieure à la somme totale versée, notamment si le contrat est encore jeune.">
                    <InfoOutlinedIcon color="primary" fontSize="small" />
                    </Tooltip>
                </InputAdornment>
                ),
            }}
            />


          <Box display="flex" justifyContent="flex-start">
            <Tooltip title="Supprimer ce contrat">
              <IconButton onClick={() => supprimerContrat(index)} color="error">
                <DeleteIcon />
              </IconButton>
            </Tooltip>
          </Box>
        </Box>
      ))}

      <Button
        onClick={ajouterContrat} //ajouterCompte
        variant="outlined"
        sx={{
          mt: 1,
          color: "#001BFF",
          borderColor: "#001BFF",
          textTransform: "none",
          fontWeight: 500,
          '&:hover': {
            borderColor: "#0010b3",
            backgroundColor: "#F0F3FF",
          }
        }}
      >
        ➕ Ajouter un contrat 3a assurance
      </Button>
    </Box>
  );
};

export default Formulaire3aAssurance;
