import React, { useState } from "react";
import {
  Container,
  TextField,
  Checkbox,
  FormControlLabel,
  Button,
  Typography,
  Box,
  Alert,
  CircularProgress,
} from "@mui/material";
import PrimaryButton from "./components/ui/PrimaryButton";

function CreditSimulation() {
  const [prixAchat, setPrixAchat] = useState(0);
  const [fondsPropres, setFondsPropres] = useState(0);
  const [utilise2ePillier, setUtilise2ePillier] = useState(false);
  const [fondsPropres2ePillier, setFondsPropres2ePillier] = useState(0);
  const [revenuAnnuel, setRevenuAnnuel] = useState(0);
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState(""); // "success" | "error"
  const [loading, setLoading] = useState(false); // 🔄 Loader

  const fondsDur = utilise2ePillier ? fondsPropres - fondsPropres2ePillier : fondsPropres;

  const handleSimulation = () => {
    setLoading(true);
    setMessage("");
    setStatus("");

    // Simuler un délai (comme une API)
    setTimeout(() => {
      const totalFondsPropres = fondsPropres;
      const minimumDur = prixAchat * 0.1;
      const minimumTotal = prixAchat * 0.2;

      const montantÀFinancer = prixAchat - totalFondsPropres;
      const chargesAnnuelles = montantÀFinancer * 0.05;
      const chargeMaximale = revenuAnnuel * 0.33;

      if (fondsDur < minimumDur) {
        setMessage("Il faut au moins 10% de fonds propres en dur.");
        setStatus("error");
      } else if (totalFondsPropres < minimumTotal) {
        setMessage("Les fonds propres totaux doivent représenter au moins 20% du prix d'achat.");
        setStatus("error");
      } else if (chargesAnnuelles > chargeMaximale) {
        setMessage(
          `Charge annuelle estimée CHF ${chargesAnnuelles.toLocaleString()} trop élevée par rapport au revenu. Max autorisé CHF ${chargeMaximale.toLocaleString()}`
        );
        setStatus("error");
      } else {
        setMessage("Le dossier respecte les exigences de fonds propres et de capacité financière.");
        setStatus("success");
      }

      setLoading(false); // stop spinner
    }, 1000); // 1 seconde de délai simulé
  };

  return (
    <Container maxWidth="sm" sx={{ mt: 4 }}>
      <Typography variant="h5" fontWeight="bold" gutterBottom>
        Simulation de crédit
      </Typography>

      <TextField
        label="Prix d'achat (CHF)"
        type="number"
        value={prixAchat}
        onChange={(e) => setPrixAchat(parseFloat(e.target.value))}
        fullWidth
        margin="normal"
      />

      <TextField
        label="Fonds propres totaux (CHF)"
        type="number"
        value={fondsPropres}
        onChange={(e) => setFondsPropres(parseFloat(e.target.value))}
        fullWidth
        margin="normal"
      />

      <FormControlLabel
        control={
          <Checkbox
            checked={utilise2ePillier}
            onChange={(e) => setUtilise2ePillier(e.target.checked)}
          />
        }
        label="J'utilise des fonds provenant de mon 2e pilier"
        sx={{ mt: 1 }}
      />

      {utilise2ePillier && (
        <TextField
          label="Montant provenant du 2e pilier (CHF)"
          type="number"
          value={fondsPropres2ePillier}
          onChange={(e) => setFondsPropres2ePillier(parseFloat(e.target.value))}
          fullWidth
          margin="normal"
        />
      )}

      <TextField
        label="Revenu annuel brut (CHF)"
        type="number"
        value={revenuAnnuel}
        onChange={(e) => setRevenuAnnuel(parseFloat(e.target.value))}
        fullWidth
        margin="normal"
      />

      <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
        💡 Fonds propres en dur estimés : <strong>CHF {fondsDur.toLocaleString()}</strong>
      </Typography>

      <Box sx={{ mt: 3 }}>
        <PrimaryButton
          variant="contained"
          fullWidth
          onClick={handleSimulation}
          disabled={loading}
        >
          {loading ? <CircularProgress size={24} color="inherit" /> : "Lancer la simulation"}
        </PrimaryButton>
      </Box>

      {message && (
        <Alert severity={status === "success" ? "success" : "error"} sx={{ mt: 3 }}>
          {message}
        </Alert>
      )}
    </Container>
  );
}

export default CreditSimulation;
