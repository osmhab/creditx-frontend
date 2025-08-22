// src/DossierBien/BienHub.js
import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { db } from "../../firebase-config";

// ---- Helpers ----
const isFilled = (v) => v !== undefined && v !== null && v !== "";

// Format identique à InformationsPersonnelles.js : gère adresse objet, string, number, bool
const formatValue = (val) => {
  if (val === null || val === undefined) return null;
  if (typeof val === "string") return val || null;
  if (typeof val === "number" || typeof val === "boolean") return String(val);
  if (Array.isArray(val)) return val.length ? val.join(", ") : null;
  if (typeof val === "object") {
    const { formatted, route, streetNumber, postalCode, locality } = val || {};
    const line1 = route && streetNumber ? `${streetNumber} ${route}` : route;
    const line2 = [postalCode, locality].filter(Boolean).join(" ");
    const txt = formatted || [line1, line2].filter(Boolean).join(", ");
    return txt || null;
  }
  return null;
};

// Règle de complétude côté Bien (brouillon robuste, calqué sur ce qu’on a défini ensemble)
function computeEtatBien(bien) {
  if (!bien) return "Action requise";

  // Adresse (objet ou string compat)
  const adr = bien.adresse || bien.adresseFormatted;
  const adrOK = !!(adr && (typeof adr === "string" ? adr.trim() : true));

  // Type & usage (les deux usages sont valides)
  const typeOK = !!bien.typeBien;
  const usageOK = !!bien.usage; // "résidence_principale" ou "rendement"

  // Prix & financement
  const prixOK = typeof bien.prixAchat === "number" && bien.prixAchat > 0;

  // Caractéristiques minimales
  const carOK =
    (typeof bien.surfaceHabitable === "number" && bien.surfaceHabitable > 0) ||
    (typeof bien.surfacePonderee === "number" && bien.surfacePonderee > 0) ||
    ((typeof bien.nbPieces === "number" && bien.nbPieces > 0) &&
      (typeof bien.nbChambres === "number" && bien.nbChambres > 0));

  // PPE requis si appartement (ou si l’utilisateur l’a coché)
  const ppe = bien.ppe || {};
  const ppeRequise = bien.typeBien === "appartement" || ppe.estPPE === true;
  const ppeOK = !ppeRequise || (ppe.chargesMensuelles != null && ppe.nbLots != null);

  // Occupation & disponibilité
  const occ = bien.occupation || {};
  const occOK = !!occ.type;
  const remiseOK = !!bien.remiseCles;

  // ⚠️ Plus de blocage sur l'usage : on accepte "rendement".
  // On garde un blocage si l'IA (plus tard) trouve une valeur bancaire trop basse.
  if (
    bien.estimationCreditX?.valeurBancaire &&
    bien.prixAchat &&
    bien.estimationCreditX.valeurBancaire < 0.85 * bien.prixAchat
  ) {
    return "Critère bloquant";
  }

  // Terminé si tout l’essentiel est rempli
  if (adrOK && typeOK && usageOK && prixOK && carOK && ppeOK && occOK && remiseOK) {
    return "Terminé";
  }
  return "Action requise";
}


export default function BienHub() {
  const navigate = useNavigate();
  const { id } = useParams(); // id = id de la demande
  const [demande, setDemande] = useState(null);
  const [loading, setLoading] = useState(true);
  const bien = useMemo(() => demande?.bien || {}, [demande]);

  // Charger la demande
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const snap = await getDoc(doc(db, "demandes", id));
        if (snap.exists() && mounted) setDemande({ id: snap.id, ...snap.data() });
      } catch (e) {
        console.error("Erreur de chargement du dossier bien :", e);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [id]);

  // Recalcule et pousse etatBien si nécessaire
  useEffect(() => {
    if (!demande) return;
    const nextEtat = computeEtatBien(bien);
    if (demande.etatBien !== nextEtat) {
      (async () => {
        try {
          await updateDoc(doc(db, "demandes", demande.id), { etatBien: nextEtat });
          setDemande((prev) => ({ ...prev, etatBien: nextEtat }));
        } catch (e) {
          console.error("Impossible de mettre à jour etatBien :", e);
        }
      })();
    }
  }, [demande, bien]);

  if (loading) return <div className="p-6 text-base lg:text-sm">Chargement...</div>;
  if (!demande) return <div className="p-6 text-base lg:text-sm">Demande introuvable.</div>;

  const renderLigne = (label, value, path) => {
    const val = formatValue(value);
    const isEmpty = !val;

    return (
      <div
        onClick={() => (path ? navigate(path) : null)}
        className={`flex justify-between items-center px-4 py-3 ${
          path ? "hover:bg-gray-50 cursor-pointer" : "cursor-not-allowed"
        }`}
      >
        <div>
          <p className="text-base lg:text-sm text-black">{label}</p>
          <p
            className={`text-base lg:text-sm ${
              isEmpty ? "text-[#FF5C02]" : path ? "text-gray-800" : "text-gray-400"
            }`}
          >
            {isEmpty ? "Non renseigné" : val}
          </p>
        </div>
        {path && <div className="text-gray-300">›</div>}
      </div>
    );
  };

  // Valeurs affichées (résumé court sur la ligne)
  const ligneAdresse = bien.adresse || bien.adresseFormatted || null;
  const ligneTypeUsage = [
    bien.typeBien ? String(bien.typeBien).replaceAll("_", " ") : null,
    bien.usage ? String(bien.usage).replaceAll("_", " ") : null,
  ]
    .filter(Boolean)
    .join(" • ");
  const lignePrix = isFilled(bien.prixAchat) ? `${Number(bien.prixAchat).toLocaleString("fr-CH")} CHF` : null;
  const ligneCar = (() => {
    const arr = [];
    if (isFilled(bien.surfaceHabitable)) arr.push(`${bien.surfaceHabitable} m² hab.`);
    else if (isFilled(bien.surfacePonderee)) arr.push(`${bien.surfacePonderee} m² pond.`);
    if (isFilled(bien.nbPieces)) arr.push(`${bien.nbPieces} pces`);
    if (isFilled(bien.nbChambres)) arr.push(`${bien.nbChambres} ch.`);
    return arr.join(" • ") || null;
  })();
  const lignePPE =
    bien.ppe?.estPPE === true
      ? `Charges: ${isFilled(bien.ppe?.chargesMensuelles) ? bien.ppe.chargesMensuelles + " CHF/mois" : "—"}`
      : "Non applicable";
  const ligneOcc = bien.occupation?.type
    ? `${String(bien.occupation.type)}${bien.remiseCles ? " • " + bien.remiseCles : ""}`
    : null;

  return (
    <div className="min-h-screen bg-[#FCFCFC] flex justify-center px-4 pt-6">
      <div className="w-full max-w-md">
        <button onClick={() => navigate("/dashboard")} className="text-2xl lg:text-xl mb-6">
          ←
        </button>

        <h1 className="text-2xl lg:text-xl font-bold">Informations sur le bien</h1>
        <p className="text-base lg:text-sm text-gray-500 mb-6">
          Renseignez les éléments clés du bien à financer.
        </p>

        <div className="bg-white rounded-xl divide-y">
          {renderLigne("Adresse du bien", ligneAdresse, `/bien/${id}/adresse`)}
          {renderLigne("Type & usage", ligneTypeUsage || null, `/bien/${id}/type-usage`)}
          {renderLigne("Prix & financement", lignePrix || null, `/bien/${id}/prix`)}
          {renderLigne("Caractéristiques principales", ligneCar || null, `/bien/${id}/caracteristiques`)}
          {renderLigne("Copropriété (PPE)", lignePPE, `/bien/${id}/ppe`)}
          {renderLigne("Occupation & disponibilité", ligneOcc || null, `/bien/${id}/occupation`)}
        </div>

        {/* Badge d’état en pied de page */}
        <div className="mt-6 text-sm">
          {demande.etatBien === "Terminé" && (
            <span className="px-3 py-1 rounded-full bg-green-100 text-green-700">Terminé</span>
          )}
          {demande.etatBien === "Critère bloquant" && (
            <span className="px-3 py-1 rounded-full bg-orange-100 text-orange-700">Critère bloquant</span>
          )}
          {!["Terminé", "Critère bloquant"].includes(demande.etatBien) && (
            <span className="px-3 py-1 rounded-full bg-orange-50 text-orange-700">Action requise</span>
          )}
        </div>

        {/* CTA vers la prochaine étape “Pièces jointes” quand Terminé */}
        {demande.etatBien === "Terminé" && (
          <button
            onClick={() => navigate(`/pieces-jointes/${id}`)}
            className="w-full mt-4 rounded-full py-3 text-sm font-medium bg-black text-white hover:bg-gray-900"
          >
            Continuer vers les pièces jointes
          </button>
        )}
      </div>
    </div>
  );
}
