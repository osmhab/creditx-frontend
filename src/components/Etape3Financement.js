import React, { useState } from "react";
import { useEffect } from "react";
import {
  Box,
  Typography,
  Button,
  CircularProgress,
  Alert,
  AlertTitle,
  FormControlLabel,
  Checkbox,
} from "@mui/material";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { db } from "../firebase-config";
import ChampMontant from "./ChampMontant";
import Versement3ePilierChat from "./Versement3ePilierChat";
import Formulaire3aBancaire from "./Formulaire3aBancaire";
import Formulaire3aAssurance from "./Formulaire3aAssurance";
import { supprimerVersement3ePilier } from "../utils/financeUtils";
import BulleMessageCreditX from "./BulleMessageCreditX";






const Etape3Financement = ({
  formData,
  setFormData,
  user,
  setEtape3Valide
}) => {
  const [calculEffectue, setCalculEffectue] = useState(false);
  const [loading, setLoading] = useState(false);
  const [resultats, setResultats] = useState({});
  const [versement3ePilierActive, setVersement3ePilierActive] = useState(false);
  const [typeVersement3ePilier, setTypeVersement3ePilier] = useState("");
  const [comptesBancaires, setComptesBancaires] = useState([]);
  const [contratsAssurance, setContratsAssurance] = useState([]);



  useEffect(() => {
    const fetchResultats = async () => {
      if (!user) return;
      const ref = doc(db, "dossiers", user.uid);
      const snap = await getDoc(ref);
      if (snap.exists()) {
        const data = snap.data();
        if (data.resultatsFaisabilite) {
          setResultats(data.resultatsFaisabilite);
          setCalculEffectue(true);
          const { revenusSuffisants, vingtPourcent, dixPourcentDurs } = data.resultatsFaisabilite;
          setEtape3Valide(revenusSuffisants && vingtPourcent && dixPourcentDurs);
        }
      }
    };
  
    fetchResultats();
  }, [user]);

  const updateField = (name, value) => {
    setFormData({ ...formData, [name]: value });
    if (user) {
      const ref = doc(db, "dossiers", user.uid);
      updateDoc(ref, { [name]: value });
    }
  };

  const calculerValidationFondsPropres = () => {
    setLoading(true);
    setTimeout(async() => {
      const prixAchat = Number(formData.prixAchat || 0);
      const fraisSupp = Number(formData.fraisSupp || 0);
      const coutTotal = prixAchat + fraisSupp;
      const fraisAnnexes = prixAchat * 0.01;
      const totalRevenusEmployeurs = (formData.employeurs || []).reduce((total, emp) => {
        const revenu = Number(emp.revenu || 0);
        const bonus = Number(emp.bonus || 0) * 0.66; // pondération de 66%
        return total + revenu + bonus;
      }, 0);

      const totalRevenusEmployeursConjoint = (formData.conjointEmployeurs || []).reduce((total, emp) => {
        const revenu = Number(emp.revenu || 0);
        const bonus = Number(emp.bonus || 0) * 0.66;
        return total + revenu + bonus;
      }, 0);
      
      

  
      //revenu
      const revenusAnnuel = totalRevenusEmployeurs;
      const revenuComplementaire = Number(formData.revenuComplementaire || 0);
      const conjointRevenus = totalRevenusEmployeursConjoint;
      const revenuComplementaireConjoint = Number(formData.conjointrevenuComplementaire || 0);



      
      // Bonus moyens sur 3 ans
      const bonusMoyen = (
        Number(formData.bonusTroisAns || 0)
      );
      const conjointBonusMoyen = (
        Number(formData.conjointbonusTroisAns || 0)
      );
      
      // Intégration des bonus avec pondération de 80%
      const bonusRetenu = bonusMoyen * 0.80;
      const conjointBonusRetenu = conjointBonusMoyen * 0.80;
      
      //Total des revenus (incl bonus)
      const totalRevenus = revenusAnnuel + conjointRevenus + bonusRetenu + conjointBonusRetenu + revenuComplementaire + revenuComplementaireConjoint;






      
      //charges fixes
      const chargesFixes =
        Number(formData.leasingAnnuel || 0) +
        Number(formData.creditsAnnuel || 0) +
        Number(formData.pensionAlimentaire || 0) +
        Number(formData.conjointleasingAnnuel || 0) +
        Number(formData.conjointCreditsAnnuel || 0) +
        Number(formData.conjointpensionAlimentaire || 0) 
        
  
      const montantPret = coutTotal - (
        Number(formData.avoirsCompte || 0) +
        Number(formData.versement3ePilier || 0) +
        Number(formData.versement2ePilier || 0) +
        Number(formData.montantPretTiers || 0) +
        Number(formData.montantHoirie || 0) +
        Number(formData.montantDonation || 0)
      );
  
      const interetsHypo = montantPret * 0.05;
      const entretien = prixAchat * 0.01;
      const amortissement = montantPret > prixAchat * 0.66 ? montantPret * 0.01 : 0;
  
      const chargeHypo = interetsHypo + entretien + amortissement;
      const chargeTotale = chargesFixes + chargeHypo;
  
      const revenusSuffisants = totalRevenus * 0.33 >= chargeTotale;
  
      const avoirsCompte = Number(formData.avoirsCompte || 0);
      const versement3ePilier = Number(formData.versement3ePilier || 0);
      const versement2ePilier = Number(formData.versement2ePilier || 0);
      const montantPretTiers = Number(formData.montantPretTiers || 0);
      const montantHoirie = Number(formData.montantHoirie || 0);
      const montantDonation = Number(formData.montantDonation || 0);
  
      const fondsDurs = avoirsCompte + versement3ePilier;
      const fondsTotal = fondsDurs + versement2ePilier + montantPretTiers + montantHoirie + montantDonation;
  
      const vingtPourcent = fondsTotal >= coutTotal * 0.2;
      const dixPourcentDurs = versement2ePilier > 0 ? fondsDurs >= coutTotal * 0.1 : true;
  
      const faisable = revenusSuffisants && vingtPourcent && dixPourcentDurs;

      // ⬇️ C'est ici que tu enregistres les résultats dans Firestore
    if (user) {
      await updateDoc(doc(db, "dossiers", user.uid), {
        resultatsFaisabilite: {
          revenusSuffisants,
          vingtPourcent,
          dixPourcentDurs,
        },
      });
    }

    setResultats({ revenusSuffisants, vingtPourcent, dixPourcentDurs });
    setCalculEffectue(true);
    setEtape3Valide(faisable);
    setLoading(false);
  }, 1200);
};
  

  return (
    <Box>
    {calculEffectue && resultats.revenusSuffisants && resultats.vingtPourcent && resultats.dixPourcentDurs && (
  <Alert severity="success" sx={{ mb: 3 }}>
    Le calcul de faisabilité a été effectué avec succès. Vous pouvez continuer.
  </Alert>
)}

      <Typography variant="h6" gutterBottom>
        Données pour le financement
      </Typography>

      <ChampMontant
        label="Prix d'achat (CHF)"
        name="prixAchat"
        formData={formData}
        setFormData={setFormData}
        user={user}
      />
      <ChampMontant
        label="Frais supplémentaires (CHF)"
        name="fraisSupp"
        formData={formData}
        setFormData={setFormData}
        user={user}
      />

      <ChampMontant
        label="Avoirs en compte, titres"
        name="avoirsCompte"
        formData={formData}
        setFormData={setFormData}
        user={user}
      />

      <FormControlLabel
        control={
          <Checkbox
            checked={versement3ePilierActive}
            onChange={async (e) => {
              const checked = e.target.checked;
              setVersement3ePilierActive(checked);
              setTypeVersement3ePilier(""); // reset choix

              if (!checked && user) {
                // 🔥 suppression Firestore
                await supprimerVersement3ePilier(user);
              }
            }}
          />
        }
        label="Versement anticipé 3e pilier"
      />

{versement3ePilierActive && (
  <>
  
    <Versement3ePilierChat
      typeVersement3ePilier={typeVersement3ePilier}
      setTypeVersement3ePilier={setTypeVersement3ePilier}
    />
  </>
)}


        {["bancaire", "lesDeux"].includes(typeVersement3ePilier) && (
          <Formulaire3aBancaire
            comptes={comptesBancaires}
            setComptes={setComptesBancaires}
            user={user}
          />

        )}


        {["assurance", "lesDeux"].includes(typeVersement3ePilier) && (
          <Formulaire3aAssurance
            contrats={contratsAssurance}
            setContrats={setContratsAssurance}
          />
        )}


      <ChampMontant
        label="Versement anticipé 2e pilier"
        name="versement2ePilier"
        formData={formData}
        setFormData={setFormData}
        user={user}
      />
      <ChampMontant
        label="Prêt de tiers"
        name="montantPretTiers"
        formData={formData}
        setFormData={setFormData}
        user={user}
      />
      <ChampMontant
        label="Avance d’hoirie"
        name="montantHoirie"
        formData={formData}
        setFormData={setFormData}
        user={user}
      />
      <ChampMontant
        label="Donation"
        name="montantDonation"
        formData={formData}
        setFormData={setFormData}
        user={user}
      />

      <Box mt={3}>
        <Button
          variant="contained"
          onClick={calculerValidationFondsPropres}
          disabled={loading}
        >
          {loading ? <CircularProgress size={24} color="inherit" /> : "Calculer la faisabilité"}
        </Button>
      </Box>

      {calculEffectue && (
        <Box mt={3}>
        <Alert
  severity={resultats.revenusSuffisants ? "success" : "error"}
  sx={{
    mb: 2,
    backgroundColor: "transparent",
    border: "1px solid #ccc",
    color: "#000",
    "& .MuiAlert-icon": {
      mr: 1.5 // petit ajustement pour l'espacement
    }
  }}
>
  <AlertTitle sx={{ color: "#000" }}>Revenus</AlertTitle>
  {resultats.revenusSuffisants
    ? "Vos revenus sont suffisants par rapport aux charges."
    : "Vos revenus sont insuffisants par rapport aux charges."}
</Alert>

<Alert
  severity={resultats.vingtPourcent ? "success" : "error"}
  sx={{
    mb: 2,
    backgroundColor: "transparent",
    border: "1px solid #ccc",
    color: "#000",
    "& .MuiAlert-icon": {
      mr: 1.5
    }
  }}
>
  <AlertTitle sx={{ color: "#000" }}>Fonds propres</AlertTitle>
  {resultats.vingtPourcent
    ? "Vous avez au moins 20% de fonds propres."
    : "Vous n'avez pas les 20% de fonds propres requis."}
</Alert>

<Alert
  severity={resultats.dixPourcentDurs ? "success" : "error"}
  sx={{
    backgroundColor: "transparent",
    border: "1px solid #ccc",
    color: "#000",
    "& .MuiAlert-icon": {
      mr: 1.5
    }
  }}
>
  <AlertTitle sx={{ color: "#000" }}>Fonds propres durs</AlertTitle>
  {resultats.dixPourcentDurs
    ? "Vos fonds propres hors 2e pilier sont suffisants."
    : "Vous devez avoir au moins 10% hors 2e pilier."}
</Alert>


        </Box>
        
      )}
    </Box>
    
  );
  
};



export default Etape3Financement;