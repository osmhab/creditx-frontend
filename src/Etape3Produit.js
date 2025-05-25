import React from "react";
import { Box, Typography, Grid, Paper, Chip } from "@mui/material";
import HouseIcon from "@mui/icons-material/Home";

const produits = [
  {
    id: "achat",
    titre: "Achat (Résidence principale)",
    description: ["Crédit pour l’achat d’un logement à usage propre."],
  },
  {
    id: "construction",
    titre: "Construction",
    description: ["Financement pour un projet de construction."],
  },
  {
    id: "renovation",
    titre: "Rénovation",
    description: ["Prêt pour des travaux de rénovation."],
  },
  {
    id: "rachat",
    titre: "Rachat hypothécaire",
    description: ["Transfert de votre hypothèque existante."],
  },
];

const Etape3Produit = ({ selectedProduit, onSelectProduit }) => {
  return (
    <Box sx={{ mt: 6 }}>
      <Typography variant="h5" fontWeight="bold" mb={4} textAlign="center">
        Quel est votre projet ?
      </Typography>

      <Grid container spacing={4} justifyContent="center">
        {produits.map((produit) => {
          const estDisponible = produit.id === "achat";
          const estSelectionne = selectedProduit === produit.id;

          return (
            <Grid item xs={12} sm={6} md={3} key={produit.id}>
              <Box
                position="relative"
                sx={{
                  "&:hover .badge-disponible": {
                    opacity: estDisponible ? 0 : 1,
                    transform: "translateY(0)",
                  },
                }}
              >
                <Paper
                  elevation={3}
                  onClick={() => estDisponible && onSelectProduit(produit.id)}
                  sx={{
                    backgroundColor: estDisponible ? "#002BFF" : "#f0f0f0",
                    color: estDisponible ? "#fff" : "#999",
                    borderRadius: 2,
                    p: 3,
                    cursor: estDisponible ? "pointer" : "default",
                    minHeight: 180,
                    transition: "transform 0.3s ease, background-color 0.3s ease",
                    transform: estSelectionne ? "scale(1.02)" : "none",
                    "&:hover": estDisponible
                        ? {
                            transform: "scale(1.02)",
                            backgroundColor: "#001ACC", // bleu plus foncé au hover
                        }
                        : {},
                    }}

                >
                  <Box display="flex" alignItems="center" mb={2}>
                    <HouseIcon sx={{ mr: 1 }} />
                    <Typography
                      variant="h6"
                      fontWeight="bold"
                      color={estDisponible ? "#fff" : "#333"}
                    >
                      {produit.titre}
                    </Typography>
                  </Box>

                  {produit.description.map((line, i) => (
                    <Typography
                      key={i}
                      variant="body2"
                      color={estDisponible ? "#fff" : "#555"}
                    >
                      {line}
                    </Typography>
                  ))}
                </Paper>

                {!estDisponible && (
                  <Chip
                    label="Bientôt disponible"
                    size="small"
                    className="badge-disponible"
                    sx={{
                      position: "absolute",
                      top: 12,
                      right: 12,
                      opacity: 0,
                      transform: "translateY(-6px)",
                      transition: "opacity 0.3s ease, transform 0.3s ease",
                      backgroundColor: "#ffecb3",
                      color: "#000",
                      fontWeight: "bold",
                    }}
                  />
                )}
              </Box>
            </Grid>
          );
        })}
      </Grid>
    </Box>
  );
};

export default Etape3Produit;
