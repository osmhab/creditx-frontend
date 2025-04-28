import React, { useState } from "react";
import {
  Box,
  Typography,
  Paper,
  IconButton,
  Button,
  Collapse,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Snackbar,
  Alert,
  Chip
} from "@mui/material";

import { useTheme } from "@mui/material";

import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import PersonIcon from "@mui/icons-material/Person";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import BadgeIcon from "@mui/icons-material/Badge";

import ModalNouvelEmployeur from "./ModalNouvelEmployeur";
import QuestionnairePersonnel from "./QuestionnairePersonnel";


const ModalQuestionnairePersonnel = ({ open, onClose, person }) => {
  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>Questionnaire personnel</DialogTitle>
      <DialogContent>
        <DialogContentText>
          Ce questionnaire permettra de renseigner des informations sur {person?.prenom} {person?.nom} (leasings, crédits, enfants, poursuites, etc).
        </DialogContentText>
        <Box mt={2}>
          <Typography variant="body2" fontStyle="italic">(Formulaire à venir...)</Typography>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Fermer</Button>
      </DialogActions>
    </Dialog>
  );
};

const Etape2SituationFinanciere = ({ formData, setFormData, docRef }) => {
  const [openedIndices, setOpenedIndices] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [currentPersonIndex, setCurrentPersonIndex] = useState(null);
  const [editingInfos, setEditingInfos] = useState(null);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [toDelete, setToDelete] = useState(null);
  const [toastOpen, setToastOpen] = useState(false);
  const [modalQuestionnaireOpen, setModalQuestionnaireOpen] = useState(false);
  const [showErrors, setShowErrors] = useState(false);


  const theme = useTheme();




  const updateFirestore = (updatedPersonnes) => {
    if (!docRef) return;
    import("firebase/firestore").then(({ updateDoc }) => {
      updateDoc(docRef, { personnes: updatedPersonnes });
    });
  };

  const handleToggle = (index) => {
    if (openedIndices.includes(index)) {
      setOpenedIndices(openedIndices.filter((i) => i !== index));
    } else {
      setOpenedIndices([...openedIndices, index]);
    }
  };

  const handleSaveEmployeur = (employeur) => {
    if (currentPersonIndex === null) return;
    const personsCopy = [...formData.personnes];
    const person = personsCopy[currentPersonIndex];
    person.employeurs = person.employeurs || [];
    if (editingInfos) {
      person.employeurs[editingInfos.empIndex] = employeur;
    } else {
      person.employeurs.push(employeur);
    }
    setFormData({ ...formData, personnes: personsCopy });
    updateFirestore(personsCopy);
    setEditingInfos(null);
    setModalOpen(false);
  };

  const handleDeleteEmployeur = (pIdx, eIdx) => {
    const personsCopy = [...formData.personnes];
    if (personsCopy[pIdx]?.employeurs) {
      personsCopy[pIdx].employeurs.splice(eIdx, 1);
    }
    setFormData({ ...formData, personnes: personsCopy });
    updateFirestore(personsCopy);
  };

  const personnes = Array.isArray(formData?.personnes) ? formData.personnes : [];

  const isQuestionnaireComplet = (pers) => {
    return pers.aDesCredits !== null &&
      pers.aUnLeasing !== null &&
      pers.payePension !== null &&
      pers.aDesEnfants !== null &&
      pers.aDesPoursuites !== null;
  };
  

  return (
    <Box>
      <Typography variant="h5" mb={4}>Données financières</Typography>

      {personnes.map((pers, pIdx) => {
        const isOpen = openedIndices.includes(pIdx);
        const employeurs = pers.employeurs || [];

        return (
          <Paper key={pIdx} sx={{ mb: 2, p: 2, backgroundColor: "#f0f0f0", border: "1px solid #ccc" }}>
            <Box display="flex" alignItems="center" justifyContent="space-between" onClick={() => handleToggle(pIdx)} sx={{ cursor: "pointer" }}>
              <Box display="flex" alignItems="center" gap={2}>
                <InfoOutlinedIcon sx={{ border: "1px solid #001BFF", borderRadius: "50%", fontSize: 28, color: "#001BFF", p: "2px" }} />
                <Box>
                  <Typography fontWeight="bold" color="#001BFF">Situation financière</Typography>
                  <Box display="flex" alignItems="center" gap={1} color="#001BFF">
                    <PersonIcon />
                    <Typography>{pers.prenom} {pers.nom}, {pers.dateNaissance}</Typography>
                  </Box>
                </Box>
              </Box>
              <IconButton size="small">{isOpen ? <ExpandLessIcon sx={{ color: "#001BFF" }} /> : <ExpandMoreIcon sx={{ color: "#001BFF" }} />}</IconButton>
            </Box>

            <Collapse in={isOpen} timeout="auto" unmountOnExit>
              <Box mt={2} p={2} bgcolor="white" border="1px solid #ccc">
                <Box mb={2}>
                  <Typography fontWeight={500}>{pers.civilite}</Typography>
                  <Typography>{pers.prenom} {pers.nom}</Typography>
                  <Typography>{pers.dateNaissance}</Typography>
                </Box>

                {employeurs.length > 0 && (
                  <List dense>
                    {employeurs.map((emp, eIdx) => (
                      <React.Fragment key={eIdx}>
                        <ListItem alignItems="flex-start">
                          <BadgeIcon sx={{ color: "secondary", mr: 2, mt: 0.5 }} />
                          <ListItemText primary={emp.nom} secondary={emp.adresse} />
                          <ListItemSecondaryAction>
                            <IconButton size="small" onClick={() => {
                              setCurrentPersonIndex(pIdx);
                              setEditingInfos({ personIndex: pIdx, empIndex: eIdx, data: emp });
                              setModalOpen(true);
                            }}>
                              <EditIcon fontSize="small" />
                            </IconButton>
                            <IconButton size="small" onClick={() => {
                              setToDelete({ personIndex: pIdx, empIndex: eIdx });
                              setConfirmDialogOpen(true);
                            }}>
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </ListItemSecondaryAction>
                        </ListItem>
                        {eIdx < employeurs.length - 1 && <Divider component="li" />}
                      </React.Fragment>
                    ))}
                  </List>
                )}

                <Button variant="contained" onClick={() => {
                  setCurrentPersonIndex(pIdx);
                  setEditingInfos(null);
                  setModalOpen(true);
                }} sx={{ backgroundColor: "#001BFF", fontWeight: "bold", px: 4, py: 1.5, mt: 2, "&:hover": { backgroundColor: "#0010b3" } }}>
                  AJOUTER UN EMPLOYEUR
                </Button>

                <Button
                variant="outlined"
                onClick={() => {
                  setCurrentPersonIndex(pIdx);
                  setModalQuestionnaireOpen(true);
                }}
                sx={{
                  mt: 2,
                  ml: 2,
                  color: isQuestionnaireComplet(pers) ? theme.palette.success.main : (showErrors ? theme.palette.error.main : "inherit"),
                  borderColor: isQuestionnaireComplet(pers) ? theme.palette.success.main : (showErrors ? theme.palette.error.main : "grey.400"),
                  fontWeight: "bold",
                  display: "flex",
                  alignItems: "center",
                  gap: 1,
                  px: 2,
                  py: 1,
                }}
              >
                Questionnaire personnel
                {isQuestionnaireComplet(pers) && (
                  <Chip
                    label="✔️"
                    color="success"
                    size="small"
                    sx={{ fontSize: "16px", height: "24px" }}
                  />
                )}
              </Button>


              </Box>
            </Collapse>
          </Paper>
        );
      })}

      <ModalNouvelEmployeur
        open={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setEditingInfos(null);
        }}
        onSave={handleSaveEmployeur}
        initialData={editingInfos ? editingInfos.data : null}
      />

      <QuestionnairePersonnel
        open={modalQuestionnaireOpen}
        onClose={() => setModalQuestionnaireOpen(false)}
        person={personnes[currentPersonIndex]}
        personIndex={currentPersonIndex}
        docRef={docRef}
      />


      <Dialog open={confirmDialogOpen} onClose={() => setConfirmDialogOpen(false)}>
        <DialogTitle>Supprimer l’employeur</DialogTitle>
        <DialogContent>
          <DialogContentText>Êtes-vous sûr de vouloir supprimer cet employeur ? Cette action est irréversible.</DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmDialogOpen(false)} variant="outlined">Annuler</Button>
          <Button onClick={() => {
            if (toDelete) handleDeleteEmployeur(toDelete.personIndex, toDelete.empIndex);
            setConfirmDialogOpen(false);
            setToDelete(null);
            setToastOpen(true);
          }} variant="contained" color="error">Supprimer</Button>
        </DialogActions>
      </Dialog>

      <Snackbar open={toastOpen} autoHideDuration={4000} onClose={() => setToastOpen(false)} anchorOrigin={{ vertical: "bottom", horizontal: "center" }}>
        <Alert onClose={() => setToastOpen(false)} severity="success" sx={{ width: "100%" }}>Employeur supprimé avec succès.</Alert>
      </Snackbar>

      <Box display="flex" justifyContent="flex-end" mt={4}>
        <Button variant="contained" disabled sx={{ backgroundColor: "#001BFF", fontWeight: "bold", px: 4, py: 2, "&:hover": { backgroundColor: "#0010b3" } }}>
          CONTINUER
        </Button>
      </Box>
    </Box>
  );
};

export default Etape2SituationFinanciere;
