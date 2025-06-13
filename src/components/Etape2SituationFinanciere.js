// ✅ VERSION STYLISÉE AVEC DESIGN CREDITX
import React, { useState, useEffect } from "react";

import { getDoc } from "firebase/firestore";


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
  Chip,
} from "@mui/material";
import { Skeleton } from "@mui/material";
import { Fade } from "@mui/material";
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import CheckIcon from '@mui/icons-material/Check';
import CloseIcon from '@mui/icons-material/Close';



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
import CustomSkeleton from "./CustomSkeleton";


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

const Etape2SituationFinanciere = ({ 
  formData,
  setFormData,
  handleChange,
  user,
  docRef,
  ouvrirModalPourIndex,
  ouvrirModalSiDemande
  }) => {
  const [openedIndices, setOpenedIndices] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [currentPersonIndex, setCurrentPersonIndex] = useState(null);
  const [editingInfos, setEditingInfos] = useState(null);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [toDelete, setToDelete] = useState(null);
  const [toastOpen, setToastOpen] = useState(false);
  const [modalQuestionnaireOpen, setModalQuestionnaireOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [currentEmployeurIndex, setCurrentEmployeurIndex] = useState(null);


  



  const theme = useTheme();

  const refreshFormData = async () => {
    if (!docRef) return;
    setLoading(true);
    const snap = await getDoc(docRef);
    const data = snap.data();
    if (data && Array.isArray(data.personnes)) {
      setFormData((prev) => ({
        ...prev,
        personnes: data.personnes,
      }));
    }
    setTimeout(() => {
    setLoading(false);
  }, 400);
  };
  
  
  
  




  const updateFirestore = (updatedPersonnes) => {
  if (!docRef) return;
  import("firebase/firestore").then(({ updateDoc }) => {
    updateDoc(docRef, {
      personnes: updatedPersonnes,
      lastModificationAt: new Date().toISOString(), // ✅ ici
    });
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

  const isQuestionnaireCompleted = (pers) => {
    if (!pers) return false;
  
    const creditsOk =
      pers.aDesCredits === false ||
      (pers.aDesCredits === true &&
        pers.montantCredits?.toString().trim() !== "" &&
        pers.mensualiteCredits?.toString().trim() !== "");
  
    const leasingOk =
      pers.aUnLeasing === false ||
      (pers.aUnLeasing === true &&
        pers.montantLeasing?.toString().trim() !== "" &&
        pers.mensualiteLeasing?.toString().trim() !== "");
  
    const pensionOk =
      pers.payePension === false ||
      (pers.payePension === true &&
        pers.montantPension?.toString().trim() !== "");
  
    const enfantsOk =
      pers.aDesEnfants === false ||
      (pers.aDesEnfants === true &&
        Array.isArray(pers.enfants) &&
        pers.enfants.length > 0 &&
        pers.enfants.every((enfant) =>
          enfant.prenom?.trim() !== "" && enfant.dateNaissance?.trim() !== ""
        ));

    const revenusLocatifsOk =
    pers.aDesRevenusLocatifs === false ||
    (pers.aDesRevenusLocatifs === true &&
      pers.montantRevenusLocatifs?.toString().trim() !== "");
      
  
    const poursuitesOk = pers.aDesPoursuites !== null;
  
    return (
      creditsOk &&
      leasingOk &&
      pensionOk &&
      enfantsOk &&
      revenusLocatifsOk &&
      poursuitesOk
    );
    
  };

  const [showErrors, setShowErrors] = useState(false);

  const handleOpenQuestionnaire = (pIdx) => {
    setCurrentPersonIndex(pIdx);
    setShowErrors(true);
    setModalQuestionnaireOpen(true);
  };
  
  useEffect(() => {
    if (!modalQuestionnaireOpen) {
      refreshFormData(); // Refresh auto quand le modal se ferme
    }
  }, [modalQuestionnaireOpen]);

  
  


  
  
  
  

  return (
    <Box className="container">
      <Typography variant="h5" mb={4}>Données financières</Typography>

      {loading ? (
  [...Array(2)].map((_, i) => (
    <Paper key={i} sx={{ mb: 2, p: 2, borderRadius: 2, backgroundColor: "#F9FAFB", boxShadow: 1 }}>
      <Box display="flex" alignItems="center" gap={2}>
        <CustomSkeleton variant="circular" width={36} height={36}/>
        <Box flexGrow={1}>
          <CustomSkeleton variant="text" width="40%" height={20}/>
          <CustomSkeleton variant="text" width="60%" height={20}/>
        </Box>
      </Box>
      <Box mt={2}>
        <CustomSkeleton variant="rectangular" height={80} sx={{ borderRadius: 1 }} />
      </Box>
    </Paper>
  ))
) : (



  <Fade in={!loading} timeout={600} unmountOnExit>
<Box className="container">
      {personnes.map((pers, pIdx) => {
        const isOpen = openedIndices.includes(pIdx);
        const employeurs = pers.employeurs || [];

        return (
  <Paper key={pIdx} sx={{ mb: 2, p: 2, backgroundColor: theme.palette.background.default, border: `1px solid ${theme.palette.divider}` }}>
    <Box
      display="flex"
      alignItems="center"
      justifyContent="space-between"
      onClick={() => handleToggle(pIdx)}
      sx={{ cursor: "pointer" }}
    >
      <Box display="flex" alignItems="center" gap={2}>
        <Box
          sx={{
            
            borderRadius: "50%",
            p: "4px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: 36,
            height: 36,
          }}
        >
          {employeurs.length > 0 && isQuestionnaireCompleted(pers) ? (
  <Box
    sx={{
      width: 28,
      height: 28,
      backgroundColor: theme.palette.success.main,
      borderRadius: "50%",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
    }}
  >
    <CheckIcon sx={{ fontSize: 18, color: "#fff" }} />
  </Box>
) : (
  <Box
    sx={{
      width: 28,
      height: 28,
      backgroundColor: theme.palette.error.main,
      borderRadius: "50%",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
    }}
  >
    <CloseIcon sx={{ fontSize: 18, color: "#fff" }} />
  </Box>
)}

        </Box>




                <Box className="container">
                  <Typography sx={{ fontWeight: 600 }} color="text.primary">Situation financière</Typography>
                    <Box display="flex" alignItems="center" gap={1} color="text.secondary">

                    <PersonIcon />
                    <Typography>{pers.prenom} {pers.nom}, {pers.dateNaissance}</Typography>
                  </Box>
                </Box>
              </Box>
              <IconButton size="small" sx={{ borderRadius: 2, "&:hover": { backgroundColor: "#F0F4FF" } }}>{isOpen ? <ExpandLessIcon sx={{ color: theme.palette.secondary.main }} /> : <ExpandMoreIcon sx={{ color: theme.palette.secondary.main }} />}</IconButton>
            </Box>

            <Collapse in={isOpen} timeout="auto" unmountOnExit>
              <Box mt={2} p={2} sx={{ backgroundColor: "#FFFFFF", borderRadius: 2, p: 2, border: "1px solid #E0E0E0" }} border="1px solid #ccc">
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
                            <IconButton size="small" sx={{ borderRadius: 2, "&:hover": { backgroundColor: "#F0F4FF" } }} onClick={() => {
                              setCurrentPersonIndex(pIdx);
                              setEditingInfos({ personIndex: pIdx, empIndex: eIdx, data: emp });
                              setModalOpen(true);
                            }}>
                              <EditIcon fontSize="small" />
                            </IconButton>
                            <IconButton size="small" sx={{ borderRadius: 2, "&:hover": { backgroundColor: "#F0F4FF" } }} onClick={() => {
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

                {employeurs.length === 0 && (
  <Box
    sx={{
      p: 2,
      border: `1px dashed ${theme.palette.divider}`,
      borderRadius: 2,
      backgroundColor: theme.palette.background.default,
      display: "flex",
      alignItems: "center",
      gap: 2,
      color: "text.secondary",
    }}
  >
    <BadgeIcon sx={{ color: theme.palette.divider }} />
    <Typography variant="body2">
      Aucun employeur n’a encore été ajouté pour {pers.prenom}.
    </Typography>
  </Box>
)}


                <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center', mt: 2 }}>
  <Button
  variant="contained"
  onClick={() => {
    setCurrentPersonIndex(pIdx);
    setEditingInfos(null);
    setModalOpen(true);
  }}
  sx={{
    borderRadius: 2,
    px: 4,
    py: 1.5,
    fontWeight: "bold",
    textTransform: "none",
    backgroundColor: theme.palette.secondary.main,
    "&:hover": {
      backgroundColor: theme.palette.secondary.dark,
    },
  }}
>
  AJOUTER UN EMPLOYEUR
</Button>


<Button
  data-bouton-questionnaire
  onClick={() => {
    setCurrentPersonIndex(pIdx);
    setShowErrors(true); // 🔥 Important pour forcer l'affichage des erreurs
    setCurrentEmployeurIndex(0);
    setModalQuestionnaireOpen(true);
  }}
  variant="outlined"
  sx={{
    borderRadius: 2,
    px: 2.5,
    py: 1.5,
    fontWeight: 'bold',
    textTransform: 'none',
    borderWidth: 2,
    display: 'flex',
    alignItems: 'center',
    gap: 1.5,
    borderColor: isQuestionnaireCompleted(pers) ? 'primary.main' : 'error.main',
    color: isQuestionnaireCompleted(pers) ? 'primary.main' : 'error.main',
    transition: "all 0.3s ease",
    "&:hover": {
      borderColor: isQuestionnaireCompleted(pers) ? 'primary.dark' : 'primary.dark',
      backgroundColor: "rgba(0, 0, 0, 0.08)",
      color: 'primary.dark',
    },
  }}
>
  {isQuestionnaireCompleted(pers) ? (
    <Box
      sx={{
        width: 28,
        height: 28,
        backgroundColor: theme.palette.success.main,
        borderRadius: "50%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center"
      }}
    >
      <CheckIcon sx={{ fontSize: 18, color: "#fff" }} />
    </Box>
  ) : (
    <Box
      sx={{
        width: 28,
        height: 28,
        backgroundColor: theme.palette.error.main,
        borderRadius: "50%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center"
      }}
    >
      <CloseIcon sx={{ fontSize: 18, color: "#fff" }} />
    </Box>
  )}

  <span style={{ fontWeight: "bold", fontSize: "1rem" }}>
    QUESTIONNAIRE PERSONNEL
  </span>
</Button>

</Box>





              </Box>
            </Collapse>
          </Paper>
        );
      })}
      </Box>
      </Fade>
      
 
    )}
  
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
  personIndex={currentPersonIndex}
  employeurIndex={currentEmployeurIndex}
  docRef={docRef}
  showErrors={showErrors}
  setShowErrors={setShowErrors}
  refreshFormData={refreshFormData}
/>








      <Dialog open={confirmDialogOpen} onClose={() => setConfirmDialogOpen(false)}>
        <DialogTitle>Supprimer l’employeur</DialogTitle>
        <DialogContent>
          <DialogContentText>Êtes-vous sûr de vouloir supprimer cet employeur ? Cette action est irréversible.</DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmDialogOpen(false)} variant="outlined" sx={{ borderRadius: 2, px: 3, py: 1.5, fontWeight: 500, textTransform: "none", borderWidth: 2 }}>Annuler</Button>
          <Button onClick={() => {
            if (toDelete) handleDeleteEmployeur(toDelete.personIndex, toDelete.empIndex);
            setConfirmDialogOpen(false);
            setToDelete(null);
            setToastOpen(true);
          }} variant="contained" sx={{ borderRadius: 2, px: 3, py: 1.5, fontWeight: 500, textTransform: "none", "&:hover": { backgroundColor: "#0052CC" } }} color="error">Supprimer</Button>
        </DialogActions>
      </Dialog>

      <Snackbar open={toastOpen} autoHideDuration={4000} onClose={() => setToastOpen(false)} anchorOrigin={{ vertical: "bottom", horizontal: "center" }}>
        <Alert onClose={() => setToastOpen(false)} severity="success" sx={{ width: "100%" }}>Employeur supprimé avec succès.</Alert>
      </Snackbar>


    </Box>
  );
};

export default Etape2SituationFinanciere;
