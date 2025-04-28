// src/components/DemandesEnCours.js

import React, { useEffect, useState } from "react";
import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "../firebase-config";
import { useAuth } from "../AuthContext";
import {
  Box,
  Typography,
  Paper,
  CircularProgress,
  Button
} from "@mui/material";
import { Link } from "react-router-dom";

const DemandesEnCours = () => {
  const { user } = useAuth();
  const [demandes, setDemandes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDemandes = async () => {
      if (!user) return;

      const q = query(collection(db, "dossiers"), where("userId", "==", user.uid));
      const snapshot = await getDocs(q);
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

      setDemandes(data);
      setLoading(false);
    };

    fetchDemandes();
  }, [user]);

  if (loading) {
    return <CircularProgress />;
  }

  return (
    <Box>
      <Typography variant="h5" mb={4}>
        Mes demandes en cours
      </Typography>

      {demandes.length === 0 ? (
        <Typography>Aucune demande pour le moment.</Typography>
      ) : (
        demandes.map((dossier) => (
          <Paper key={dossier.id} sx={{ p: 2, mb: 2 }}>
            <Typography fontWeight={600}>Dossier #{dossier.id}</Typography>
            <Typography>Produit : {dossier.produit || "Non précisé"}</Typography>
            <Typography>Date de création : {dossier.dateCreation?.slice(0, 10) || "-"}</Typography>
            <Box mt={2}>
              <Button
                component={Link}
                to={`/formulaire?id=${dossier.id}`}
                variant="outlined"
              >
                Voir / Continuer
              </Button>
            </Box>
          </Paper>
        ))
      )}
    </Box>
  );
};

export default DemandesEnCours;
