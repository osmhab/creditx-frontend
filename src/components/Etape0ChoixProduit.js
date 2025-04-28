// Etape0ChoixProduit.js
import React from "react";
import { Box, Typography, Grid, Paper } from "@mui/material";
import HouseIcon from "@mui/icons-material/Home";

const options = [
  {
    title: "Prêt hypothécaire",
    description: [
      "Logement principal",
      "Immeuble de rendement",
      "Reprise d’un crédit existant",
    ],
    value: "hypothecaire",
  },
  {
    title: "Crédit privé",
    description: [
      "Nouveau crédit à la consommation",
      "Reprise d’un crédit existant",
    ],
    value: "prive",
  },
];

const Etape0ChoixProduit = ({ onSelect }) => {
  return (
    <Box sx={{ textAlign: "center", mt: 6 }}>
      <Typography variant="h4" fontWeight="bold" mb={2}>
        Demande d’offres
      </Typography>
      <Typography variant="subtitle1" mb={6}>
        Choisissez parmi les catégories suivantes :
      </Typography>

      <Grid container spacing={4} justifyContent="center">
        {options.map((option, index) => (
          <Grid item xs={12} sm={6} md={4} key={index}>
            <Paper
              elevation={3}
              onClick={() => onSelect(option.value)}
              sx={{
                backgroundColor: "#002BFF",
                color: "#fff",
                borderRadius: 2,
                p: 3,
                cursor: "pointer",
                transition: "0.3s",
                "&:hover": {
                  transform: "scale(1.02)",
                },
              }}
            >
              <Box display="flex" alignItems="center" mb={2}>
                <HouseIcon sx={{ mr: 1 }} />
                <Typography variant="h6" fontWeight="bold">
                  {option.title}
                </Typography>
              </Box>
              {option.description.map((line, i) => (
                <Typography key={i} variant="body2">
                  {line}
                </Typography>
              ))}
            </Paper>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
};

export default Etape0ChoixProduit;
