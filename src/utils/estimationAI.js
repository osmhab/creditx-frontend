import { doc, updateDoc, getDoc } from "firebase/firestore";
import { db } from "../firebase-config";

export const estimerValeurBienAvecOpenAI = async (formData, user, nextStep) => {
  const prixAchat = Number(formData.immobilier?.valeur || 0);

  try {
    const ref = doc(db, "dossiers", user.uid);

    // 🟡 Appel API backend
    const response = await fetch("https://creditx-backend.onrender.com/api/estimation", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ formData: formData.immobilier }),
});


    if (!response.ok) {
      throw new Error("Réponse backend non valide");
    }

    const data = await response.json();
    console.log("🧾 Réponse brute reçue du backend :", data);

    const { valeurEstimeeMarche, valeurEstimeeBanque } = data;

    // 🔎 Validation stricte des valeurs
    const valeursValides =
      typeof valeurEstimeeMarche === "number" &&
      typeof valeurEstimeeBanque === "number" &&
      valeurEstimeeMarche > 50000 &&
      valeurEstimeeBanque > 50000 &&
      valeurEstimeeMarche <= 10000000 &&
      valeurEstimeeBanque <= 10000000;

    if (!valeursValides) {
      alert("❌ Estimations invalides reçues. Veuillez réessayer plus tard.");
      return;
    }

    // 🔴 Détection de valeurs trop fréquentes (cas de 800'000 / 760'000 répétitifs)
    const estRepetitif = valeurEstimeeMarche === 800000 && valeurEstimeeBanque === 760000;
    if (estRepetitif) {
      alert("⚠️ L’estimation retournée semble trop générique. Réessaie dans quelques minutes pour obtenir une meilleure précision.");
    }

    // 💾 Enregistrement Firestore
    await updateDoc(ref, {
      estimationCreditX: {
        valeurEstimeeMarche,
        valeurEstimeeBanque,
      },
    });

    // 💡 Création du bloc resultatsFaisabilite (par défaut vrai ici)
    const resultatsFaisabilite = {
      faisable: true,
      okDur: true,
      okTotal: true,
      okCharges: true,
      okEstimation: true,
      interet: 0,
      entretien: 0,
      amortissement: 0,
      mensualites: 0,
      revenuTotal: 0,
      chargesTotales: 0,
      valeurBien: prixAchat,
      valeurBancaire: valeurEstimeeBanque,
      fondsTotaux: 0,
      fondsDurs: 0,
      ratioCharges: 0,
      bonusMoyen: 0,
      revenuBase: 0,
      bonusTotal: 0,
      bonusCount: 0,
      horodatage: new Date().toISOString(),
    };

    await updateDoc(ref, { resultatsFaisabilite });

    // ✅ Log succès
    console.log("✅ Résultats de faisabilité enregistrés :", resultatsFaisabilite);

    // 🔁 Recharge les données mises à jour
    const snap = await getDoc(ref);
    const updatedData = snap.data();

    // 🧮 Marge tolérée vs prix d’achat
    const margeToleree = valeurEstimeeMarche * 1.1;

    if (prixAchat <= valeurEstimeeMarche) {
      nextStep(updatedData);
    } else if (prixAchat <= margeToleree) {
      alert("⚠️ Le prix d'achat dépasse légèrement la valeur estimée du marché. Ce n’est pas bloquant, mais il faudra justifier ce prix.");
      nextStep(updatedData);
    } else {
      alert("🚫 Le prix d'achat dépasse largement la valeur estimée du marché. Cela devra être justifié auprès de la banque.");
      nextStep(updatedData);
    }

  } catch (error) {
    console.error("❌ Erreur lors de l'estimation automatique :", error);
    alert("❌ Une erreur est survenue lors de l'estimation. Veuillez réessayer plus tard.");
  }
};
