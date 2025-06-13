import React, { useEffect, useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Tooltip
} from "@mui/material";

import InfoOutlined from "@mui/icons-material/InfoOutlined";


import { db } from "./firebase-config";
import { doc, getDoc, updateDoc } from "firebase/firestore";

// Dictionnaire de l'état civil 
    const etatCivilLabels = {
        1: "Célibataire",
        2: "Marié(e)",
        3: "Divorcé(e)",
        4: "Veuf / Veuve",
      };


const ModalFaisabiliteCredit = ({ open, onClose, user, onContinuer, reloadFaisabilite }) => {
  const [resultat, setResultat] = useState(null);
  const [loading, setLoading] = useState(true);
  const [donneesResume, setDonneesResume] = useState(null);


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
      const okCharges = ratioCharges <= 0.333;
      const faisable = okDur && okTotal && okCharges;
      const faisableAvecEstimation = faisable && okEstimation;
      const horodatage = new Date().toISOString(); // pour éviter de le recalculer 2x





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
        horodatage,
      });

            // Dictionnaire etat civil -

      if (user?.uid) {
  const ref = doc(db, "dossiers", user.uid);
  await updateDoc(ref, {
    resultatsFaisabilite: {
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
      horodatage,
    },
    lastFaisabiliteAt: new Date().toISOString()  // 👈
  });
}

setDonneesResume({ data, bien });

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


{donneesResume && (() => {
  const data = donneesResume.data;
  const bien = donneesResume.bien;

  return (
    <Box sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h6" gutterBottom>📄 Résumé du dossier</Typography>

      {/* Personnes */}
      <Typography variant="subtitle2" sx={{ mt: 3, mb: 1 }}>👤 Informations sur les personnes</Typography>
      {data.personnes?.map((p, index) => (
        <Box key={index} sx={{ mb: 2 }}>
          <Typography variant="body2" fontWeight="bold" sx={{ mb: 1 }}>{p.prenom} {p.nom}</Typography>
          <Box component="table" sx={{ width: "100%", borderCollapse: "collapse", backgroundColor: "#fafafa" }}>
            <Box component="tbody">
              <Box component="tr">
                <Box component="td" sx={{ p: 1, borderBottom: "1px solid #eee", width: "40%" }}>Date de naissance</Box>
                <Box component="td" sx={{ p: 1, borderBottom: "1px solid #eee" }}>{p.dateNaissance || "Non précisée"}</Box>
              </Box>
              <Box component="tr">
                <Box component="td" sx={{ p: 1, borderBottom: "1px solid #eee" }}>État civil</Box>
                <Box component="td" sx={{ p: 1, borderBottom: "1px solid #eee" }}>
                  {etatCivilLabels[p.etatCivil] || "Non précisé"}
                </Box>

              </Box>
              <Box component="tr">
                <Box component="td" sx={{ p: 1, borderBottom: "1px solid #eee" }}>Profession</Box>
                <Box component="td" sx={{ p: 1, borderBottom: "1px solid #eee" }}>{p.profession || "Non précisée"}</Box>
              </Box>
              <Box component="tr">
                <Box component="td" sx={{ p: 1, borderBottom: "1px solid #eee" }}>Nationalité</Box>
                <Box component="td" sx={{ p: 1, borderBottom: "1px solid #eee" }}>{p.nationalite || "Non précisée"}</Box>
              </Box>
              {p.nationalite !== "Suisse" && (
                <Box component="tr">
                  <Box component="td" sx={{ p: 1, borderBottom: "1px solid #eee" }}>Permis de séjour</Box>
                  <Box component="td" sx={{ p: 1, borderBottom: "1px solid #eee" }}>{p.permisSejour || "Non précisé"}</Box>
                </Box>
              )}
              <Box component="tr">
                <Box component="td" sx={{ p: 1, borderBottom: "1px solid #eee" }}>Enfants à charge</Box>
                <Box component="td" sx={{ p: 1, borderBottom: "1px solid #eee" }}>
                  {Array.isArray(p.enfants) && p.enfants.length > 0
                    ? p.enfants.map((e, i) => e.prenom).join(", ")
                    : "Aucun"}
                </Box>
              </Box>
              <Box component="tr">
                <Box component="td" sx={{ p: 1, borderBottom: "1px solid #eee" }}>Crédits</Box>
                <Box component="td" sx={{ p: 1, borderBottom: "1px solid #eee" }}>{Number(p.mensualiteCredits || 0).toLocaleString("fr-CH")} CHF / mois</Box>
              </Box>
              <Box component="tr">
                <Box component="td" sx={{ p: 1, borderBottom: "1px solid #eee" }}>Leasing</Box>
                <Box component="td" sx={{ p: 1, borderBottom: "1px solid #eee" }}>{Number(p.mensualiteLeasing || 0).toLocaleString("fr-CH")} CHF / mois</Box>
              </Box>
              <Box component="tr">
                <Box component="td" sx={{ p: 1, borderBottom: "1px solid #eee" }}>Pension alimentaire</Box>
                <Box component="td" sx={{ p: 1, borderBottom: "1px solid #eee" }}>{Number(p.montantPension || 0).toLocaleString("fr-CH")} CHF / mois</Box>
              </Box>
              <Box component="tr">
                <Box component="td" sx={{ p: 1 }}>Revenus locatifs</Box>
                <Box component="td" sx={{ p: 1 }}>{Number(p.montantRevenusLocatifs || 0).toLocaleString("fr-CH")} CHF / mois</Box>
              </Box>
            </Box>
          </Box>
        </Box>
      ))}

{/* Employeurs */}
<Typography variant="subtitle2" sx={{ mt: 3, mb: 1 }}>🏢 Informations sur les employeurs</Typography>
{data.personnes?.map((p, indexP) => (
  p.employeurs?.map((e, indexE) => (
    <Box key={`${indexP}-${indexE}`} sx={{ mb: 2 }}>
      <Typography variant="body2" fontWeight="bold" sx={{ mb: 1 }}>
        {p.prenom} {p.nom} — {e.nom || "Employeur inconnu"}
      </Typography>
      <Box component="table" sx={{ width: "100%", borderCollapse: "collapse", backgroundColor: "#f5f5f5" }}>
        <Box component="tbody">
          <Box component="tr">
            <Box component="td" sx={{ p: 1, borderBottom: "1px solid #eee", width: "40%" }}>Statut</Box>
            <Box component="td" sx={{ p: 1, borderBottom: "1px solid #eee" }}>{e.statutEntreprise || "N/A"}</Box>
          </Box>
          <Box component="tr">
            <Box component="td" sx={{ p: 1, borderBottom: "1px solid #eee" }}>Taux d'activité</Box>
            <Box component="td" sx={{ p: 1, borderBottom: "1px solid #eee" }}>{e.tauxActivite || "N/A"} %</Box>
          </Box>
          <Box component="tr">
            <Box component="td" sx={{ p: 1, borderBottom: "1px solid #eee" }}>Revenu annuel (sans bonus)</Box>
            <Box component="td" sx={{ p: 1, borderBottom: "1px solid #eee" }}>
              {e.revenusReguliers
                ? `${Number(e.revenu || 0).toLocaleString("fr-CH")} CHF` +
                  (e.revenuMensuel && e.frequenceMensuelle ? ` (${Number(e.revenuMensuel).toLocaleString("fr-CH")} × ${e.frequenceMensuelle})` : "")
                : (() => {
                    const annees = Object.keys(e.revenusIrr || {}).filter((k) => k.startsWith("revenuAnnuel"));
                    const somme = annees.reduce((acc, key) => acc + Number(e.revenusIrr[key] || 0), 0);
                    const moyenne = annees.length ? somme / annees.length : 0;
             

    
                    return (
                      <Box display="flex" alignItems="center" gap={1}>
                        {Math.round(moyenne).toLocaleString("fr-CH")} CHF
                        <Tooltip
                          title={
                            <Box>
                              <Typography variant="caption" fontWeight="bold" sx={{ mb: 0.5 }}>
                                Moyenne des années :
                              </Typography>
                              {annees.map((key) => {
                                const annee = key.replace("revenuAnnuel", "");
                                const valeur = e.revenusIrr?.[key] || 0;
                                return (
                                  <Box key={key} display="flex" justifyContent="space-between" sx={{ minWidth: 180 }}>
                                    <Typography variant="caption">{annee} :</Typography>
                                    <Typography variant="caption" fontWeight="bold">
                                      CHF {Number(valeur).toLocaleString("fr-CH")}
                                    </Typography>
                                  </Box>
                                );
                              })}
                            </Box>
                          }
                          placement="top"
                          arrow
                        >
                          <InfoOutlined fontSize="small" sx={{ color: "#888", cursor: "help" }} />
                        </Tooltip>
                      </Box>
                    );
                  })()
              }
            </Box>
          </Box>
          <Box component="tr">
            <Box component="td" sx={{ p: 1, borderBottom: "1px solid #eee" }}>Revenu irrégulier</Box>
            <Box component="td" sx={{ p: 1, borderBottom: "1px solid #eee" }}>
              {e.revenusReguliers === false ? "Oui" : "Non"}
            </Box>
          </Box>
          <Box component="tr">
            <Box component="td" sx={{ p: 1 }}>Bonus</Box>
            <Box component="tr">
          <Box component="td" sx={{ p: 1 }}>
            {(() => {
              const bonusAnnees = Object.keys(e.revenusIrr || {}).filter((k) => k.startsWith("bonus"));
              const total = bonusAnnees.reduce((acc, key) => acc + Number(e.revenusIrr[key] || 0), 0);
              const moyenne = bonusAnnees.length ? total / bonusAnnees.length : 0;
              const ponderee = moyenne * 0.8;
              return `${Math.round(ponderee).toLocaleString("fr-CH")} CHF (moyenne pondérée à 80%)`;
              })()}
            </Box>
          </Box>
          </Box>
        </Box>
      </Box>
    </Box>
  ))
))}


      {/* Bien immobilier */}
      <Typography variant="subtitle2" sx={{ mt: 3, mb: 1 }}>🏠 Informations sur le bien immobilier</Typography>
      <Box component="table" sx={{ width: "100%", borderCollapse: "collapse", backgroundColor: "#f0f0f0" }}>
        <Box component="tbody">
          <Box component="tr">
            <Box component="td" sx={{ p: 1, borderBottom: "1px solid #eee", width: "40%" }}>Adresse</Box>
            <Box component="td" sx={{ p: 1, borderBottom: "1px solid #eee" }}>{bien?.adresseComplete || "Non précisée"}</Box>
          </Box>
          <Box component="tr">
            <Box component="td" sx={{ p: 1, borderBottom: "1px solid #eee" }}>Type</Box>
            <Box component="td" sx={{ p: 1, borderBottom: "1px solid #eee" }}>{bien?.type || "N/A"}</Box>
          </Box>
          <Box component="tr">
            <Box component="td" sx={{ p: 1, borderBottom: "1px solid #eee" }}>Surface</Box>
            <Box component="td" sx={{ p: 1, borderBottom: "1px solid #eee" }}>{bien?.surfaceHabitable || "N/A"} m²</Box>
          </Box>
          <Box component="tr">
            <Box component="td" sx={{ p: 1, borderBottom: "1px solid #eee" }}>Année de construction</Box>
            <Box component="td" sx={{ p: 1, borderBottom: "1px solid #eee" }}>{bien?.anneeConstruction || "N/A"}</Box>
          </Box>
          <Box component="tr">
            <Box component="td" sx={{ p: 1, borderBottom: "1px solid #eee" }}>Prix d'achat</Box>
            <Box component="td" sx={{ p: 1, borderBottom: "1px solid #eee" }}>{Number(resultat.valeurBien).toLocaleString("fr-CH")} CHF</Box>
          </Box>
          <Box component="tr">
            <Box component="td" sx={{ p: 1 }}>Estimation bancaire IA</Box>
            <Box component="td" sx={{ p: 1 }}>{Number(resultat.valeurBancaire).toLocaleString("fr-CH")} CHF</Box>
          </Box>
        </Box>
      </Box>
    </Box>
  );
})()}







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

      {resultat.faisable && !resultat.okEstimation && (
  <Box sx={{ mt: 2, mb: 3, p: 2, backgroundColor: "#fff3e0", border: "1px solid #ffb74d", borderRadius: 1 }}>
    <Typography variant="body2" color="text.secondary">
      ⚠️ Le prix d’achat dépasse de plus de 10 % la valeur estimée par l’IA. Cela pourrait poser problème pour certaines banques.
    </Typography>
  </Box>
)}

      
<Box component="tr">
  <Box component="td" sx={{ p: 1, borderBottom: '1px dashed #ccc' }}>Estimation bancaire</Box>
  <Box component="td" sx={{ p: 1, borderBottom: '1px dashed #ccc' }}>
    {resultat.valeurBancaire.toLocaleString("fr-CH")} CHF
  </Box>
  <Box component="td" sx={{ p: 1, borderBottom: '1px dashed #ccc' }}>
    (tolérance max : {(resultat.valeurBancaire * 1.1).toLocaleString("fr-CH")} CHF)
  </Box>
</Box>

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
        <Box sx={{ mt: 2, mb: 3, p: 2, backgroundColor: "#fff3e0", border: "1px solid #ffb74d", borderRadius: 1 }}>
    <Typography variant="body2" color="text.secondary">
      ⚠️ Le prix d’achat dépasse de plus de 10 % la valeur estimée par l’IA. Cela pourrait poser problème pour certaines banques.
    </Typography>
  </Box>
      )}
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
        
          <Button
  variant="contained"
  onClick={async () => {
    if (reloadFaisabilite) {
      await reloadFaisabilite(); // ✅ recharge depuis Firestore
    }
    onContinuer();
  }}
>
  Continuer
</Button>

      </DialogActions>
    </Dialog>
  );
};

export default ModalFaisabiliteCredit;
