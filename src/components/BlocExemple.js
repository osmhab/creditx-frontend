import React from "react";
import { Box } from "@mui/material";

/**
 * BlocExemple — composant utilitaire pour afficher
 * des exemples ou notes techniques dans un encadré gris clair.
 *
 * Props:
 * - children: contenu JSX ou texte à afficher
 */
export default function BlocExemple({ children }) {
  return (
    <Box
      sx={{
        fontSize: "0.8rem",
        lineHeight: 1.4,
        backgroundColor: "#f9fafb",
        border: "1px solid #e5e7eb",
        borderRadius: "8px",
        padding: "10px 12px",
        color: "#4b5563",
        textAlign: "left",
        mb: 2,
      }}
    >
      {children}
    </Box>
  );
}
