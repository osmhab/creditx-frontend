// src/utils/financeUtils.js

import { doc, updateDoc } from "firebase/firestore";
import { db } from "../firebase-config";
import { getDoc } from "firebase/firestore";


export const enregistrerComptes3aBancaires = async (user, comptes) => {
  if (!user) return;

  const montantTotal = comptes.reduce((acc, curr) => acc + (curr.montant || 0), 0);

  const ref = doc(db, "dossiers", user.uid);
  await updateDoc(ref, {
    comptes3aBancaires: comptes,
    versement3ePilier: montantTotal,
  });
};

export const supprimerVersement3ePilier = async (user) => {
    if (!user) return;
  
    const ref = doc(db, "dossiers", user.uid);
    await updateDoc(ref, {
      versement3ePilier: 0,
      comptes3aBancaires: [],
      contrats3aAssurance: [],
    });
  };

export const calculerTotal = (tableau, champ = "montant") =>
    tableau.reduce((acc, curr) => acc + (curr[champ] || 0), 0);


export const enregistrerContrats3aAssurance = async (user, contratsAssurance) => {
  if (!user) return;

  try {
    const ref = doc(db, "dossiers", user.uid);

    // 🔢 Calculer le total des assurances
    const totalAssurance = contratsAssurance.reduce((sum, contrat) => {
      const montant = Number(contrat.montant || 0);
      return sum + montant;
    }, 0);

    // 🔍 Récupérer les comptes bancaires existants pour additionner
    const snap = await getDoc(ref);
    const data = snap.data();
    const comptesBancaires = data.comptes3aBancaires || [];

    const totalBancaire = comptesBancaires.reduce((sum, compte) => {
      const montant = Number(compte.montant || 0);
      return sum + montant;
    }, 0);

    const totalGlobal = totalAssurance + totalBancaire;

    // 💾 Sauvegarde
    await updateDoc(ref, {
      contrats3aAssurance: contratsAssurance,
      versement3ePilier: totalGlobal,
    });

    console.log("✅ Contrats 3a assurance et total mis à jour dans Firestore.");
  } catch (error) {
    console.error("❌ Erreur lors de l'enregistrement des contrats 3a assurance :", error);
  }
};