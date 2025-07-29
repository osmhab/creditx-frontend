// src/pages/TypeDemande.js

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { collection, query, where, orderBy, getDocs, updateDoc } from "firebase/firestore";
import { db, auth } from "../firebase-config";


import {
  Box,
  Typography,
  MenuItem,
  Select,
  Button,
  FormControl,
  InputLabel,
} from "@mui/material";

export default function TypeDemande() {
  const navigate = useNavigate();
  const user = auth.currentUser;
  const [typeDemande, setTypeDemande] = useState("");

  

  useEffect(() => {
  const fetchTypeDemande = async () => {
    if (!user) return;

    const q = query(
      collection(db, "demandes"),
      where("uid", "==", user.uid),
      orderBy("dateCreation", "desc")
    );

    const snapshot = await getDocs(q);
    if (!snapshot.empty) {
      const data = snapshot.docs[0].data();
      if (data?.typeDemande) {
        setTypeDemande(data.typeDemande);
      }
    }
  };

  fetchTypeDemande();
}, [user]);




  const handleSubmit = async () => {
  if (!typeDemande || !user) return;

  // Trouver la demande en cours dans Firestore pour cet utilisateur
  const q = query(
    collection(db, "demandes"),
    where("uid", "==", user.uid),
    orderBy("dateCreation", "desc")
  );

  const querySnapshot = await getDocs(q);

  if (!querySnapshot.empty) {
    const demandeRef = querySnapshot.docs[0].ref;

    await updateDoc(demandeRef, {
      typeDemande: typeDemande,
      etatTypeDemande: "Complété", // tu peux ajouter ça si tu veux
    });

    navigate("/dashboard"); // ou le chemin vers ton dashboard
  } else {
    console.error("Aucune demande trouvée pour cet utilisateur.");
  }
};


  return (
    <Box
      display="flex"
      flexDirection="column"
      alignItems="center"
      justifyContent="center"
      minHeight="100vh"
      px={2}
    >
      <Typography variant="h4" fontWeight="bold" mb={1}>
        Demande
      </Typography>
      <Typography mb={3}>
        Veuillez sélectionner le type de demande approprié.
      </Typography>

      <FormControl fullWidth sx={{ maxWidth: 400, mb: 4 }}>
        <InputLabel id="type-demande-label">Type de demande</InputLabel>
        <Select
          labelId="type-demande-label"
          value={typeDemande}
          label="Type de demande"
          onChange={(e) => setTypeDemande(e.target.value)}
        >
          <MenuItem value="Achat d’un bien existant">Achat d’un bien existant</MenuItem>
          <MenuItem value="Achat d’un bien à construire">Achat d’un bien à construire</MenuItem>
          <MenuItem value="Reprise d’un credit existant">Reprise d’un crédit existant</MenuItem>
        </Select>
      </FormControl>

      <Button
  variant="contained"
  sx={{
    borderRadius: 100,
    px: 5,
    py: 1.5,
    backgroundColor: "black",
    color: "white",
    "&:hover": {
      backgroundColor: "#111", // un noir un peu plus clair au survol
    },
  }}
  disabled={!typeDemande}
  onClick={handleSubmit}
>
  Continuer
</Button>

    </Box>
  );
}
