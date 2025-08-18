
import { createTheme } from "@mui/material/styles";

const theme = createTheme({
  palette: {
  primary: {
    main: "#001BFF", // Bleu CreditX
    contrastText: "#FFFFFF",
  },
  secondary: {
    main: "#001BFF",
    contrastText: "#FFFFFF",
  },
  success: {
    main: "#001BFF",
    contrastText: "#FFFFFF",
  },
  error: {
    main: "#FF5A5F",
    contrastText: "#FFFFFF",
  },
  background: {
    default: "#FFFFFF",
    paper: "#FFFFFF",
  },
  text: {
    primary: "#111111",
    secondary: "#444444",
  },
  divider: "#E0E0E0",
},


  typography: {
    fontFamily: "Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif",
    fontSize: 14,
    fontWeightRegular: 400,
    fontWeightMedium: 500,
    fontWeightBold: 700,
  },

  shape: {
    borderRadius: 8,
  },

  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          padding: "12px 20px",
          fontSize: "1rem",
          fontWeight: 500,
          textTransform: "none",
        },
        containedPrimary: {
          backgroundColor: "#001BFF",
          '&:hover': {
            backgroundColor: "#0052cc",
          },
        },
        outlinedPrimary: {
          borderColor: "#001BFF",
          color: "#001BFF",
          '&:hover': {
            backgroundColor: "#F0F7FF",
            borderColor: "#0052cc",
          },
        },
      },
    },

    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
            borderColor: "#001BFF",
          },
          '&:hover .MuiOutlinedInput-notchedOutline': {
            borderColor: "#001BFF",
          },
        },
      },
    },

    MuiInputLabel: {
      styleOverrides: {
        root: {
          '&.Mui-focused': {
            color: "#001BFF",
          },
        },
      },
    },

    MuiCheckbox: {
      styleOverrides: {
        root: {
          color: "#001BFF",
          '&.Mui-checked': {
            color: "#001BFF",
          },
        },
      },
    },

    MuiRadio: {
      styleOverrides: {
        root: {
          color: "#001BFF",
          '&.Mui-checked': {
            color: "#001BFF",
          },
        },
      },
    },

    MuiSwitch: {
      styleOverrides: {
        switchBase: {
          color: "#001BFF",
          '&.Mui-checked': {
            color: "#001BFF",
          },
          '&.Mui-checked + .MuiSwitch-track': {
            backgroundColor: "#001BFF",
          },
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
          borderRadius: 8,
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

    MuiToggleButton: {
      styleOverrides: {
        root: {
          border: "none",
          borderRadius: 8,
          fontWeight: 500,
          color: "#444",
          '&.Mui-selected': {
            backgroundColor: "#E3F2FD",
            color: "#001BFF",
            boxShadow: "0px 1px 2px rgba(0,0,0,0.05)",
          },
          '&:not(.Mui-selected):hover': {
            backgroundColor: "#F5F5F5",
          },
        },
      },
    },

    MuiToggleButtonGroup: {
      styleOverrides: {
        root: {
          backgroundColor: "#F1F3F5",
          borderRadius: 8,
          padding: 4,
        },
      },
    },
  },
});

export default theme;
