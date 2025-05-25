import React, { useEffect, useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
} from "@mui/material";
import { db } from "./firebase-config";
import { doc, getDoc } from "firebase/firestore";

const ModalFaisabiliteCredit = ({ open, onClose, user, onContinuer }) => {
  const [resultat, setResultat] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDataAndCalculate = async () => {
      if (!user?.uid) return;
      setLoading(true);
      const ref = doc(db, "dossiers", user.uid);
      const snap = await getDoc(ref);
      const data = snap.data();
      if (!data) return;

      // --- Immobilier ---
      const bien = data.immobilier;
      const valeurBien = Number(bien?.valeur || 0);

      // --- Estimation IA ---
      const estimation = data.estimationCreditX || {};
      const valeurBancaire = Number(estimation.valeurEstimeeBanque || 0);
      const okEstimation = valeurBancaire > 0 && valeurBien <= valeurBancaire * 1.1;

      // --- Fonds propres ---
      const fonds = Array.isArray(data.fondsPropres) ? data.fondsPropres : [];
      const fondsTotaux = fonds.reduce((acc, f) => acc + Number(f.montant || 0), 0);
      const fondsDurs = fonds.reduce((acc, f) => f.type === "2e pilier" ? acc : acc + Number(f.montant || 0), 0);

      // --- Revenus ---
      let revenuBase = 0;
      let bonusTotal = 0;
      let bonusCount = 0;

      if (Array.isArray(data.personnes)) {
        data.personnes.forEach((p) => {
          if (Array.isArray(p.employeurs)) {
            p.employeurs.forEach((e) => {
              if (e.revenusReguliers) {
                revenuBase += Number(e.revenu || 0);
              } else if (e.revenusIrr) {
                const annees = Object.keys(e.revenusIrr).filter((k) => k.startsWith("revenuAnnuel"));
                const somme = annees.reduce((acc, key) => acc + Number(e.revenusIrr[key] || 0), 0);
                revenuBase += somme / (annees.length || 1);
              }

              const bonusAnnees = Object.keys(e.revenusIrr || {}).filter((k) => k.startsWith("bonus"));
              bonusAnnees.forEach((key) => {
                bonusTotal += Number(e.revenusIrr[key] || 0);
                bonusCount++;
              });

              if (e.bonus) {
                bonusTotal += Number(e.bonus);
                bonusCount++;
              }
            });
          }
        });
      }

      const bonusMoyen = bonusCount ? (bonusTotal / bonusCount) * 0.8 : 0;
      const revenuTotal = revenuBase + bonusMoyen;

      // --- Charges ---
      const credit = valeurBien - fondsTotaux;
      const interet = credit * 0.05;

      const entretien = valeurBien * 0.01;

      const seuilAmortissement = valeurBien * 0.66;
      const amortissement = credit > seuilAmortissement
        ? (credit - seuilAmortissement) / 15
        : 0;



      const chargesMensuelles = (data.personnes || []).reduce((acc, p) => {
        return acc + Number(p.mensualiteCredits || 0) + Number(p.mensualiteLeasing || 0) + Number(p.montantPension || 0);
      }, 0);

      const revenusLocatifs = (data.personnes || []).reduce((acc, p) => {
        return acc + Number(p.montantRevenusLocatifs || 0);
      }, 0);

      const chargesTotales = interet + entretien + amortissement + (chargesMensuelles * 12);
      const revenuNet = revenuTotal + (revenusLocatifs * 12);
      const ratioCharges = revenuNet ? chargesTotales / revenuNet : 1;

      // --- Conditions ---
      const okDur = fondsDurs >= 0.1 * valeurBien;
      const okTotal = fondsTotaux >= 0.2 * valeurBien;
      const okCharges = ratioCharges <= 0.33;
      const faisable = okDur && okTotal && okCharges && okEstimation;

      setResultat({
        faisable,
        okDur,
        okTotal,
        okCharges,
        okEstimation,
        interet,
        entretien,
        amortissement,
        mensualites: chargesMensuelles,
        revenuTotal: revenuNet,
        chargesTotales,
        valeurBien,
        valeurBancaire,
        fondsTotaux,
        fondsDurs,
        ratioCharges,
        bonusMoyen,
        revenuBase,
        bonusTotal,
        bonusCount,
      });

      setLoading(false);
    };

    if (open) fetchDataAndCalculate();
  }, [open, user]);

  if (!resultat) return null;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>Analyse de faisabilité</DialogTitle>
      <DialogContent dividers>
        {loading ? (
          <Typography>Chargement...</Typography>
        ) : resultat.faisable ? (
            <>
  <Typography gutterBottom>
    ✅ Ce crédit est <strong>faisable</strong>.
  </Typography>

  <Box component="table" sx={{ width: '100%', borderCollapse: 'collapse', mt: 2 }}>
    <Box component="thead" sx={{ backgroundColor: '#f9f9f9' }}>
      <Box component="tr">
        <Box component="th" sx={{ textAlign: 'left', p: 1, borderBottom: '1px solid #ddd' }}>Élément</Box>
        <Box component="th" sx={{ textAlign: 'left', p: 1, borderBottom: '1px solid #ddd' }}>Valeur</Box>
        <Box component="th" sx={{ textAlign: 'left', p: 1, borderBottom: '1px solid #ddd' }}>Détail / Seuil</Box>
      </Box>
    </Box>
    <Box component="tbody">
      <Box component="tr">
        <Box component="td" sx={{ p: 1, borderBottom: '1px dashed #ccc' }}>Fonds propres en dur</Box>
        <Box component="td" sx={{ p: 1, borderBottom: '1px dashed #ccc' }}>{resultat.fondsDurs.toLocaleString("fr-CH")} CHF</Box>
        <Box component="td" sx={{ p: 1, borderBottom: '1px dashed #ccc' }}>
          ({(100 * resultat.fondsDurs / resultat.valeurBien).toFixed(1)} % du prix du bien)
        </Box>
      </Box>
      <Box component="tr">
        <Box component="td" sx={{ p: 1, borderBottom: '1px dashed #ccc' }}>Fonds propres totaux</Box>
        <Box component="td" sx={{ p: 1, borderBottom: '1px dashed #ccc' }}>{resultat.fondsTotaux.toLocaleString("fr-CH")} CHF</Box>
        <Box component="td" sx={{ p: 1, borderBottom: '1px dashed #ccc' }}>
          ({(100 * resultat.fondsTotaux / resultat.valeurBien).toFixed(1)} % du prix du bien)
        </Box>
      </Box>
      <Box component="tr">
        <Box component="td" sx={{ p: 1, borderBottom: '1px dashed #ccc' }}>Charges annuelles</Box>
        <Box component="td" sx={{ p: 1, borderBottom: '1px dashed #ccc' }}>{Math.round(resultat.chargesTotales).toLocaleString("fr-CH")} CHF</Box>
        <Box component="td" sx={{ p: 1, borderBottom: '1px dashed #ccc' }}>
          ({(100 * resultat.ratioCharges).toFixed(1)} % du revenu)
        </Box>
      </Box>
      <Box component="tr">
        <Box component="td" sx={{ p: 1, borderBottom: '1px dashed #ccc' }}>Revenu total</Box>
        <Box component="td" sx={{ p: 1, borderBottom: '1px dashed #ccc' }}>{resultat.revenuTotal.toLocaleString("fr-CH")} CHF</Box>
        <Box component="td" sx={{ p: 1, borderBottom: '1px dashed #ccc' }}>—</Box>
      </Box>
      {/*
        <Box component="tr">
        <Box component="td" sx={{ p: 1, borderBottom: '1px dashed #ccc' }}>Estimation bancaire</Box>
        <Box component="td" sx={{ p: 1, borderBottom: '1px dashed #ccc' }}>{resultat.valeurBancaire.toLocaleString("fr-CH")} CHF</Box>
        <Box component="td" sx={{ p: 1, borderBottom: '1px dashed #ccc' }}>
          (tolérance max : {(resultat.valeurBancaire * 1.1).toLocaleString("fr-CH")} CHF)
        </Box>
    
      </Box>
      */}
    </Box>
  </Box>
</>

        ) : (
            <>
  <Typography gutterBottom color="error">
    ❌ Le crédit n'est <strong>pas faisable</strong> pour les raisons suivantes :
  </Typography>

  <Box component="table" sx={{ width: '100%', borderCollapse: 'collapse', mt: 2 }}>
    <Box component="thead" sx={{ backgroundColor: '#f9f9f9' }}>
      <Box component="tr">
        <Box component="th" sx={{ textAlign: 'left', p: 1, borderBottom: '1px solid #ddd' }}>Critère</Box>
        <Box component="th" sx={{ textAlign: 'left', p: 1, borderBottom: '1px solid #ddd' }}>Valeur</Box>
        <Box component="th" sx={{ textAlign: 'left', p: 1, borderBottom: '1px solid #ddd' }}>Seuil attendu</Box>
      </Box>
    </Box>
    <Box component="tbody">
      {!resultat.okDur && (
        <Box component="tr">
          <Box component="td" sx={{ p: 1, borderBottom: '1px dashed #ccc' }}>Fonds propres en dur</Box>
          <Box component="td" sx={{ p: 1, borderBottom: '1px dashed #ccc' }}>
            {resultat.fondsDurs.toLocaleString("fr-CH")} CHF ({(100 * resultat.fondsDurs / resultat.valeurBien).toFixed(1)} %)
          </Box>
          <Box component="td" sx={{ p: 1, borderBottom: '1px dashed #ccc' }}>
            Minimum requis : 10 %
          </Box>
        </Box>
      )}
      {!resultat.okTotal && (
        <Box component="tr">
          <Box component="td" sx={{ p: 1, borderBottom: '1px dashed #ccc' }}>Fonds propres totaux</Box>
          <Box component="td" sx={{ p: 1, borderBottom: '1px dashed #ccc' }}>
            {resultat.fondsTotaux.toLocaleString("fr-CH")} CHF ({(100 * resultat.fondsTotaux / resultat.valeurBien).toFixed(1)} %)
          </Box>
          <Box component="td" sx={{ p: 1, borderBottom: '1px dashed #ccc' }}>
            Minimum requis : 20 %
          </Box>
        </Box>
      )}
      {!resultat.okCharges && (
        <Box component="tr">
          <Box component="td" sx={{ p: 1, borderBottom: '1px dashed #ccc' }}>Charges annuelles</Box>
          <Box component="td" sx={{ p: 1, borderBottom: '1px dashed #ccc' }}>
            {Math.round(resultat.chargesTotales).toLocaleString("fr-CH")} CHF ({(100 * resultat.ratioCharges).toFixed(1)} %)
          </Box>
          <Box component="td" sx={{ p: 1, borderBottom: '1px dashed #ccc' }}>
            Doivent rester ≤ 33 % du revenu
          </Box>
        </Box>
      )}
      {!resultat.okEstimation && (
        <Box component="tr">
          <Box component="td" sx={{ p: 1, borderBottom: '1px dashed #ccc' }}>Estimation bancaire</Box>
          <Box component="td" sx={{ p: 1, borderBottom: '1px dashed #ccc' }}>
            {resultat.valeurBancaire.toLocaleString("fr-CH")} CHF
          </Box>
          <Box component="td" sx={{ p: 1, borderBottom: '1px dashed #ccc' }}>
            Prix du bien ≤ {(resultat.valeurBancaire * 1.1).toLocaleString("fr-CH")} CHF
          </Box>
        </Box>
      )}
    </Box>
  </Box>
</>

        )}

        {/* Bas de page - Critères appliqués */}
        <Box mt={4} sx={{ color: "#666" }}>
          <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: "bold", fontSize: "0.8rem" }}>
            Critères de faisabilité appliqués
          </Typography>

          <Box component="table" sx={{ width: "100%", borderCollapse: "collapse", mt: 1, borderTop: "1px solid #eee" }}>
            <Box component="thead">
              <Box component="tr">
                <Box component="th" sx={{ textAlign: "left", pr: 2, pb: 1, fontSize: "0.75rem" }}>Critère</Box>
                <Box component="th" sx={{ textAlign: "left", pr: 2, pb: 1, fontSize: "0.75rem" }}>Calcul</Box>
                <Box component="th" sx={{ textAlign: "left", pb: 1, fontSize: "0.75rem" }}>Justification</Box>
              </Box>
            </Box>
            <Box component="tbody">
              <Box component="tr">
                <Box component="td" sx={{ pr: 2, py: 0.5, fontSize: "0.75rem", borderBottom: "1px dotted #ccc" }}>Intérêt</Box>
                <Box component="td" sx={{ pr: 2, py: 0.5, fontSize: "0.75rem", borderBottom: "1px dotted #ccc" }}>5 % sur le crédit</Box>
                <Box component="td" sx={{ py: 0.5, fontSize: "0.75rem", borderBottom: "1px dotted #ccc" }}>Taux théorique appliqué par toutes les banques</Box>
              </Box>
              <Box component="tr">
                <Box component="td" sx={{ pr: 2, py: 0.5, fontSize: "0.75rem", borderBottom: "1px dotted #ccc" }}>Entretien</Box>
                <Box component="td" sx={{ pr: 2, py: 0.5, fontSize: "0.75rem", borderBottom: "1px dotted #ccc" }}>1 % sur la valeur du bien</Box>
                <Box component="td" sx={{ py: 0.5, fontSize: "0.75rem", borderBottom: "1px dotted #ccc" }}>Estimation prudente</Box>
              </Box>
              <Box component="tr">
                <Box component="td" sx={{ pr: 2, py: 0.5, fontSize: "0.75rem", borderBottom: "1px dotted #ccc" }}>Amortissement</Box>
                <Box component="td" sx={{ pr: 2, py: 0.5, fontSize: "0.75rem", borderBottom: "1px dotted #ccc" }}>(part &gt; 66 %) / 15 ans</Box>
                <Box component="td" sx={{ py: 0.5, fontSize: "0.75rem", borderBottom: "1px dotted #ccc" }}>Règle standard du marché suisse</Box>
              </Box>
              <Box component="tr">
                <Box component="td" sx={{ pr: 2, py: 0.5, fontSize: "0.75rem", borderBottom: "1px dotted #ccc" }}>Charge max</Box>
                <Box component="td" sx={{ pr: 2, py: 0.5, fontSize: "0.75rem", borderBottom: "1px dotted #ccc" }}>&le; 33 % du revenu brut</Box>
                <Box component="td" sx={{ py: 0.5, fontSize: "0.75rem", borderBottom: "1px dotted #ccc" }}>Seuil d'acceptabilité usuel</Box>
              </Box>
              <Box component="tr">
                <Box component="td" sx={{ pr: 2, py: 0.5, fontSize: "0.75rem" }}>Fonds propres</Box>
                <Box component="td" sx={{ pr: 2, py: 0.5, fontSize: "0.75rem" }}>&ge; 20 % (total) et &ge; 10 % (durs)</Box>
                <Box component="td" sx={{ py: 0.5, fontSize: "0.75rem" }}>Norme réglementaire FINMA</Box>
              </Box>
            </Box>
          </Box>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Fermer</Button>
        {resultat.faisable && (
          <Button variant="contained" onClick={onContinuer}>
            Continuer
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default ModalFaisabiliteCredit;
