// src/theme.js
import { createTheme } from "@mui/material/styles";

const theme = createTheme({
  components: {
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          borderRadius: 0,
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 0,           // ✅ bords droits
          paddingTop: "14px",        // ✅ hauteur personnalisée
          paddingBottom: "14px",
          paddingLeft: "24px",       // ✅ largeur cohérente
          paddingRight: "24px",
          fontSize: "1rem",          // ✅ texte lisible
          fontWeight: 500,
          textTransform: "none",     // ✅ garde les majuscules naturelles
        },
        containedPrimary: {
          backgroundColor: "#001BFF",
          '&:hover': {
            backgroundColor: "#0010b3",
          },
          color: "#fff",
        },
      },
    },
  },
});

export default theme;
