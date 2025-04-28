import React from "react";
import {
  Typography,
  Box,
  TextField,
  MenuItem,
  Checkbox,
  FormControlLabel,
  Button,
} from "@mui/material";
import ChampMontant from "./ChampMontant";

const ListeEmployeurs = ({ employeurs, setEmployeurs }) => {
  const ajouterEmployeur = () => {
    const updated = [...(employeurs || []), {
      nom: "",
      adresse: "",
      statut: "",
      revenu: "",
      bonus: "",
      irregulier: false,
    }];
    setEmployeurs(updated);
  };

  const modifierEmployeur = (index, field, value) => {
    const updated = [...employeurs];
    updated[index][field] = value;
    setEmployeurs(updated);
  };

  const supprimerEmployeur = (index) => {
    const confirmed = window.confirm("Supprimer cet employeur ?");
    if (!confirmed) return;
    const updated = employeurs.filter((_, i) => i !== index);
    setEmployeurs(updated);
  };

  return (
    <Box sx={{ mt: 3 }}>
      <Typography variant="h6">Employeur(s)</Typography>

      {employeurs.map((emp, index) => (
        <Box
          key={index}
          sx={{
            border: "1px solid #ccc",
            borderRadius: 2,
            p: 2,
            mt: 2,
            backgroundColor: "#f9f9f9",
          }}
        >
          <TextField
            fullWidth
            label="Nom de l’employeur"
            value={emp.nom}
            onChange={(e) => modifierEmployeur(index, "nom", e.target.value)}
            margin="normal"
          />

          <TextField
            fullWidth
            label="Adresse"
            value={emp.adresse}
            onChange={(e) => modifierEmployeur(index, "adresse", e.target.value)}
            margin="normal"
          />

          <TextField
            select
            fullWidth
            label="Statut professionnel"
            value={emp.statut}
            onChange={(e) => modifierEmployeur(index, "statut", e.target.value)}
            margin="normal"
          >
            <MenuItem value="salarié">Salarié</MenuItem>
            <MenuItem value="indépendant">Indépendant</MenuItem>
          </TextField>

          <ChampMontant
            label="Revenu annuel brut (CHF)"
            name={`revenu-${index}`}
            formData={{ [`revenu-${index}`]: emp.revenu || 0 }}
            setFormData={(data) => {
              const updated = [...employeurs];
              updated[index].revenu = data[`revenu-${index}`];
              setEmployeurs(updated);
            }}
            user={null}
          />

          <ChampMontant
            label="Bonus annuel moyen (CHF)"
            name={`bonus-${index}`}
            formData={{ [`bonus-${index}`]: emp.bonus || 0 }}
            setFormData={(data) => {
              const updated = [...employeurs];
              updated[index].bonus = data[`bonus-${index}`];
              setEmployeurs(updated);
            }}
            user={null}
          />

          {emp.statut === "salarié" && (
            <FormControlLabel
              control={
                <Checkbox
                  checked={emp.irregulier || false}
                  onChange={(e) =>
                    modifierEmployeur(index, "irregulier", e.target.checked)
                  }
                />
              }
              label="Revenu irrégulier (ex. courtier, commissions, etc.)"
            />
          )}

          <Box display="flex" justifyContent="flex-start" mt={2}>
            <Button
              variant="outlined"
              color="error"
              onClick={() => supprimerEmployeur(index)}
            >
              Supprimer
            </Button>
          </Box>
        </Box>
      ))}

      <Button
        onClick={ajouterEmployeur}
        variant="outlined"
        sx={{ mt: 2, color: "#001BFF", borderColor: "#001BFF" }}
      >
        Ajouter un employeur
      </Button>
    </Box>
  );
};

export default ListeEmployeurs;
