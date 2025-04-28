import { doc, updateDoc } from "firebase/firestore";
import { db } from "../firebase-config";

export const estimerValeurBienAvecOpenAI = async (formData, user, nextStep) => {
  const prixAchat = Number(formData.prixAchat || 0);

  try {
    // Appel au backend Express (proxy vers OpenAI)
    const response = await fetch("http://localhost:5000/api/estimation", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ formData }),
    });

    if (!response.ok) {
      throw new Error("Réponse backend non valide");
    }

    const data = await response.json();

    console.log("🧾 Réponse brute reçue du backend :", data);

    const { valeurEstimeeMarche, valeurEstimeeBanque } = data;

    // Sécurité : vérifie que ce sont bien des nombres
    if (
      typeof valeurEstimeeMarche !== "number" ||
      typeof valeurEstimeeBanque !== "number"
    ) {
      alert("❌ L’IA n’a pas pu estimer les valeurs correctement. Réessaie plus tard.");
      return;
    }

    // Enregistrement dans Firestore
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

    // Logique de validation par rapport au prix d'achat
    const margeToleree = valeurEstimeeMarche * 1.10;

if (prixAchat <= valeurEstimeeMarche) {
  // ✅ Prix d’achat en dessous ou égal → tout bon
  nextStep();
} else if (prixAchat <= margeToleree) {
  // ⚠️ Petite marge tolérée
  alert("⚠️ Le prix d'achat dépasse légèrement la valeur estimée du marché. Ce n’est pas bloquant, mais il faudra justifier ce prix.");
  nextStep();
} else {
  // ❌ Trop élevé par rapport à la valeur du marché
  alert("🚫 D’après nos calculs, le prix d'achat dépasse significativement la valeur estimée du marché. Merci de vérifier les données ou fournir une expertise.");
}


  } catch (error) {
    console.error("❌ Erreur lors de l'estimation automatique :", error);
    alert("❌ Une erreur est survenue lors de l'estimation. Veuillez réessayer plus tard.");
  }
};
