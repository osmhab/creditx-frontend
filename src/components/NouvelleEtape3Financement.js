import React, { useState, useEffect } from "react";
import { useAuth } from "../AuthContext";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { db } from "../firebase-config";
import { Accordion, AccordionSummary, AccordionDetails } from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import { CircularProgress } from "@mui/material";
import { estimerValeurBienAvecOpenAI } from "../utils/estimationAI"; // adapte le chemin si besoin
import CustomSkeleton from "./CustomSkeleton";




import {
  Box,
  Typography,
  Paper,
  Button,
  Snackbar,
  Alert,
  IconButton,
  List,
  ListItem,
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
} from "@mui/material";
import AssuredWorkloadIcon from "@mui/icons-material/AssuredWorkload";
import AccountBalanceIcon from "@mui/icons-material/AccountBalance";
import MapsHomeWorkIcon from "@mui/icons-material/MapsHomeWork";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import HomeWorkIcon from "@mui/icons-material/HomeWork";
import StraightenIcon from "@mui/icons-material/Straighten";
import MeetingRoomIcon from "@mui/icons-material/MeetingRoom";
import CalendarMonthIcon from "@mui/icons-material/CalendarMonth";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import { useTheme } from "@mui/material/styles";
import ModalBienImmobilier from "./ModalBienImmobilier";
import ModalFondsPropres from "./ModalFondsPropres";

const NouvelleEtape3Financement = ({ formData, setFormData, docRef, reloadFaisabilite }) => {

  const theme = useTheme();
  const [modalBienOpen, setModalBienOpen] = useState(false);
  const [modalFondsOpen, setModalFondsOpen] = useState(false);
  const [editingFondsIndex, setEditingFondsIndex] = useState(null);
  const [toastOpen, setToastOpen] = useState(false);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);

  const { user } = useAuth();

  const [refreshKey, setRefreshKey] = useState(0);


  const [resultatsFaisabilite, setResultatsFaisabilite] = useState(null);

useEffect(() => {
  if (formData?.resultatsFaisabilite) {
    setResultatsFaisabilite(formData.resultatsFaisabilite);
  }
}, [formData, refreshKey]);


useEffect(() => {
  if (!user?.uid) return;

  let isMounted = true; // ✅ pour éviter les updates sur composants démontés
  const start = Date.now();

  const fetchImmobilier = async () => {
    const ref = doc(db, "dossiers", user.uid);
    const snap = await getDoc(ref);
    const data = snap.data();

    if (isMounted && data?.immobilier) {
      setFormData((prev) => ({
        ...prev,
        bienImmobilier: data.immobilier,
      }));
    }

    // ✅ Calcul du temps écoulé
    const elapsed = Date.now() - start;
    const delay = Math.max(600 - elapsed, 0); // minimum 600ms

    setTimeout(() => {
      if (isMounted) setLoading(false);
    }, delay);
  };

  fetchImmobilier();

  return () => {
    isMounted = false;
  };
}, [user]);



  useEffect(() => {
  if (reloadFaisabilite) {
    reloadFaisabilite(); // 🔁 Recharge l'analyse au chargement
  }
}, [reloadFaisabilite]);

  



  const handleSaveBien = async (bien) => {
  const updated = { ...formData, bienImmobilier: bien };
  setFormData(updated);
  relancerSkeletons();
  setModalBienOpen(false);
  setToastOpen(true);

  // ✅ Mise à jour dans Firestore avec horodatage
  if (user?.uid) {
    const ref = doc(db, "dossiers", user.uid);
    await updateDoc(ref, {
      immobilier: bien,
      lastModificationAt: new Date().toISOString(),
    });
  }
};


  const handleSaveFonds = async (fonds) => {
  const currentList = Array.isArray(formData.fondsPropres) ? [...formData.fondsPropres] : [];
  if (editingFondsIndex !== null) {
    currentList[editingFondsIndex] = fonds;
  } else {
    currentList.push(fonds);
  }

  const updated = { ...formData, fondsPropres: currentList };
  setFormData(updated);
  relancerSkeletons()
  setModalFondsOpen(false);
  setEditingFondsIndex(null);
  setToastOpen(true);

  // ✅ Mise à jour Firestore avec horodatage
  if (user?.uid) {
    const ref = doc(db, "dossiers", user.uid);
    await updateDoc(ref, {
      fondsPropres: currentList,
      lastModificationAt: new Date().toISOString(),
    });
  }
};

  

  const handleDeleteFonds = async (index) => {
  const currentList = [...formData.fondsPropres];
  currentList.splice(index, 1);

  const updated = { ...formData, fondsPropres: currentList };
  setFormData(updated);
  setToastOpen(true);

  // ✅ Mise à jour Firestore avec horodatage
  if (user?.uid) {
    const ref = doc(db, "dossiers", user.uid);
    await updateDoc(ref, {
      fondsPropres: currentList,
      lastModificationAt: new Date().toISOString(),
    });
  }
};

  

  const handleDeleteBien = () => {
    const updated = { ...formData };
    delete updated.bienImmobilier;
    setFormData(updated);
    setToastOpen(true);
  };

  const fondsList = Array.isArray(formData.fondsPropres) ? formData.fondsPropres : [];
  const totalFonds = fondsList.reduce((acc, item) => acc + Number(item.montant || 0), 0);
  const totalFondsAffiche = totalFonds.toLocaleString("fr-CH").replace(/\s/g, "’");
  const [modalFaisabiliteOpen, setModalFaisabiliteOpen] = useState(false);

  const [loadingRecalcul, setLoadingRecalcul] = useState(false);

  const relancerSkeletons = () => {
  setLoading(true);
  setTimeout(() => {
    setLoading(false);
  }, 600); // Durée visible de l'animation
};


const handleRecalculerFaisabilite = async () => {
  if (!user) return;
  setLoadingRecalcul(true);
  await estimerValeurBienAvecOpenAI(formData, user, async () => {
    const ref = doc(db, "dossiers", user.uid);
    const snap = await getDoc(ref);
    const data = snap.data();
    if (data?.resultatsFaisabilite) {
      setResultatsFaisabilite(data.resultatsFaisabilite);
    }
    setLoadingRecalcul(false);
    setToastOpen(true);
  });
};

const [loading, setLoading] = useState(true);




  return (
    <Box>
      <Typography variant="h5" mb={4}>
        Financement
      </Typography>


      <Paper sx={{ p: 3, mb: 3, backgroundColor: theme.palette.background.default, border: `1px solid ${theme.palette.divider}` }}>
        <Typography variant="subtitle1" fontWeight={600} gutterBottom>
          Bien immobilier
        </Typography>

        {loading ? (
  <Box
    sx={{
      border: `1px solid ${theme.palette.divider}`,
      borderRadius: 1,
      p: 2,
      mb: 2,
      backgroundColor: "white",
    }}
  >
    <Box display="flex" gap={2}>
      <CustomSkeleton variant="circular" width={40} height={40} />
      <Box flex={1}>
        <CustomSkeleton width="60%" height={24} />
        <CustomSkeleton width="30%" height={20} sx={{ mt: 1 }} />
        <Box mt={2} display="flex" flexDirection="column" gap={1}>
          {[...Array(5)].map((_, i) => (
            <CustomSkeleton key={i} width="80%" height={18} />
          ))}
        </Box>
      </Box>
    </Box>
  </Box>
) : formData?.bienImmobilier ? (

          <Box
            sx={{
              border: `1px solid ${theme.palette.divider}`,
              borderRadius: 1,
              p: 2,
              mb: 2,
              backgroundColor: "white",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <Box display="flex" gap={2}>
  <MapsHomeWorkIcon sx={{ color: theme.palette.text.secondary }} />
  <Box>
    <Typography fontWeight={600}>{formData.bienImmobilier.adresseComplete}, {formData.bienImmobilier.npaLocalite}</Typography>
    <Typography color="text.secondary">
      CHF {Number(formData.bienImmobilier.valeur).toLocaleString("fr-CH").replace(/\s/g, "’")}
    </Typography>
    <Box mt={1} display="flex" flexDirection="column" gap={0.5}>
                  <Typography variant="body2" color="text.secondary" display="flex" alignItems="center" gap={1}>
                    <LocationOnIcon fontSize="small" /> {formData.bienImmobilier.npaLocalite}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" display="flex" alignItems="center" gap={1}>
                    <HomeWorkIcon fontSize="small" /> {formData.bienImmobilier.type}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" display="flex" alignItems="center" gap={1}>
                    <StraightenIcon fontSize="small" /> {formData.bienImmobilier.surfaceHabitable} m²
                  </Typography>
                  <Typography variant="body2" color="text.secondary" display="flex" alignItems="center" gap={1}>
                    <MeetingRoomIcon fontSize="small" /> {formData.bienImmobilier.nbPieces} pièces
                  </Typography>
                  <Typography variant="body2" color="text.secondary" display="flex" alignItems="center" gap={1}>
                    <CalendarMonthIcon fontSize="small" /> {formData.bienImmobilier.anneeConstruction}
                  </Typography>
                </Box>
  </Box>
</Box>

            <Box>
              <IconButton onClick={() => setModalBienOpen(true)}>
                <EditIcon fontSize="small" />
              </IconButton>
              <IconButton onClick={() => setConfirmDeleteOpen(true)}>
                <DeleteIcon fontSize="small" />
              </IconButton>

            </Box>
          </Box>
        ) : (
            <Box
  sx={{
    border: `1px dashed ${theme.palette.divider}`,
    borderRadius: 2,
    backgroundColor: theme.palette.background.default,
    p: 3,
  }}
>
  <Typography color="text.secondary" mb={2}>
    Il n’y a aucun bien immobilier pour le moment. Ajouter un bien pour continuer
  </Typography>
  <Button
    variant="contained"
    color="secondary"
    onClick={() => setModalBienOpen(true)}
  >
    AJOUTER BIEN IMMOBILIER
  </Button>
</Box>

        )}
      </Paper>

      {formData?.bienImmobilier && (
        <Paper sx={{ p: 3, backgroundColor: theme.palette.background.default, border: `1px solid ${theme.palette.divider}` }}>
        <Typography variant="subtitle1" fontWeight={600} gutterBottom>
            Fonds propres {totalFonds > 0 && `(total ${totalFondsAffiche})`}
        </Typography>


          {fondsList.length === 0 && (
            <Box
              sx={{
                border: `1px dashed ${theme.palette.divider}`,
                borderRadius: 2,
                backgroundColor: theme.palette.background.default,
                p: 3,
                textAlign: "center",
              }}
            >
              <Typography color="text.secondary" mb={2}>
                Il n’y a pas de fonds propres pour le moment. Ajouter des fonds propres pour continuer
              </Typography>
            </Box>
          )}


          {loading && (
  <Box mt={2}>
    {[...Array(2)].map((_, i) => (
      <Box key={i} mb={2}>
        <CustomSkeleton width="40%" height={22} sx={{ mb: 1 }} />
        <List>
          {[...Array(2)].map((_, j) => (
            <ListItem
              key={j}
              sx={{
                backgroundColor: "white",
                borderRadius: 1,
                mb: 1,
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                px: 2,
                py: 1,
              }}
            >
              <Box display="flex" alignItems="center" gap={2}>
                <CustomSkeleton variant="circular" width={24} height={24} />
                <CustomSkeleton width="200px" height={18} />
              </Box>
              <Box display="flex" gap={1}>
                <CustomSkeleton width={24} height={24} variant="circular" />
                <CustomSkeleton width={24} height={24} variant="circular" />
              </Box>
            </ListItem>
          ))}
        </List>
      </Box>
    ))}
  </Box>
)}


{!loading && formData.personnes?.map((personne, pIndex) => {
  const fondsPersonne = fondsList.filter((f) => f.personneId === (personne.id || pIndex));
  if (fondsPersonne.length === 0) return null;

  return (
    <Box key={pIndex} mb={2}>
      <Typography variant="subtitle2" fontWeight={600} gutterBottom>
        {personne.prenom} {personne.nom}
      </Typography>
      <List>
        {fondsPersonne.map((fonds, index) => {
          const is3aBanque = fonds.type === "3e pilier" && fonds.origine === "banque";
          const is3aAssurance = fonds.type === "3e pilier" && fonds.origine === "assurance";
          const is2ePilier = fonds.type === "2e pilier";
          const Icon = is3aAssurance || is2ePilier ? AssuredWorkloadIcon : AccountBalanceIcon;

          const institutionLabel = fonds.institution === "Autre" ? fonds.institutionAutre : fonds.institution;
          const montantFormaté = Number(fonds.montant).toLocaleString("fr-CH").replace(/\s/g, "’");

          const globalIndex = fondsList.findIndex((f) => f === fonds);

          return (
            <ListItem
              key={index}
              sx={{
                backgroundColor: "white",
                borderRadius: 1,
                mb: 1,
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
              secondaryAction={
                <>
                  <IconButton onClick={() => {
                    setEditingFondsIndex(globalIndex);
                    setModalFondsOpen(true);
                  }}>
                    <EditIcon fontSize="small" />
                  </IconButton>
                  <IconButton onClick={() => handleDeleteFonds(globalIndex)}>
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                </>
              }
            >
              <Box display="flex" alignItems="center" gap={2}>
                <Icon sx={{ color: "text.secondary" }} />
                <Typography>
                  {fonds.type}
                  {fonds.origine ? ` (${fonds.origine})` : ""}
                  {institutionLabel ? `, ${institutionLabel}` : ""}
                  {fonds.montant ? `, CHF ${montantFormaté}` : ""}
                </Typography>
              </Box>
            </ListItem>
          );
        })}
      </List>
    </Box>
  );
})}



<Box mt={2}>
  <Button
    variant="contained"
    color="secondary"
    onClick={() => {
      setEditingFondsIndex(null);
      setModalFondsOpen(true);
    }}
  >
    AJOUTER DES FONDS PROPRES
  </Button>
</Box>





        </Paper>

        
      )}


      <ModalBienImmobilier
        open={modalBienOpen}
        onClose={() => setModalBienOpen(false)}
        onSave={handleSaveBien}
        initialData={modalBienOpen ? formData?.bienImmobilier || null : null}
        user={user}
      />


      <ModalFondsPropres
      open={modalFondsOpen}
      onClose={() => setModalFondsOpen(false)}
      onSave={handleSaveFonds}
      initialData={editingFondsIndex !== null ? fondsList[editingFondsIndex] : null}
      personnes={formData?.personnes || []} 
    />


      <Snackbar
        open={toastOpen}
        autoHideDuration={3000}
        onClose={() => setToastOpen(false)}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert onClose={() => setToastOpen(false)} severity="success" sx={{ width: "100%" }}>
          Enregistré avec succès.
        </Alert>
      </Snackbar>

      <Dialog open={confirmDeleteOpen} onClose={() => setConfirmDeleteOpen(false)}>
  <DialogTitle>Supprimer le bien immobilier</DialogTitle>
  <DialogContent>
    <Typography>Es-tu sûr de vouloir supprimer ce bien ?</Typography>
  </DialogContent>
  <DialogActions>
    <Button onClick={() => setConfirmDeleteOpen(false)}>Annuler</Button>
    <Button
      onClick={async () => {
  const updated = { ...formData };
  delete updated.bienImmobilier;
  updated.fondsPropres = []; // ✅ On supprime aussi les fonds propres
  setFormData(updated);
  setConfirmDeleteOpen(false);
  setToastOpen(true);

  // ✅ Mise à jour Firestore (pas besoin d'horodatage ici)
  if (user?.uid) {
    const ref = doc(db, "dossiers", user.uid);
    await updateDoc(ref, {
      immobilier: null,
      fondsPropres: [],
    });
  }
}}

      color="error"
      variant="contained"
    >
      Supprimer
    </Button>
  </DialogActions>
</Dialog>



    </Box>
  );
};

export default NouvelleEtape3Financement;
