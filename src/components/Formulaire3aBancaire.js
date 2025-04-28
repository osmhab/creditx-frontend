import React from "react";
import {
  Box,
  Typography,
  TextField,
  MenuItem,
  IconButton,
  Tooltip,
  Button,
} from "@mui/material";
import ChampMontant from "./ChampMontant";
import DeleteIcon from "@mui/icons-material/Delete";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "../firebase-config";

const institutionsBancaires = [
  "UBS", "Credit Suisse", "Raiffeisen", "PostFinance", "Banque Cler", "BCV", "BCGE", "Autre"
];

const Formulaire3aBancaire = ({ comptes, setComptes, user }) => {
  const enregistrerDansFirestore = async (comptesActuels) => {
    const total = comptesActuels.reduce((acc, c) => acc + Number(c.montant || 0), 0);

    if (user) {
      const ref = doc(db, "dossiers", user.uid);
      await updateDoc(ref, {
        comptes3aBancaires: comptesActuels,
        versement3ePilier: total,
      });
    }
  };

  const modifierCompte = (index, field, value) => {
    const updated = [...comptes];
    updated[index][field] = value;
    setComptes(updated);
    enregistrerDansFirestore(updated);
  };

  const ajouterCompte = () => {
    const updated = [...comptes, { institution: "", montant: 0 }];
    setComptes(updated);
    enregistrerDansFirestore(updated);
  };

  const supprimerCompte = (index) => {
    const updated = comptes.filter((_, i) => i !== index);
    setComptes(updated);
    enregistrerDansFirestore(updated);
  };

  return (
    <Box sx={{ mt: 3 }}>
      <Typography variant="subtitle1" gutterBottom>
        💼 Détails des comptes 3a bancaires
      </Typography>

      {comptes.map((compte, index) => (
        <Box
          key={index}
          sx={{
            border: "1px solid #ccc",
            borderRadius: 2,
            p: 2,
            mb: 2,
            backgroundColor: "#fafafa",
          }}
        >
          <TextField
            select
            fullWidth
            label="Institution bancaire"
            value={compte.institution}
            onChange={(e) => modifierCompte(index, "institution", e.target.value)}
            margin="normal"
          >
            {institutionsBancaires.map((bank) => (
              <MenuItem key={bank} value={bank}>
                {bank}
              </MenuItem>
            ))}
          </TextField>

          <ChampMontant
            label="Montant disponible (CHF)"
            name="montant"
            formData={compte}
            setFormData={(val) => modifierCompte(index, "montant", val.montant)}
            user={null}
          />

          <Box display="flex" justifyContent="flex-start">
            <Tooltip title="Supprimer ce compte">
              <IconButton onClick={() => supprimerCompte(index)} color="error">
                <DeleteIcon />
              </IconButton>
            </Tooltip>
          </Box>
        </Box>
      ))}

      <Button
              onClick={ajouterCompte} //
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
              ➕ Ajouter un compte 3a bancaire
            </Button>
    </Box>
  );
};

export default Formulaire3aBancaire;
