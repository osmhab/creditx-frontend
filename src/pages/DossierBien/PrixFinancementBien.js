// src/DossierBien/PrixFinancementBien.js
import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { db } from "../../firebase-config";
import PaidOutlinedIcon from "@mui/icons-material/PaidOutlined";
import ChampMontantSimple from "../../components/ChampMontantSimple";

export default function PrixFinancementBien() {
  const navigate = useNavigate();
  const { id } = useParams();

  const [usage, setUsage] = useState("résidence_principale"); // lu depuis bien.usage (info)
  const [prixAchat, setPrixAchat] = useState(null);           // CHF (requis)
  const [montantTravaux, setMontantTravaux] = useState(null); // CHF (optionnel)
  const [fraisAchatPct, setFraisAchatPct] = useState(3.0);    // % (info ONLY)
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // évite d’envoyer null à ChampMontantSimple (qui .toString())
  const normalizeAmount = (v) =>
    v === "" || v === null || v === undefined ? null : Number(v);

  // Charger valeurs existantes
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const snap = await getDoc(doc(db, "demandes", id));
        if (!snap.exists() || !mounted) return;
        const data = snap.data() || {};
        const bien = data.bien || {};

        setUsage(bien.usage || "résidence_principale");
        setPrixAchat(typeof bien.prixAchat === "number" ? bien.prixAchat : null);
        setMontantTravaux(
          typeof bien.montantTravaux === "number" ? bien.montantTravaux : null
        );
        setFraisAchatPct(
          typeof bien.fraisAchatPct === "number" ? bien.fraisAchatPct : 3.0
        );
      } catch (e) {
        console.error("Erreur chargement Prix & financement :", e);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, [id]);


  
  // Calculs (les frais sont informatifs; non inclus)
const fraisAchatMontant = useMemo(() => {
  if (!prixAchat || fraisAchatPct === "" || fraisAchatPct == null) return 0;
  return Math.round((Number(prixAchat) * Number(fraisAchatPct)) / 100);
}, [prixAchat, fraisAchatPct]);

// Sous-total finançable = prix + travaux (sans frais)
const montantProjet = useMemo(() => {
  const travaux = Number(montantTravaux || 0);
  const prix = Number(prixAchat || 0);
  return prix + travaux;
}, [prixAchat, montantTravaux]);

// Info : prêt maximal (80% du projet) — non stocké en base
const pretMaxAutorise = useMemo(() => {
  if (!montantProjet) return 0;
  return Math.round(montantProjet * 0.8);
}, [montantProjet]);


  const valid =
    typeof prixAchat === "number" && prixAchat > 0 &&
    (montantTravaux === null || montantTravaux >= 0) &&
    (typeof fraisAchatPct === "number" && fraisAchatPct >= 0 && fraisAchatPct <= 10);

  const handleSave = async () => {
    if (!valid) return;
    setSaving(true);
    try {
      const ref = doc(db, "demandes", id);
      const snap = await getDoc(ref);
      const data = snap.data() || {};
      const bien = { ...(data.bien || {}) };

      bien.prixAchat = Number(prixAchat);
      bien.montantTravaux = montantTravaux === null ? null : Number(montantTravaux);

      // Frais d’achat — pure info (jamais ajoutés)
      bien.fraisAchatPct = Number(fraisAchatPct);
      bien.fraisAchatMontant = Number(fraisAchatMontant);

      // Sous-total finançable (hors frais)
      bien.montantProjet = Number(montantProjet);


      await updateDoc(ref, { bien });
      navigate(`/bien/${id}`); // retour hub
    } catch (e) {
      console.error("Erreur sauvegarde Prix & financement :", e);
      alert("Impossible d’enregistrer. Réessaie.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="p-6 text-base lg:text-sm">Chargement...</div>;

  const helpText =
    usage === "rendement"
      ? "Bien de rendement : les règles de faisabilité et les pièces à fournir seront adaptées plus loin."
      : "Résidence principale : les étapes suivantes appliqueront les critères standard des banques.";

  return (
    <div className="min-h-screen bg-[#FCFCFC] flex justify-center px-4 pt-6">
      <div className="w-full max-w-md">
        <button onClick={() => navigate(`/bien/${id}`)} className="mb-4">
          <span className="text-xl">←</span>
        </button>

        {/* Header avec icône */}
        <div className="flex items-center gap-3 mb-4">
          <div className="w-9 h-9 rounded-full bg-creditxblue text-white flex items-center justify-center">
            <PaidOutlinedIcon fontSize="small" />
          </div>
          <h1 className="text-xl font-semibold">Prix & financement</h1>
        </div>

        <div className="text-xs rounded-xl bg-blue-50 text-blue-700 p-3 mb-3">
          {helpText}
        </div>

        <div className="bg-white rounded-2xl p-4 space-y-5">
          {/* Prix d’achat (requis) */}
          <ChampMontantSimple
            label="Prix d’achat"
            value={prixAchat ?? ""} // jamais null pour éviter .toString sur null
            onChange={(v) => setPrixAchat(normalizeAmount(v))}
            required
          />

          {/* Travaux (optionnel) */}
          <ChampMontantSimple
            label="Travaux (optionnel)"
            value={montantTravaux ?? ""} // jamais null
            onChange={(v) => setMontantTravaux(normalizeAmount(v))}
            required={false}
          />

          {/* Frais d’achat — INFO UNIQUEMENT */}
          <div>
            <label className="block text-sm mb-1">Frais d’achat (en % — informatif)</label>
            <input
              type="number"
              step="0.1"
              min="0"
              max="10"
              value={fraisAchatPct}
              onChange={(e) =>
                setFraisAchatPct(e.target.value === "" ? "" : Number(e.target.value))
              }
              className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none"
            />
            <p className="text-xs text-gray-500 mt-1">
              Estimation (non financée) : {fraisAchatMontant?.toLocaleString("fr-CH")} CHF
            </p>
            <p className="text-[11px] text-gray-400 mt-1">
              Les frais d’achat (notaire, droits, etc.) ne sont pas ajoutés au prix du bien et ne sont pas financés par la banque.
            </p>
          </div>

          {/* Récapitulatif (frais exclus) */}
          <div className="rounded-xl bg-[#FAFAFA] border border-gray-100 p-3 text-sm">
            <div className="flex justify-between">
              <span>Prix d’achat</span>
              <strong>{Number(prixAchat || 0).toLocaleString("fr-CH")} CHF</strong>
            </div>
            <div className="flex justify-between">
              <span>+ Travaux</span>
              <strong>{Number(montantTravaux || 0).toLocaleString("fr-CH")} CHF</strong>
            </div>
            <div className="flex justify-between pt-2 border-t mt-2">
              <span>Sous-total finançable (hors frais)</span>
              <strong>{montantProjet?.toLocaleString("fr-CH")} CHF</strong>
            </div>
            <div className="flex justify-between">
                <span className="text-gray-500">Prêt maximal autorisé (80%)</span>
                <strong className="text-gray-500">
                    {pretMaxAutorise?.toLocaleString("fr-CH")} CHF
                </strong>
            </div>


            <div className="flex justify-between">
              <span className="text-gray-500">Frais d’achat (info, non financés)</span>
              <strong className="text-gray-500">
                {fraisAchatMontant?.toLocaleString("fr-CH")} CHF
              </strong>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3 pt-2">
            <button
              type="button"
              onClick={() => navigate(`/bien/${id}`)}
              className="px-4 py-2 rounded-xl border border-gray-300 text-gray-700"
            >
              Annuler
            </button>

            <button
              type="button"
              onClick={handleSave}
              disabled={!valid || saving}
              className={`px-4 py-2 rounded-xl text-white ${
                valid && !saving ? "bg-black hover:bg-gray-900" : "bg-gray-300 cursor-not-allowed"
              }`}
            >
              {saving ? "Enregistrement..." : "Continuer"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
