import { doc, updateDoc } from "firebase/firestore";
import { db } from "../firebase-config";

export const estimerValeurBienAvecOpenAI = async (formData, user, nextStep) => {
  const prixAchat = Number(formData.immobilier?.valeur || 0);

  try {
    // ✅ On envoie uniquement les infos du bien immobilier
    const response = await fetch("http://localhost:5050/api/estimation", {
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

    if (
      typeof valeurEstimeeMarche !== "number" ||
      typeof valeurEstimeeBanque !== "number"
    ) {
      alert("❌ L’IA n’a pas pu estimer les valeurs correctement. Réessaie plus tard.");
      return;
    }

    if (user) {
      const ref = doc(db, "dossiers", user.uid);
      await updateDoc(ref, {
        estimationCreditX: {
          valeurEstimeeMarche,
          valeurEstimeeBanque,
        },
      });
    }

    console.log("✅ Estimations sauvegardées dans Firestore :", {
      valeurEstimeeMarche,
      valeurEstimeeBanque,
    });

    const margeToleree = valeurEstimeeMarche * 1.1;

    if (prixAchat <= valeurEstimeeMarche) {
      nextStep();
    } else if (prixAchat <= margeToleree) {
      alert("⚠️ Le prix d'achat dépasse légèrement la valeur estimée du marché. Ce n’est pas bloquant, mais il faudra justifier ce prix.");
      nextStep();
    } else {
      alert("🚫 D’après nos calculs, le prix d'achat dépasse significativement la valeur estimée du marché. Merci de vérifier les données ou fournir une expertise.");
    }

  } catch (error) {
    console.error("❌ Erreur lors de l'estimation automatique :", error);
    alert("❌ Une erreur est survenue lors de l'estimation. Veuillez réessayer plus tard.");
  }
};
