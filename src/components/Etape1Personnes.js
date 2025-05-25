import React, { useState } from "react";
import {
  Box,
  Typography,
  Button,
  Grid,
  IconButton,
  Paper,
  Tooltip
} from "@mui/material";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
} from "@mui/material";



import { Snackbar, Alert } from "@mui/material";


import PersonAdd from "@mui/icons-material/PersonAdd";
import PersonIcon from "@mui/icons-material/Person";
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import ModalNouvellePersonne from "./ModalNouvellePersonne";

const Etape1Personnes = ({ formData, setFormData, docRef, nextStep }) => {
  const [open, setOpen] = useState(false);
  const [editingIndex, setEditingIndex] = useState(null);

  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [personToDeleteIndex, setPersonToDeleteIndex] = useState(null);

  const [toastOpen, setToastOpen] = useState(false);



  const handleAddPersonne = (personne) => {
    const personnes = Array.isArray(formData?.personnes) ? formData.personnes : [];
  
    let updatedList;
    if (editingIndex !== null) {
      updatedList = [...personnes];
      updatedList[editingIndex] = {
        ...updatedList[editingIndex],  // conserve les anciennes données
        ...personne                    // remplace uniquement ce qui a changé
      };
    } else {
      updatedList = [...personnes, personne];
    }
    
  
    const updated = { ...formData, personnes: updatedList };
    setFormData(updated);
    setEditingIndex(null);
  
    if (docRef) {
      import("firebase/firestore").then(({ updateDoc }) => {
        updateDoc(docRef, { personnes: updatedList });
      });
    }
  };
  

  const handleDeletePersonne = (index) => {
    const updatedList = formData.personnes.filter((_, i) => i !== index);
    const updated = { ...formData, personnes: updatedList };
    setFormData(updated);
    if (docRef) {
      import("firebase/firestore").then(({ updateDoc }) => {
        updateDoc(docRef, { personnes: updatedList });
      });
    }
  };

  return (
    <Box>
      <Typography variant="h5" mb={4}>
        Personnes
      </Typography>

      {formData?.personnes?.length > 0 && (
      
        <Box mb={4}>
          {formData.personnes.map((p, index) => (
            <Paper
              key={index}
              sx={{
                p: 2,
                mb: 2,
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                backgroundColor: "#f4f4f4",
              }}
            >
              <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                <PersonIcon sx={{ fontSize: 40 }} />
                <Box>
                  <Typography variant="subtitle2">{p.civilite}</Typography>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <Typography variant="body1" fontWeight={600}>
                      {p.prenom} {p.nom}
                    </Typography>
                    {(p.rueNumero || p.npaLocalite || p.telephone) && (
                      <Tooltip
                        arrow
                        title={
                          <Box>
                            {p.rueNumero && <Typography variant="body2">{p.rueNumero}</Typography>}
                            {p.npaLocalite && <Typography variant="body2">{p.npaLocalite}</Typography>}
                            {p.telephone && <Typography variant="body2">{p.telephone}</Typography>}
                          </Box>
                        }
                      >
                        <InfoOutlinedIcon fontSize="small" sx={{ color: "#666" }} />
                      </Tooltip>
                    )}
                  </Box>
                  <Typography variant="body2">{p.dateNaissance}</Typography>
                </Box>
              </Box>
              <Box>
              <IconButton
                color="primary"
                onClick={() => {
                  setEditingIndex(index);
                  setOpen(true);
                }}
              >
                <EditIcon />
              </IconButton>

              <IconButton
                color="primary"
                onClick={() => {
                  setPersonToDeleteIndex(index);
                  setConfirmDialogOpen(true);
                }}
              >
                <DeleteIcon />
              </IconButton>


              </Box>
            </Paper>
          ))}
        </Box>
      )}


      <Button
        variant="contained"
        startIcon={<PersonAdd />}    
        onClick={() => {
          if (formData?.personnes?.length < 2) {
            setEditingIndex(null);
            setOpen(true);
          }
        }}

        disabled={formData?.personnes?.length >= 2}
        sx={{
          backgroundColor: "#002BFF",
          fontWeight: "bold",
          px: 4,
          py: 2,
          mb: 6,
          "&:hover": { backgroundColor: "#001ACC" },
        }}
      >
        AJOUTER UNE PERSONNE
      </Button>

          <Dialog open={confirmDialogOpen} onClose={() => setConfirmDialogOpen(false)}>
          <DialogTitle>
            Supprimer{" "}
            {formData?.personnes?.[personToDeleteIndex]?.prenom}{" "}
            {formData?.personnes?.[personToDeleteIndex]?.nom}
          </DialogTitle>

      <DialogContent>
      <DialogContentText>
        Êtes-vous sûr de vouloir supprimer{" "}
        <strong>
          {formData?.personnes?.[personToDeleteIndex]?.prenom} {formData?.personnes?.[personToDeleteIndex]?.nom}
        </strong>
        ? Cette action est irréversible.
      </DialogContentText>

      </DialogContent>
      <DialogActions>
        <Button onClick={() => setConfirmDialogOpen(false)} variant="outlined">
          Annuler
        </Button>
        <Button
  onClick={() => {
    if (personToDeleteIndex !== null) {
      handleDeletePersonne(personToDeleteIndex);
      setToastOpen(true); // 👈 Ajoute cette ligne
    }
    setConfirmDialogOpen(false);
    setPersonToDeleteIndex(null);
  }}
  variant="contained"
  color="error"
>
  Supprimer
</Button>

      </DialogActions>
    </Dialog>

    <Snackbar
  open={toastOpen}
  autoHideDuration={4000}
  onClose={() => setToastOpen(false)}
  anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
>
  <Alert
    onClose={() => setToastOpen(false)}
    severity="success"
    sx={{ width: "100%" }}
  >
    Personne supprimée avec succès.
  </Alert>
</Snackbar>




      <ModalNouvellePersonne
        open={open}
        onClose={() => {
          setOpen(false);
          setEditingIndex(null);
        }}
        onSave={handleAddPersonne}
        initialData={editingIndex !== null ? formData.personnes[editingIndex] : null}
      />
    </Box>
  );
};

export default Etape1Personnes;
