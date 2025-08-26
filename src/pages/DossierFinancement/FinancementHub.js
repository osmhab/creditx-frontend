import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { db } from "../../firebase-config";

// ---- Helpers ----
const isFilled = (v) => v !== undefined && v !== null && v !== "";
const fmtCHF = (n) =>
  typeof n === "number" && !Number.isNaN(n)
    ? `${Number(n).toLocaleString("fr-CH")} CHF`
    : null;

const formatValue = (val) => {
  if (val === null || val === undefined) return null;
  if (typeof val === "string") return val || null;
  if (typeof val === "number" || typeof val === "boolean") return String(val);
  if (Array.isArray(val)) return val.length ? val.join(", ") : null;
  if (typeof val === "object") return null; // on affiche des résumés à la place
  return null;
};

// ---- Règle de complétude côté Financement (souple et explicite)
function computeEtatFinancement(demande) {
  if (!demande) return "Action requise";
  const bien = demande.bien || {};
  const fin = demande.financement || {};

  // Eléments clés attendus
  const conditionsOK =
    !!fin.conditions?.typeTaux &&
    (typeof fin.conditions?.dureeAns === "number" && fin.conditions.dureeAns > 0);

  // Apport total : soit valeur agrégée, soit somme des sources
  const sources = fin.sources || {};
  const sommeSources =
    ["epargne", "pilier2Retrait", "pilier2Nantissement", "pilier3a", "donFamilial", "autres"]
      .map((k) => Number(fin.sources?.[k] || 0))
      .reduce((a, b) => a + b, 0);
  const apportTotal = typeof fin.apportTotal === "number" ? fin.apportTotal : sommeSources;

  // Montant d'hypothèque : saisi ou déductible du prix si connu
  const prix = typeof bien.prixAchat === "number" ? bien.prixAchat : null;
  const hypMontant =
    typeof fin.hypotheques?.montantTotal === "number"
      ? fin.hypotheques.montantTotal
      : (prix != null && apportTotal >= 0 ? Math.max(prix - apportTotal, 0) : null);

  const financementOK = typeof hypMontant === "number";

  // Suffisant pour considérer "Terminé"
  if (conditionsOK && financementOK) return "Terminé";
  return "Action requise";
}

export default function FinancementHub() {
  const navigate = useNavigate();
  const { id } = useParams(); // id de la demande
  const [demande, setDemande] = useState(null);
  const [loading, setLoading] = useState(true);

  const bien = useMemo(() => demande?.bien || {}, [demande]);
  const fin = useMemo(() => demande?.financement || {}, [demande]);

  // Charger la demande
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const snap = await getDoc(doc(db, "demandes", id));
        if (snap.exists() && mounted) setDemande({ id: snap.id, ...snap.data() });
      } catch (e) {
        console.error("Erreur de chargement du dossier financement :", e);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [id]);

  // Recalcule et pousse etatFinancement si nécessaire
  useEffect(() => {
    if (!demande) return;
    const nextEtat = computeEtatFinancement(demande);
    if (demande.etatFinancement !== nextEtat) {
      (async () => {
        try {
          await updateDoc(doc(db, "demandes", demande.id), { etatFinancement: nextEtat });
          setDemande((prev) => ({ ...prev, etatFinancement: nextEtat }));
        } catch (e) {
          console.error("Impossible de mettre à jour etatFinancement :", e);
        }
      })();
    }
  }, [demande]);

  if (loading) return <div className="p-6 text-base lg:text-sm">Chargement...</div>;
  if (!demande) return <div className="p-6 text-base lg:text-sm">Demande introuvable.</div>;

  // Rendu générique d'une ligne
  const renderLigne = (label, value, path) => {
    const val = formatValue(value) ?? value; // on passe déjà un texte résumé
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

  // --- Résumés des 4 sous-sections ---
  const resumeBudgetApport = (() => {
    const sources = fin.sources || {};
    const somme =
      ["epargne", "pilier2Retrait", "pilier2Nantissement", "pilier3a", "donFamilial", "autres"]
        .map((k) => Number(sources[k] || 0))
        .reduce((a, b) => a + b, 0);
    const apport = typeof fin.apportTotal === "number" ? fin.apportTotal : (somme > 0 ? somme : null);
    const prix = typeof bien.prixAchat === "number" ? bien.prixAchat : null;

    const parts = [];
    if (apport != null) parts.push(`Apport ${fmtCHF(apport)}`);
    if (prix != null && apport != null) {
      const ratio = prix > 0 ? Math.round((apport / prix) * 100) : null;
      if (ratio != null) parts.push(`(${ratio}%)`);
    }
    return parts.join(" ") || null;
  })();

  const resumeHypAmort = (() => {
    const h = fin.hypotheques || {};
    const prix = typeof bien.prixAchat === "number" ? bien.prixAchat : null;
    const sources = fin.sources || {};
    const sommeSources =
      ["epargne", "pilier2Retrait", "pilier2Nantissement", "pilier3a", "donFamilial", "autres"]
        .map((k) => Number(sources[k] || 0))
        .reduce((a, b) => a + b, 0);
    const apport = typeof fin.apportTotal === "number" ? fin.apportTotal : (sommeSources > 0 ? sommeSources : null);
    const hypTotal =
      typeof h.montantTotal === "number" ? h.montantTotal :
      (prix != null && apport != null ? Math.max(prix - apport, 0) : null);

    const parts = [];
    if (hypTotal != null) parts.push(`Hypothèque ${fmtCHF(hypTotal)}`);
    if (typeof h.premierRang === "number" || typeof h.deuxiemeRang === "number") {
      const r1 = h.premierRang != null ? fmtCHF(h.premierRang) : null;
      const r2 = h.deuxiemeRang != null ? fmtCHF(h.deuxiemeRang) : null;
      parts.push(`(1er ${r1 || "—"} / 2e ${r2 || "—"})`);
    }
    if (fin.amortissement?.type) {
      parts.push(`Amort. ${String(fin.amortissement.type).replaceAll("_", " ")}`);
    }
    return parts.join(" • ") || null;
  })();

  const resumeFraisReserves = (() => {
    const f = fin.frais || {};
    const parts = [];
    if (typeof f.fraisAchatCHF === "number") parts.push(`Frais achat ${fmtCHF(f.fraisAchatCHF)}`);
    if (typeof f.reservesCHF === "number") parts.push(`Réserves ${fmtCHF(f.reservesCHF)}`);
    return parts.join(" • ") || null;
  })();

  const resumeConditions = (() => {
    const c = fin.conditions || {};
    const parts = [];
    if (c.typeTaux) parts.push(`Taux ${String(c.typeTaux).toUpperCase()}`);
    if (typeof c.dureeAns === "number") parts.push(`${c.dureeAns} ans`);
    if (typeof c.tauxInteretPct === "number") parts.push(`${c.tauxInteretPct}%`);
    return parts.join(" • ") || null;
  })();

  return (
    <div className="min-h-screen bg-[#FCFCFC] flex justify-center px-4 pt-6">
      <div className="w-full max-w-md">
        <button onClick={() => navigate("/dashboard")} className="text-2xl lg:text-xl mb-6">
          ←
        </button>

        <h1 className="text-2xl lg:text-xl font-bold">Financement</h1>
        <p className="text-base lg:text-sm text-gray-500 mb-6">
          Renseignez votre montage financier et vos préférences de taux.
        </p>

        <div className="bg-white rounded-xl divide-y">
          {renderLigne("Budget & apport", resumeBudgetApport, `/financement/${id}/apport`)}
          {renderLigne("Hypothèques & amortissement", resumeHypAmort, `/financement/${id}/hypotheques`)}
          {renderLigne("Frais & réserves", resumeFraisReserves, `/financement/${id}/frais`)}
          {renderLigne("Préférences & conditions", resumeConditions, `/financement/${id}/conditions`)}
        </div>

        {/* Badge d’état en pied de page */}
        <div className="mt-6 text-sm">
          {demande.etatFinancement === "Terminé" && (
            <span className="px-3 py-1 rounded-full bg-green-100 text-green-700">Terminé</span>
          )}
          {demande.etatFinancement !== "Terminé" && (
            <span className="px-3 py-1 rounded-full bg-orange-50 text-orange-700">Action requise</span>
          )}
        </div>
      </div>
    </div>
  );
}
