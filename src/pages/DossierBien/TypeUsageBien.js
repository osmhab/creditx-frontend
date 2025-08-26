// src/DossierBien/TypeUsageBien.js
import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { db } from "../../firebase-config";
import SelecteurCreditX from "../../components/SelecteurCreditX";
import HomeWorkOutlinedIcon from "@mui/icons-material/HomeWorkOutlined";

/**
 * Type & usage du bien
 * - Reprend le pattern d'InformationsCivilite (sélecteurs + Continuer)
 * - Sauvegarde dans `demandes/{id}.bien` : { typeBien, sousTypeBien, usage }
 * - Retour flèche => /bien/:id
 */

const TYPE_OPTIONS = [
  { value: "appartement", label: "Appartement (PPE)" },
  { value: "maison_individuelle", label: "Maison individuelle" },
  { value: "villa_mitoyenne", label: "Villa mitoyenne / jumelée" },
  { value: "maison_village", label: "Maison de village" },

];

const SOUS_TYPES = {
  appartement: [
    "Appartement standard",
    "Attique",
    "Duplex",
    "Rez avec jardin",
    "Loft",
  ],
  maison_individuelle: [
    "Villa individuelle",
    "Villa contemporaine",
    "Chalet",
    "Pavillon",
  ],
  villa_mitoyenne: [
    "Villa jumelle",
    "Villa mitoyenne (rangée)",
  ],
  maison_village: [
    "Maison de village",
    "Ferme rénovée",
  ],
};

const USAGE_OPTIONS = [
  { value: "résidence_principale", label: "Résidence principale (usage propre)" },
  { value: "rendement", label: "Bien de rendement (locatif)" },
];

export default function TypeUsageBien() {
  const navigate = useNavigate();
  const { id } = useParams();

  const [typeBien, setTypeBien] = useState(null);
  const [sousTypeBien, setSousTypeBien] = useState(null);
  const [usage, setUsage] = useState("résidence_principale");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Charger valeurs existantes
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const snap = await getDoc(doc(db, "demandes", id));
        if (snap.exists() && mounted) {
          const data = snap.data() || {};
          const bien = data.bien || {};
          setTypeBien(bien.typeBien || null);
          setSousTypeBien(bien.sousTypeBien || null);
          setUsage(bien.usage || "résidence_principale");
        }
      } catch (e) {
        console.error("Erreur chargement Type & usage:", e);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => (mounted = false);
  }, [id]);

  // Liste sous-types dépendant du type
  const sousTypeOptions = useMemo(() => {
    if (!typeBien) return [];
    const arr = SOUS_TYPES[typeBien] || [];
    return arr.map((s) => ({ value: s, label: s }));
  }, [typeBien]);

  // Reset sous-type si le type change
  useEffect(() => {
    setSousTypeBien(null);
  }, [typeBien]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const ref = doc(db, "demandes", id);
      const snap = await getDoc(ref);
      const data = snap.data() || {};
      const bien = { ...(data.bien || {}) };

      bien.typeBien = typeBien;
      bien.sousTypeBien = sousTypeBien;
      bien.usage = usage;

      await updateDoc(ref, { bien });

      // Retour au hub (le hub recalcule etatBien)
      navigate(`/bien/${id}`);
    } catch (e) {
      console.error("Erreur sauvegarde Type & usage:", e);
      alert("Impossible d’enregistrer. Réessaie.");
    } finally {
      setSaving(false);
    }
  };

  const valid = Boolean(typeBien && usage);

  if (loading) return <div className="p-6 text-base lg:text-sm">Chargement...</div>;

  const showWarning =
    usage && usage !== "résidence_principale"; // CreditX ne traite que l’usage propre

  return (
    <div className="min-h-screen bg-[#FCFCFC] flex justify-center px-4 pt-6">
      <div className="w-full max-w-md">
        <button onClick={() => navigate(`/bien/${id}`)} className="mb-4">
          <span className="text-xl">←</span>
        </button>

        {/* Header avec icône (pattern AdresseEmployeur) */}
        <div className="flex items-center gap-3 mb-4">
          <div className="w-9 h-9 rounded-full bg-creditxblue text-white flex items-center justify-center">
            <HomeWorkOutlinedIcon fontSize="small" />
          </div>
          <h1 className="text-xl font-semibold">Type & usage</h1>
        </div>

        <div className="bg-white rounded-2xl p-4 space-y-5">
          <SelecteurCreditX
            label="Type de bien"
            value={typeBien}
            onChange={setTypeBien}
            options={TYPE_OPTIONS}
            placeholder="Sélectionner un type"
            required
            searchable={false}
          />

          <SelecteurCreditX
            label="Sous-type"
            value={sousTypeBien}
            onChange={setSousTypeBien}
            options={sousTypeOptions}
            placeholder="Sélectionner un sous-type"
            disabled={!typeBien}
            searchable={false}
            clearable
          />

          <SelecteurCreditX
            label="Usage du bien"
            value={usage}
            onChange={setUsage}
            options={USAGE_OPTIONS}
            placeholder="Sélectionner l’usage"
            required
            searchable={false}
          />

          

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
                valid && !saving
                  ? "bg-black hover:bg-gray-900"
                  : "bg-gray-300 cursor-not-allowed"
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
