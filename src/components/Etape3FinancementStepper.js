// Etape3FinancementStepper.js
import React, { useState } from "react";
import {
    Alert,
    Box,
    Grid,
    Stepper,
    Step,
    StepLabel,
    Button,
    Typography,
    FormControlLabel,
    Checkbox
    } from "@mui/material";

import GraphFaisabilite from "./GraphFaisabilite";

import { TextField, InputAdornment, Divider } from "@mui/material";


const steps = ["Prix du bien", "Fonds propres", "Faisabilité"];

const Etape3FinancementStepper = ({ formData }) => {

  const [activeStep, setActiveStep] = useState(0);

const [prixAchat, setPrixAchat] = useState("");
const [fraisSupp, setFraisSupp] = useState("");
const [utiliseAvoirs, setUtiliseAvoirs] = useState(false);
const [montantAvoirs, setMontantAvoirs] = useState("");

const [utilise3e, setUtilise3e] = useState(false);
const [montant3e, setMontant3e] = useState("");

const [utilise2e, setUtilise2e] = useState(false);
const [montant2e, setMontant2e] = useState("");

const [resultats, setResultats] = useState(null);
const [calculEnCours, setCalculEnCours] = useState(false);

const [detailsRevenus, setDetailsRevenus] = useState([]);

const [revenuAnnuel, setRevenuAnnuel] = useState(0);

const [chargesFixes, setChargesFixes] = useState(0);

const [chargeHypo, setChargeHypo] = useState(0);

const [chargeTotale, setChargeTotale] = useState(0);

const [detailsCharges, setDetailsCharges] = useState([]);






const totalInjecte =
  Number(montantAvoirs || 0) +
  Number(utilise3e ? montant3e || 0 : 0) +
  Number(utilise2e ? montant2e || 0 : 0);


const formatCHF = (val) => {
  const digits = val.toString().replace(/\D/g, "");
  return digits ? Number(digits).toLocaleString("fr-CH").replace(/\s/g, "’") : "";
};

const total = Number(prixAchat || 0) + Number(fraisSupp || 0);

const calculerChargesFixes = () => {
    if (!formData || !Array.isArray(formData.personnes)) return 0;
  
    const lignes = [];
  
    const total = formData.personnes.reduce((somme, p, index) => {
      const mensualiteCredits = Number(p.mensualiteCredits || 0);
      const mensualiteLeasing = Number(p.mensualiteLeasing || 0);
      const pension = Number(p.montantPension || 0);
  
      const totalMensuel = mensualiteCredits + mensualiteLeasing + pension;
      const totalAnnuel = totalMensuel * 12;
  
      lignes.push({
        personne: index + 1,
        mensualiteCredits,
        mensualiteLeasing,
        pension,
        totalAnnuel
      });
  
      return somme + totalAnnuel;
    }, 0);
  
    setDetailsCharges(lignes);
    return total;
  };
  
  
  


const calculerRevenuAnnuelTotal = (formData) => {
    const lignes = [];
  
    if (!formData || !Array.isArray(formData.personnes)) return { total: 0, details: [] };
  
    const total = formData.personnes.reduce((somme, personne, pIndex) => {
      if (!Array.isArray(personne.employeurs)) return somme;
  
      const totalPers = personne.employeurs.reduce((totalEmp, emp, eIndex) => {
        const { statutEntreprise, revenusReguliers, revenuMensuel, frequenceMensuelle, revenusIrr = {} } = emp;
  
        let source = "";
        let revenu = 0;
  
        if (statutEntreprise === "indépendant") {
          const annees = ["2024", "2023", "2022"];
          const revenus = annees.map((an) => Number(revenusIrr[`revenuAnnuel${an}`] || 0)).filter((v) => v > 0);
          revenu = revenus.length ? revenus.reduce((a, b) => a + b, 0) / revenus.length : 0;
          source = `Indépendant : moyenne sur ${revenus.length} année(s)`;
        }
  
        else if (revenusReguliers === false) {
            const annees = ["2024", "2023", "2022"];
          
            const revenus = annees
              .map((an) => Number(revenusIrr[`revenuAnnuel${an}`] || 0))
              .filter((v) => v > 0);
            const moyenneRevenu = revenus.length ? revenus.reduce((a, b) => a + b, 0) / revenus.length : 0;
          
            const bonus = annees
              .map((an) => Number(revenusIrr[`bonus${an}`] || 0))
              .filter((v) => v > 0);
            const moyenneBonus = bonus.length ? bonus.reduce((a, b) => a + b, 0) / bonus.length : 0;
            const bonusPondere = moyenneBonus * 0.8;
          
            revenu = moyenneRevenu + bonusPondere;
          
            source = `Salarié irrégulier : ${moyenneRevenu.toFixed(0)} + bonus moyen 80% (${bonusPondere.toFixed(0)})`;
          }
          
  
        else if (revenusReguliers === true) {
          const facteur = frequenceMensuelle === "13x" ? 13 : 12;
          const base = Number(revenuMensuel || 0) * facteur;
  
          const annees = ["2024", "2023", "2022"];
          const bonus = annees.map((an) => Number(revenusIrr[`bonus${an}`] || 0)).filter((v) => v > 0);
          const bonusMoy = bonus.length ? bonus.reduce((a, b) => a + b, 0) / bonus.length : 0;
          const bonusPondere = bonusMoy * 0.8;
  
          revenu = base + bonusPondere;
          source = `Salarié régulier : ${base.toFixed(0)} + bonus moyen 80% (${bonusPondere.toFixed(0)})`;
        }
  
        lignes.push({
          personne: pIndex + 1,
          employeur: eIndex + 1,
          revenu: Math.round(revenu),
          source
        });
  
        return totalEmp + revenu;
      }, 0);
  
      return somme + totalPers;
    }, 0);
  
    return { total: Math.round(total), details: lignes };
  };
  
  



  const calculerFaisabilite = () => {
    setCalculEnCours(true);
  
    setTimeout(() => {
      const { total: revenuAnnuel, details } = calculerRevenuAnnuelTotal(formData);
      setDetailsRevenus(details);
      setRevenuAnnuel(revenuAnnuel);
  
      const montantPret = total - totalInjecte;
  
      const interets = montantPret * 0.05;
const entretien = montantPret * 0.01;
const amortissement = montantPret > prixAchat * 0.66 ? montantPret * 0.01 : 0;

const chargeHypo = interets + entretien + amortissement;
const chargesFixes = calculerChargesFixes();
const chargeTotale = chargeHypo + chargesFixes;




  
      // ✅ C’est ici qu’on met à jour les vrais résultats calculés :
      setChargeHypo(chargeHypo);
      setChargesFixes(chargesFixes);
      setChargeTotale(chargeTotale);
  
      const revenusSuffisants = revenuAnnuel * 0.33 >= chargeTotale;
      const vingtPourcent = totalInjecte >= total * 0.2;
      const dixPourcentDurs = (utilise2e ? totalInjecte - Number(montant2e || 0) : totalInjecte) >= total * 0.1;
  
      setResultats({
        revenusSuffisants,
        vingtPourcent,
        dixPourcentDurs
      });
  
      setCalculEnCours(false);
    }, 800);
  };
  




  


  const handleNext = () => setActiveStep((prev) => prev + 1);
  const handleBack = () => setActiveStep((prev) => prev - 1);

  return (
    <Box>
      <Grid container spacing={4}>
        {/* Stepper vertical */}
        <Grid item xs={12} md={3}>
          <Stepper activeStep={activeStep} orientation="vertical">
            {steps.map((label, index) => (
              <Step key={label}>
                <StepLabel>{label}</StepLabel>
              </Step>
            ))}
          </Stepper>
        </Grid>

{/* Contenu dynamique */}
<Grid item xs={12} md={9}>
  <Box>
    <Typography variant="h6" gutterBottom>
      Étape {activeStep + 1} : {steps[activeStep]}
    </Typography>

    <Box mt={2}>
    {activeStep === 0 && (
  <Box>
    <TextField
      fullWidth
      label="Prix d’achat du bien"
      value={formatCHF(prixAchat)}
      onChange={(e) => setPrixAchat(e.target.value.replace(/\D/g, ""))}
      margin="normal"
      inputMode="numeric"
      InputProps={{
        startAdornment: <InputAdornment position="start">CHF</InputAdornment>,
      }}
    />
    <TextField
      fullWidth
      label="Frais supplémentaires (notaire, agence, etc.)"
      value={formatCHF(fraisSupp)}
      onChange={(e) => setFraisSupp(e.target.value.replace(/\D/g, ""))}
      margin="normal"
      inputMode="numeric"
      InputProps={{
        startAdornment: <InputAdornment position="start">CHF</InputAdornment>,
      }}
    />

    <Divider sx={{ my: 3 }} />

    <Typography variant="subtitle1" fontWeight="bold">
      Coût total estimé : CHF {formatCHF(total)}
    </Typography>
  </Box>
)}


      {activeStep === 1 && (
        <Box>
          <FormControlLabel
            control={
              <Checkbox
                checked={utiliseAvoirs}
                onChange={(e) => setUtiliseAvoirs(e.target.checked)}
              />
            }
            label="J’utilise des avoirs en compte ou titres"
          />

          {utiliseAvoirs && (
            <TextField
              fullWidth
              label="Montant disponible"
              value={formatCHF(montantAvoirs)}
              onChange={(e) => setMontantAvoirs(e.target.value.replace(/\D/g, ""))}
              margin="normal"
              inputMode="numeric"
              InputProps={{
                startAdornment: <InputAdornment position="start">CHF</InputAdornment>,
              }}
            />
          )}

          <FormControlLabel
            control={
              <Checkbox
                checked={utilise3e}
                onChange={(e) => setUtilise3e(e.target.checked)}
              />
            }
            label="J’utilise un versement anticipé du 3e pilier"
          />

          {utilise3e && (
            <TextField
              fullWidth
              label="Montant 3e pilier"
              value={formatCHF(montant3e)}
              onChange={(e) => setMontant3e(e.target.value.replace(/\D/g, ""))}
              margin="normal"
              inputMode="numeric"
              InputProps={{
                startAdornment: <InputAdornment position="start">CHF</InputAdornment>,
              }}
            />
          )}

          <FormControlLabel
            control={
              <Checkbox
                checked={utilise2e}
                onChange={(e) => setUtilise2e(e.target.checked)}
              />
            }
            label="J’utilise un versement anticipé du 2e pilier"
          />

          {utilise2e && (
            <TextField
              fullWidth
              label="Montant 2e pilier"
              value={formatCHF(montant2e)}
              onChange={(e) => setMontant2e(e.target.value.replace(/\D/g, ""))}
              margin="normal"
              inputMode="numeric"
              InputProps={{
                startAdornment: <InputAdornment position="start">CHF</InputAdornment>,
              }}
            />
          )}

          <Divider sx={{ my: 3 }} />

          <Typography variant="subtitle1" fontWeight="bold">
            Total injecté : CHF {formatCHF(totalInjecte)}
          </Typography>
        </Box>
      )}
    </Box>

    {activeStep === 2 && (
  <Box>
    <Typography variant="body1" mb={2}>
      Appuyez sur le bouton ci-dessous pour vérifier la faisabilité du financement.
    </Typography>

    <Button
      variant="contained"
      onClick={calculerFaisabilite}
      disabled={calculEnCours}
    >
      {calculEnCours ? "Calcul en cours..." : "Calculer la faisabilité"}
    </Button>

    {detailsRevenus.length > 0 && (
  <Box mt={4}>
    <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
      Détail des revenus utilisés :
    </Typography>
    {detailsRevenus.map((ligne, i) => (
      <Typography key={i} variant="body2" sx={{ mb: 0.5 }}>
        👤 Personne {ligne.personne}, Employeur {ligne.employeur} : {ligne.revenu.toLocaleString("fr-CH")} CHF ({ligne.source})
      </Typography>
      
    ))}
    <Typography variant="body2" sx={{ mt: 2 }}>
  Charges fixes (dettes, pensions, leasing) : CHF {chargesFixes.toLocaleString("fr-CH")}
</Typography>
<Typography variant="body2">
  Charges hypothécaires simulées : CHF {chargeHypo.toLocaleString("fr-CH")}
</Typography>
<Typography variant="subtitle1" fontWeight="bold">
  Total des charges estimées : CHF {chargeTotale.toLocaleString("fr-CH")}
</Typography>


<GraphFaisabilite charges={chargeTotale} revenuAnnuel={revenuAnnuel} />







    <Divider sx={{ my: 2 }} />
    <Typography variant="subtitle1" fontWeight="bold">
      Total revenu annuel utilisé : CHF {revenuAnnuel.toLocaleString("fr-CH")}
    </Typography>
    {detailsCharges.length > 0 && (
  <Box mt={4}>
    <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
      Détail des charges fixes :
    </Typography>
    {detailsCharges.map((ligne, i) => (
      <Typography key={i} variant="body2" sx={{ mb: 0.5 }}>
        👤 Personne {ligne.personne} :
        Crédit {ligne.mensualiteCredits} CHF/mois, Leasing {ligne.mensualiteLeasing} CHF/mois, Pension {ligne.pension} CHF/mois → Total annuel : {ligne.totalAnnuel.toLocaleString("fr-CH")} CHF
      </Typography>
    ))}
  </Box>
)}

  </Box>
)}



    {resultats && (
      <Box mt={4}>
        <Alert
          severity={resultats.revenusSuffisants ? "success" : "error"}
          sx={{ mb: 2 }}
        >
          Revenus :{" "}
          {resultats.revenusSuffisants
            ? "suffisants par rapport aux charges"
            : "insuffisants par rapport aux charges"}
        </Alert>

        <Alert
          severity={resultats.vingtPourcent ? "success" : "error"}
          sx={{ mb: 2 }}
        >
          Fonds propres :{" "}
          {resultats.vingtPourcent
            ? "au moins 20% de fonds propres injectés"
            : "moins de 20% de fonds propres"}
        </Alert>

        <Alert
          severity={resultats.dixPourcentDurs ? "success" : "error"}
        >
          Fonds durs :{" "}
          {resultats.dixPourcentDurs
            ? "au moins 10% hors 2e pilier"
            : "fonds propres hors 2e pilier insuffisants"}
        </Alert>
      </Box>
    )}
  </Box>
)}


    <Box mt={4} display="flex" justifyContent="space-between">
      <Button
        disabled={activeStep === 0}
        onClick={handleBack}
        variant="outlined"
      >
        Retour
      </Button>
      <Button
        onClick={handleNext}
        variant="contained"
        disabled={activeStep === steps.length - 1}
      >
        Continuer
      </Button>
    </Box>
  </Box>
</Grid>

      </Grid>
    </Box>
  );
};

export default Etape3FinancementStepper;
