// Etape5Documents.js
import React, { useEffect, useState } from "react";
import { Box, Typography, Button, Grid, CircularProgress } from "@mui/material";
import { getFirestore, doc, getDoc } from "firebase/firestore";
import UploaderDocument from "./UploaderDocument";

const Etape5Documents = ({ dossierId }) => {
  const [loading, setLoading] = useState(true);
  const [donnees, setDonnees] = useState(null);
  const [documents, setDocuments] = useState([]);

  const db = getFirestore();

  useEffect(() => {
    const fetchDonnees = async () => {
      const docRef = doc(db, "dossiers", dossierId);
      const snapshot = await getDoc(docRef);
      if (snapshot.exists()) {
        const data = snapshot.data();
        setDonnees(data); console.log("🔥 données reçues de Firestore :", data);

        const docs = [
          ...genererDocuments(data.personne1, "personne1"),
          ...genererDocuments(data.personne2, "personne2"),
          ...genererDocumentsBien(data.bien)
        ];
        setDocuments(docs);
      }
      setLoading(false);
    };
    fetchDonnees();
  }, [dossierId]);

  const genererDocuments = (personne, personneKey) => {
    const annee = new Date().getFullYear();
    const d = [];

    const ajouter = (label, type, obligatoire = true) => {
      d.push({ label, type, personne: personneKey, obligatoire });
    };

    if (!personne) personne = {};


    ajouter("Copie de la dernière déclaration d’impôt complète", `impots_${personneKey}`);
    ajouter("Extrait de l’office des poursuites datant de moins de 3 mois", `poursuites_${personneKey}`);
    ajouter(`Certificat de la caisse de pension (2e pilier) de ${annee}`, `lpp_${personneKey}`);

    if (personne.versement2ePilier > 0) {
      ajouter(`Simulation avant / après d’un retrait anticipé de CHF ${personne.versement2ePilier}`, `simulation2e_${personneKey}`);
    }

    if (personne.versement3ePilierBancaire?.length > 0) {
      personne.versement3ePilierBancaire.forEach((item, i) => {
        ajouter(`Relevé 3a bancaire – ${item.institution}`, `releve3aBancaire_${personneKey}_${i}`);
      });
    }

    if (personne.versement3ePilierAssurance?.length > 0) {
      personne.versement3ePilierAssurance.forEach((item, i) => {
        ajouter(`Attestation de valeur de rachat – ${item.compagnie}`, `rachat3aAssurance_${personneKey}_${i}`);
      });
    }

    if (personne.avoirsCompte > 0) {
      ajouter(`Relevé de compte (CHF ${personne.avoirsCompte})`, `releveCompte_${personneKey}`);
    }

    personne.employeurs?.forEach((employeur, index) => {
      if (employeur.statut === "salarié" && !employeur.revenuIrregulier) {
        ajouter("3 dernières fiches de salaire", `fichesSalaire_${personneKey}_${index}`);
        ajouter(`Certificat de salaire ${annee - 1}`, `certificatSalaire1_${personneKey}_${index}`);
        ajouter(`Certificat de salaire ${annee - 2}`, `certificatSalaire2_${personneKey}_${index}`);
        ajouter(`Certificat de salaire ${annee - 3}`, `certificatSalaire3_${personneKey}_${index}`);
      }
      if (employeur.statut === "indépendant") {
        ajouter(`Certificat de salaire ${annee - 1}`, `certificatIndep1_${personneKey}_${index}`);
        ajouter(`Certificat de salaire ${annee - 2}`, `certificatIndep2_${personneKey}_${index}`);
        ajouter(`Certificat de salaire ${annee - 3}`, `certificatIndep3_${personneKey}_${index}`);
        ajouter("Bilan d’entreprise", `bilanEntreprise_${personneKey}_${index}`);
        ajouter("Compte de résultats", `compteResultats_${personneKey}_${index}`);
      }
    });

    return d;
  };

  const genererDocumentsBien = (bien) => {
    const d = [];
    const ajouter = (label, type, obligatoire = true) => {
      d.push({ label, type, personne: "bien", obligatoire });
    };

    if (!bien) bien = {};


    ajouter("Extrait du registre foncier datant de moins de 6 mois", "registreFoncier");
    ajouter("Attestation de l’assurance incendie avec l’année de construction et le volume", "assuranceIncendie");
    ajouter("Photos récentes intérieures", "photosInterieures");
    ajouter("Photos récentes extérieures", "photosExterieures");
    ajouter("Documentation de vente", "docVente");

    if (bien.certificat) {
      ajouter(`Certificat demandé : ${bien.certificat}`, "certificatBien");
    }

    return d;
  };

  if (loading) return <CircularProgress />;

  return (
    <Box>
      <Typography variant="h5" gutterBottom>
        Documents à fournir – {donnees?.personne1?.prenom} {donnees?.personne1?.nom} et {donnees?.personne2?.prenom} {donnees?.personne2?.nom}
      </Typography>
      <Grid container spacing={2}>
        {documents.map((doc, index) => (
          <Grid item xs={12} key={index}>
            <UploaderDocument dossierId={dossierId} type={doc.type} label={doc.label} />
          </Grid>
        ))}
      </Grid>

      <Box mt={4}>
        <Button variant="contained" color="primary">
          Soumettre le dossier
        </Button>
      </Box>
    </Box>
  );
};

export default Etape5Documents;
