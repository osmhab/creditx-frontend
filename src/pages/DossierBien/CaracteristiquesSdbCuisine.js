import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { db } from "../../firebase-config";
import TuneOutlinedIcon from "@mui/icons-material/TuneOutlined";
import SelecteurCreditX from "../../components/SelecteurCreditX";
import ModalMessage from "../../components/ModalMessage";
import { Typography, Tooltip, IconButton } from "@mui/material";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import DeleteOutlineOutlinedIcon from "@mui/icons-material/DeleteOutlineOutlined";

export default function CaracteristiquesSdbCuisine() {
  const navigate = useNavigate();
  const { id } = useParams();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [bien, setBien] = useState({});

  const [amenagementCuisine, setAmenagementCuisine] = useState(null);
  const [coutMoyenSdb, setCoutMoyenSdb] = useState(null);
  const [sallesDeBain, setSallesDeBain] = useState([]);
  const [openModalSdbDefs, setOpenModalSdbDefs] = useState(false);

  const cuisineOptions = useMemo(() => [
    { value: "simple", label: "Simple (≤ 20’000)" },
    { value: "standard", label: "Standard (20’000–40’000)" },
    { value: "haut_gamme", label: "Haut de gamme (40’000–60’000)" },
    { value: "premium", label: "Premium (> 60’000)" },
  ], []);
  const coutSdbOptions = useMemo(() => [
    { value: "simple", label: "Simple (≤ 10’000)" },
    { value: "standard", label: "Standard (10’000–30’000)" },
    { value: "haut_gamme", label: "Haut de gamme (30’000–50’000)" },
    { value: "premium", label: "Premium (> 50’000)" },
  ], []);
  const sdbTypeOptions = useMemo(() => [
    { value: "familiale", label: "Familiale" },
    { value: "standard", label: "Standard" },
    { value: "wc_invite", label: "WC invité" },
  ], []);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const snap = await getDoc(doc(db, "demandes", id));
        const data = snap.exists() ? snap.data() : {};
        const b = data.bien || {};
        if (!mounted) return;
        setBien(b);
        setAmenagementCuisine(b.amenagementCuisine ?? null);
        setCoutMoyenSdb(b.coutMoyenSdb ?? null);
        const arr = Array.isArray(b.sallesDeBain) ? b.sallesDeBain : (b.sallesDeBainTypes || []);
        if (Array.isArray(arr) && arr.length > 0) setSallesDeBain(arr.map((t) => ({ type: t })));
        else {
          const d = b.detailsSdb || {};
          const rebuilt = [
            ...Array(Math.max(0, d.familiale || 0)).fill({ type: "familiale" }),
            ...Array(Math.max(0, d.standard || 0)).fill({ type: "standard" }),
            ...Array(Math.max(0, d.wcInvite || 0)).fill({ type: "wc_invite" }),
          ];
          setSallesDeBain(rebuilt);
        }
      } catch (e) {
        console.error(e);
      } finally {
        mounted && setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, [id]);

  const counts = sallesDeBain.reduce(
    (acc, it) => {
      if (it?.type === "familiale") acc.familiale += 1;
      else if (it?.type === "standard") acc.standard += 1;
      else if (it?.type === "wc_invite") acc.wcInvite += 1;
      return acc;
    },
    { familiale: 0, standard: 0, wcInvite: 0 }
  );
  const totalSdb = sallesDeBain.length;

  const addSalleDeBain = () => setSallesDeBain((p) => [...p, { type: "standard" }]);
  const updateSalleDeBain = (index, newType) =>
    setSallesDeBain((p) => p.map((it, i) => (i === index ? { ...it, type: newType } : it)));
  const removeSalleDeBain = (index) => setSallesDeBain((p) => p.filter((_, i) => i !== index));

  const handleSave = async () => {
    setSaving(true);
    try {
      const ref = doc(db, "demandes", id);
      const snap = await getDoc(ref);
      const data = snap.data() || {};
      const next = { ...(data.bien || {}) };

      next.amenagementCuisine = amenagementCuisine || null;
      next.coutMoyenSdb = coutMoyenSdb || null;

      const typesArray = sallesDeBain.map((it) => it.type);
      next.sallesDeBain = typesArray;
      next.detailsSdb = { ...counts };
      next.nbSdb = totalSdb;

      await updateDoc(ref, { bien: next });
      navigate(`/bien/${id}`);
    } catch (e) {
      console.error("save sdb/cuisine:", e);
      alert("Impossible d’enregistrer. Réessaie.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="p-6 text-base">Chargement...</div>;

  return (
    <div className="min-h-screen bg-[#FCFCFC] flex justify-center px-4 pt-6">
      <div className="w-full max-w-md">
        <button onClick={() => navigate(`/bien/${id}`)} className="mb-4">
          <span className="text-xl">←</span>
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="w-9 h-9 rounded-full bg-creditxblue text-white flex items-center justify-center">
            <TuneOutlinedIcon fontSize="small" />
          </div>
          <h1 className="text-xl font-semibold">Caractéristiques — SDB & cuisine</h1>
        </div>

        <div className="bg-white rounded-2xl p-4 space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1">
              <h2 className="text-sm font-medium">Précision par salle de bain</h2>
              <Tooltip title="Définitions des types de salle de bain">
                <IconButton size="small" onClick={() => setOpenModalSdbDefs(true)} sx={{ color: "#0047FF", p: 0.5 }}>
                  <InfoOutlinedIcon fontSize="inherit" />
                </IconButton>
              </Tooltip>
            </div>
            <div className="text-xs text-gray-500">
              Total: <span className="font-medium">{totalSdb}</span> • Familiale {counts.familiale} • Standard {counts.standard} • WC invité {counts.wcInvite}
            </div>
          </div>

          {sallesDeBain.length === 0 && <p className="text-sm text-gray-500">Aucune salle de bain ajoutée.</p>}

          <div className="space-y-2">
            {sallesDeBain.map((item, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <div className="flex-1">
                  <SelecteurCreditX
                    label={`Salle de bain ${idx + 1}`}
                    value={item.type}
                    onChange={(v) => updateSalleDeBain(idx, v)}
                    options={sdbTypeOptions}
                    placeholder="Choisir le type"
                    searchable={false}
                    clearable={false}
                  />
                </div>
                <IconButton onClick={() => removeSalleDeBain(idx)} size="small" sx={{ color: "#ef4444" }}>
                  <DeleteOutlineOutlinedIcon fontSize="small" />
                </IconButton>
              </div>
            ))}
          </div>

          <button
            type="button"
            onClick={addSalleDeBain}
            className="w-full mt-1 px-3 py-2 rounded-xl border border-dashed border-gray-300 text-sm hover:bg-gray-50"
          >
            + Ajouter une salle de bain
          </button>

          <SelecteurCreditX
            label="Coût moyen des salles de bain"
            value={coutMoyenSdb}
            onChange={setCoutMoyenSdb}
            options={coutSdbOptions}
            placeholder="Sélectionner"
            searchable={false}
            clearable
          />
          <SelecteurCreditX
            label="Aménagement de la cuisine"
            value={amenagementCuisine}
            onChange={setAmenagementCuisine}
            options={cuisineOptions}
            placeholder="Sélectionner"
            searchable={false}
            clearable
          />

          <div className="flex items-center gap-3 pt-2">
            <button type="button" onClick={() => navigate(`/bien/${id}`)} className="px-4 py-2 rounded-xl border border-gray-300 text-gray-700">
              Annuler
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className={`px-4 py-2 rounded-xl text-white ${!saving ? "bg-black hover:bg-gray-900" : "bg-gray-300 cursor-not-allowed"}`}
            >
              {saving ? "Enregistrement..." : "Continuer"}
            </button>
          </div>
        </div>

        {/* Modal unique — Définitions SDB */}
        <ModalMessage
          open={openModalSdbDefs}
          onClose={() => setOpenModalSdbDefs(false)}
          onConfirm={() => setOpenModalSdbDefs(false)}
          title="Définitions — salles de bain"
          message={
            <div className="space-y-3">
              <Typography variant="body1"><strong>Familiale</strong> : baignoire <em>et</em> douche + lavabo + WC.</Typography>
              <Typography variant="body1"><strong>Standard</strong> : baignoire <em>ou</em> douche + lavabo + WC.</Typography>
              <Typography variant="body1"><strong>WC invité</strong> : lavabo + WC (sans baignoire ni douche).</Typography>
            </div>
          }
          confirmText="Compris" onlyConfirm showCloseIcon iconType="knowledge"
        />
      </div>
    </div>
  );
}
