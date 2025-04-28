import { createTheme } from "@mui/material/styles";

const theme = createTheme({
  palette: {
    primary: {
      main: "#001BFF",
      contrastText: "#fff",
    },
    secondary: {
      main: "#6C757D",
      contrastText: "#fff",
    },
    error: {
      main: "#D32F2F",
      contrastText: "#fff",
    },
  },
  components: {
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          borderRadius: 0,
          '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
            borderColor: "#001BFF",
          },
          '&:hover .MuiOutlinedInput-notchedOutline': {
            borderColor: "#001BFF",
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
          backgroundColor: "#001BFF",
          '&:hover': {
            backgroundColor: "#0010b3",
          },
          color: "#fff",
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
    MuiInputLabel: {
      styleOverrides: {
        root: {
          '&.Mui-focused': {
            color: "#001BFF",
          },
        },
      },
    },
    MuiSelect: {
      styleOverrides: {
        outlined: {
          borderColor: "#001BFF",
        },
      },
    },
    MuiTooltip: {
      styleOverrides: {
        tooltip: {
          fontSize: "0.95rem",
          maxWidth: 280,
          padding: "12px 16px",
          backgroundColor: "#333",
          color: "#fff",
          borderRadius: 8,
        },
        arrow: {
          color: "#333",
        },
      },
    },
    MuiStepConnector: {
      styleOverrides: {
        line: {
          borderColor: "#FF5C02",
        },
      },
    },
    MuiStepIcon: {
      styleOverrides: {
        root: {
          '&.Mui-active': {
            color: "#FF5C02",
          },
          '&.Mui-completed': {
            color: "#FF5C02",
          },
        },
      },
    },
    outlinedPrimary: {
      borderColor: "#001BFF",
      color: "#001BFF",
      '&:hover': {
        backgroundColor: "#f0f4ff",
        borderColor: "#0010b3",
      },
    },
  },
});

export default theme;
