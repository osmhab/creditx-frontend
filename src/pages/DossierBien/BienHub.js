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

// Règle de complétude côté Bien
function computeEtatBien(bien) {
  if (!bien) return "Action requise";

  const adr = bien.adresse || bien.adresseFormatted;
  const adrOK = !!(adr && (typeof adr === "string" ? adr.trim() : true));
  const typeOK = !!bien.typeBien;
  const usageOK = !!bien.usage;
  const prixOK = typeof bien.prixAchat === "number" && bien.prixAchat > 0;

  const carOK =
    (typeof bien.surfaceHabitable === "number" && bien.surfaceHabitable > 0) ||
    (typeof bien.surfacePonderee === "number" && bien.surfacePonderee > 0) ||
    ((typeof bien.nbPieces === "number" && bien.nbPieces > 0) &&
      (typeof bien.nbChambres === "number" && bien.nbChambres > 0));

  const ppe = bien.ppe || {};
  const isApp = String(bien.typeBien || "").toLowerCase().includes("appartement");
  const ppeRequise = ppe.estPPE === false ? false : (isApp || ppe.estPPE === true);


  const ppeOK = !ppeRequise || (ppe.chargesMensuelles != null && ppe.nbLots != null);

  const occ = bien.occupation || {};
  const occOK = !!occ.type;
  const remiseOK = !!bien.remiseCles;

  if (
    bien.estimationCreditX?.valeurBancaire &&
    bien.prixAchat &&
    bien.estimationCreditX.valeurBancaire < 0.85 * bien.prixAchat
  ) {
    return "Critère bloquant";
  }

  if (adrOK && typeOK && usageOK && prixOK && carOK && ppeOK && occOK && remiseOK) {
    return "Terminé";
  }
  return "Action requise";
}

export default function BienHub() {
  const navigate = useNavigate();
  const { id } = useParams();
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
    return () => { mounted = false; };
  }, [id]);

  // Recalcul état
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

  // Résumés des blocs “Caractéristiques — …”
  const resumeSurfaces = (() => {
    const arr = [];
    if (isFilled(bien.surfaceHabitable)) arr.push(`${bien.surfaceHabitable} m² hab.`);
    else if (isFilled(bien.surfaceHabitableBrute)) arr.push(`${bien.surfaceHabitableBrute} m² brute`);
    else if (isFilled(bien.surfaceHabitableNette)) arr.push(`${bien.surfaceHabitableNette} m² nette`);
    if (isFilled(bien.surfacePonderee)) arr.push(`${bien.surfacePonderee} m² pond.`);
    if (isFilled(bien.nbPieces)) arr.push(`${bien.nbPieces} pces`);
    if (isFilled(bien.nbChambres)) arr.push(`${bien.nbChambres} ch.`);
    return arr.join(" • ") || null;
  })();

  const resumeSdbCuisine = (() => {
    const details = bien.detailsSdb || {};
    const total = Number(bien.nbSdb) || 0;
    const parts = [];
    if (total) parts.push(`SDB ${total}`);
    const f = details.familiale || 0, s = details.standard || 0, w = details.wcInvite || 0;
    if (f || s || w) parts.push(`(F${f}/S${s}/WC${w})`);
    if (bien.coutMoyenSdb) parts.push(`Coût ${String(bien.coutMoyenSdb).replaceAll("_"," ")}`);
    if (bien.amenagementCuisine) parts.push(`Cuisine ${String(bien.amenagementCuisine).replaceAll("_"," ")}`);
    return parts.join(" • ") || null;
  })();

  const resumeEtagesPk = (() => {
  const isAppLocal = String(bien.typeBien || "").toLowerCase().includes("appartement");
  const parts = [];
  if (isAppLocal && isFilled(bien.etage)) parts.push(`Étage ${bien.etage}`);
  if (isFilled(bien.etagesImmeuble)) parts.push(`${bien.etagesImmeuble} étages immeuble`);
  if (isAppLocal && typeof bien.ascenseur === "boolean")
    parts.push(`Ascenseur ${bien.ascenseur ? "oui" : "non"}`);
  const pi = bien.parkings?.interieur ?? null;
  const pe = bien.parkings?.exterieur ?? null;
  if (isFilled(pi) || isFilled(pe)) parts.push(`Pk int ${pi || 0} / ext ${pe || 0}`);
  return parts.join(" • ") || null;
})();


  const resumeEtatEnergie = (() => {
    const parts = [];
    if (bien.etatGeneral) parts.push(`État ${String(bien.etatGeneral).replaceAll("_"," ")}`);
    if (bien.chauffage) parts.push(`Chauffage ${String(bien.chauffage).replaceAll("_"," ")}`);
    if (isFilled(bien.anneeChauffage)) parts.push(`Année ${bien.anneeChauffage}`);
    if (typeof bien.panneauxSolaires === "boolean") parts.push(`Solaires ${bien.panneauxSolaires ? "oui" : "non"}`);
    if (isFilled(bien.garagesBox)) parts.push(`Garage/box ${bien.garagesBox}`);
    if (isFilled(bien.surfaceTerrain)) parts.push(`Terrain ${bien.surfaceTerrain} m²`);
    return parts.join(" • ") || null;
  })();

  // Valeurs “générales” déjà présentes

  const isAppartement = String(bien.typeBien || "").toLowerCase().includes("appartement");
  const showPPE = (isAppartement || bien.ppe?.estPPE === true) && bien.ppe?.estPPE !== false;

  const ligneAdresse = bien.adresse || bien.adresseFormatted || null;
  const ligneTypeUsage = [
    bien.typeBien ? String(bien.typeBien).replaceAll("_", " ") : null,
    bien.usage ? String(bien.usage).replaceAll("_", " ") : null,
  ].filter(Boolean).join(" • ");
  const lignePrix = isFilled(bien.prixAchat) ? `${Number(bien.prixAchat).toLocaleString("fr-CH")} CHF` : null;
  const lignePPE = (() => {
  const ppe = bien.ppe || {};
  if (ppe?.estPPE === false) return "PPE : Non";
  const parts = [];
  if (isFilled(ppe.chargesMensuelles)) {
    parts.push(`Charges: ${Number(ppe.chargesMensuelles).toLocaleString("fr-CH")} CHF/mois`);
  }
  if (isFilled(ppe.nbLots)) {
    parts.push(`Lots: ${ppe.nbLots}`);
  }
  return parts.join(" • ") || "Non renseigné";
})();


const occLabel = (t) => String(t).replaceAll("_", " ");
const ligneOcc = bien.occupation?.type
  ? `${occLabel(bien.occupation.type)}${bien.remiseCles ? " • " + bien.remiseCles : ""}`
  : null;


  return (
    <div className="min-h-screen bg-[#FCFCFC] flex justify-center px-4 pt-6">
      <div className="w-full max-w-md">
        <button onClick={() => navigate("/dashboard")} className="text-2xl lg:text-xl mb-6">←</button>

        <h1 className="text-2xl lg:text-xl font-bold">Informations sur le bien</h1>
        <p className="text-base lg:text-sm text-gray-500 mb-6">
          Renseignez les éléments clés du bien à financer.
        </p>

        <div className="bg-white rounded-xl divide-y">
          {renderLigne("Adresse du bien", ligneAdresse, `/bien/${id}/adresse`)}
          {renderLigne("Type & usage", ligneTypeUsage || null, `/bien/${id}/type-usage`)}
          {renderLigne("Prix & financement", lignePrix || null, `/bien/${id}/prix`)}

          {/* --- Nouveau : 4 sous-lignes au même style pour les caractéristiques --- */}
          {renderLigne("Caractéristiques — Surfaces & pièces", resumeSurfaces, `/bien/${id}/caracteristiques/surfaces`)}
          {renderLigne("Caractéristiques — SDB & cuisine", resumeSdbCuisine, `/bien/${id}/caracteristiques/sdb-cuisine`)}
          {renderLigne("Caractéristiques — Étages & parkings", resumeEtagesPk, `/bien/${id}/caracteristiques/etages-parkings`)}
          {renderLigne("Caractéristiques — État, chauffage & énergie", resumeEtatEnergie, `/bien/${id}/caracteristiques/etat-chauffage-energie`)}

          {renderLigne("Copropriété (PPE)", lignePPE, `/bien/${id}/ppe`)}
          {renderLigne("Occupation & disponibilité", ligneOcc || null, `/bien/${id}/occupation`)}
        </div>

        {/* Badge d’état */}
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
