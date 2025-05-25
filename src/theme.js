import { createTheme } from "@mui/material/styles";

const theme = createTheme({
  palette: {
    primary: {
      main: "#000000", // Noir
      contrastText: "#FFFFFF",
    },
    secondary: {
      main: "#001BFF", // Bleu accent
      dark: "#0010b3",
      contrastText: "#FFFFFF",
    },
    error: {
      main: "#D32F2F",
      contrastText: "#FFFFFF",
    },
    success: {
      main: "#4CAF50",
      dark: "#388E3C",
      contrastText: "#FFFFFF",
    },
    background: {
      default: "#f0f0f0",
    },
    divider: "#CCCCCC",
  },

  components: {
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          borderRadius: 0,
          '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
            borderColor: "#000000",
          },
          '&:hover .MuiOutlinedInput-notchedOutline': {
            borderColor: "#000000",
          },
        },
      },
    },

    MuiToggleButtonGroup: {
      styleOverrides: {
        root: {
          backgroundColor: "#ECEFF1", // fond du groupe
          borderRadius: 6,
          padding: 2,
        },
      },
    },
    MuiToggleButton: {
      styleOverrides: {
        root: {
          border: "none",
          borderRadius: 6,
          fontWeight: 500,
          color: "#888",
          backgroundColor: "transparent",
          '&.Mui-selected': {
            backgroundColor: "#fff",
            color: "#000",
            boxShadow: "0px 1px 2px rgba(0,0,0,0.05)",
          },
          '&:not(.Mui-selected):hover': {
            backgroundColor: "#f5f5f5",
          },
        },
      },
    },

    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 0,
          paddingTop: "14px",
          paddingBottom: "14px",
          paddingLeft: "24px",
          paddingRight: "24px",
          fontSize: "1rem",
          fontWeight: 500,
          textTransform: "none",
        },
        containedPrimary: {
          backgroundColor: "#000000",
          '&:hover': {
            backgroundColor: "#333333",
          },
          color: "#FFFFFF",
        },
        outlinedPrimary: {
          borderColor: "#000000",
          color: "#000000",
          '&:hover': {
            backgroundColor: "#f0f0f0",
            borderColor: "#333333",
          },
        },
      },
    },

    MuiCheckbox: {
      styleOverrides: {
        root: {
          color: "#000000",
          '&.Mui-checked': {
            color: "#000000",
          },
        },
      },
    },
    MuiRadio: {
      styleOverrides: {
        root: {
          color: "#000000",
          '&.Mui-checked': {
            color: "#000000",
          },
        },
      },
    },
    MuiSwitch: {
      styleOverrides: {
        switchBase: {
          color: "#000000",
          '&.Mui-checked': {
        color: "#001BFF", // secondary.main
      },
      '&.Mui-checked + .MuiSwitch-track': {
        backgroundColor: "#001BFF", // secondary.main
      },
        },
      },
    },
    MuiInputLabel: {
      styleOverrides: {
        root: {
          '&.Mui-focused': {
            color: "#000000",
          },
        },
      },
    },
    MuiSelect: {
      styleOverrides: {
        outlined: {
          borderColor: "#000000",
        },
      },
    },
    MuiTooltip: {
      styleOverrides: {
        tooltip: {
          fontSize: "0.95rem",
          maxWidth: 280,
          padding: "12px 16px",
          backgroundColor: "#333333",
          color: "#FFFFFF",
          borderRadius: 0,
        },
        arrow: {
          color: "#333333",
        },
      },
    },
    MuiStepConnector: {
      styleOverrides: {
        line: {
          borderColor: "#001BFF",
        },
      },
    },
    MuiStepIcon: {
      styleOverrides: {
        root: {
          '&.Mui-active': {
            color: "#001BFF",
          },
          '&.Mui-completed': {
            color: "#001BFF",
          },
        },
      },
    },
  },
});

export default theme;
