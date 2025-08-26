import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { db } from "../../firebase-config";
import TuneOutlinedIcon from "@mui/icons-material/TuneOutlined";
import SelecteurCreditX from "../../components/SelecteurCreditX";
import { Tooltip, IconButton } from "@mui/material";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";

export default function OccupationDisponibilite() {
  const navigate = useNavigate();
  const { id } = useParams();

  // UI
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Etat local
  const [occupationType, setOccupationType] = useState(null); // "libre" | "occupe_proprietaire" | "occupe_locataire"
  const [remiseMode, setRemiseMode] = useState("immediate"); // "immediate" | "date" | "a_convenir"
  const [remiseDate, setRemiseDate] = useState(""); // "YYYY-MM-DD"
  const [loyerMensuel, setLoyerMensuel] = useState(""); // number (facultatif si locataire)
  const [bailType, setBailType] = useState(null); // "indetermine" | "determine" (facultatif)
  const [bailFin, setBailFin] = useState(""); // "YYYY-MM-DD" si determine

  // Helpers
  const toIntOrNull = (v) => {
    if (v === "" || v == null) return null;
    const n = Number(String(v).replace(",", "."));
    return Number.isFinite(n) ? Math.trunc(n) : null;
  };
  const toFloatOrNull = (v) => {
    if (v === "" || v == null) return null;
    const n = Number(String(v).replace(",", "."));
    return Number.isFinite(n) ? n : null;
  };
  const numPropsInt = { inputMode: "numeric", pattern: "[0-9]*" };
  const numPropsDec = { inputMode: "decimal", pattern: "[0-9]*[.,]?[0-9]*" };

  // Options
  const occupationOptions = useMemo(
    () => [
      { value: "libre", label: "Libre à la remise" },
      { value: "occupe_proprietaire", label: "Occupé par le propriétaire" },
      { value: "occupe_locataire", label: "Occupé par un locataire" },
    ],
    []
  );
  const remiseOptions = useMemo(
    () => [
      { value: "immediate", label: "Immédiate" },
      { value: "date", label: "À une date précise" },
      { value: "a_convenir", label: "À convenir" },
    ],
    []
  );
  const bailOptions = useMemo(
    () => [
      { value: "indetermine", label: "Durée indéterminée" },
      { value: "determine", label: "Durée déterminée (date de fin)" },
    ],
    []
  );

  // Charger Firestore
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const snap = await getDoc(doc(db, "demandes", id));
        const data = snap.exists() ? snap.data() : {};
        const bien = data.bien || {};

        // Occ
        const occ = bien.occupation || {};
        mounted && setOccupationType(occ.type ?? null);

        // Remise clés (stockée en texte libre côté hub)
        // Convention:
        // - "immédiate" si immediate
        // - "à convenir" si a_convenir
        // - "YYYY-MM-DD" si date précise
        const remise = bien.remiseCles ?? "";
        if (remise && /^\d{4}-\d{2}-\d{2}$/.test(String(remise))) {
          mounted && setRemiseMode("date");
          mounted && setRemiseDate(remise);
        } else if (String(remise).toLowerCase().includes("convenir")) {
          mounted && setRemiseMode("a_convenir");
        } else if (String(remise).toLowerCase().includes("imm")) {
          mounted && setRemiseMode("immediate");
        } else {
          // défaut si vide
          mounted && setRemiseMode("immediate");
        }

        // Détails locatifs facultatifs
        mounted && setLoyerMensuel(occ.bail?.loyerMensuel ?? "");
        mounted && setBailType(occ.bail?.type ?? null);
        mounted && setBailFin(occ.bail?.fin ?? "");
      } catch (e) {
        console.error("Load occupation:", e);
      } finally {
        mounted && setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, [id]);

  // Effets de cohérence UI
  // Si pas locataire -> on nettoie les infos bail
  useEffect(() => {
    if (occupationType !== "occupe_locataire") {
      setLoyerMensuel("");
      setBailType(null);
      setBailFin("");
    }
  }, [occupationType]);

  // Si bail indéterminé -> pas de date de fin
  useEffect(() => {
    if (bailType !== "determine") setBailFin("");
  }, [bailType]);

  // Validation minimale (alignée avec computeEtatBien) :
  // - occupationType requis
  // - remiseCles requis (si mode "date", la date doit être fournie)
  const remiseOk = remiseMode === "date" ? !!remiseDate : true;
  const ok = !!occupationType && remiseOk;

  // Save
  const handleSave = async () => {
    if (!ok) return;
    setSaving(true);
    try {
      // Construire remiseCles (string conforme au hub)
      let remiseCles = "immédiate";
      if (remiseMode === "a_convenir") remiseCles = "à convenir";
      if (remiseMode === "date" && remiseDate) remiseCles = remiseDate;

      // Construire occupation
      const occ = {
        type: occupationType,
      };
      if (occupationType === "occupe_locataire") {
        occ.bail = {
          type: bailType || null, // "indetermine" | "determine" | null
          fin: bailType === "determine" ? (remiseDate && remiseMode === "date" ? null : (bailFin || null)) : null,
          // Remarque: on ne force pas une fin = remiseDate; ce sont 2 infos distinctes
          loyerMensuel: toFloatOrNull(loyerMensuel),
        };
      }

      const ref = doc(db, "demandes", id);
      const snap = await getDoc(ref);
      const data = snap.data() || {};
      const next = { ...(data.bien || {}) };

      next.occupation = occ;
      next.remiseCles = remiseCles;

      await updateDoc(ref, { bien: next });
      navigate(`/bien/${id}`);
    } catch (e) {
      console.error("Save occupation:", e);
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
          <h1 className="text-xl font-semibold">Occupation & disponibilité</h1>
        </div>

        <div className="bg-white rounded-2xl p-4 space-y-6">
          {/* Type d’occupation */}
          <SelecteurCreditX
            label="Occupation actuelle"
            value={occupationType}
            onChange={setOccupationType}
            options={occupationOptions}
            placeholder="Sélectionner"
            searchable={false}
            clearable
          />

          {/* Remise des clés */}
          <div>
            <label className="block text-sm mb-1">
              <span className="flex items-center gap-1">
                Remise des clés <span className="text-red-500">*</span>
                <Tooltip title="Date ou modalités de disponibilité du bien.">
                  <IconButton size="small" sx={{ color: "#0047FF", p: 0.5 }}>
                    <InfoOutlinedIcon fontSize="inherit" />
                  </IconButton>
                </Tooltip>
              </span>
            </label>
            <div className="grid grid-cols-2 gap-3">
              <SelecteurCreditX
                label="Mode"
                value={remiseMode}
                onChange={setRemiseMode}
                options={remiseOptions}
                placeholder="Sélectionner"
                searchable={false}
                clearable={false}
              />
              {remiseMode === "date" && (
                <div>
                  <label className="block text-sm mb-1">Date prévue</label>
                  <input
                    type="date"
                    value={remiseDate}
                    onChange={(e) => setRemiseDate(e.target.value)}
                    className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none"
                  />
                </div>
              )}
            </div>
            {!remiseOk && (
              <p className="text-xs text-amber-600 mt-1">Indiquez une date de remise.</p>
            )}
          </div>

          {/* Bloc locataire facultatif */}
          {occupationType === "occupe_locataire" && (
            <div className="space-y-3">
              <div>
                <label className="block text-sm mb-1">Loyer mensuel (CHF)</label>
                <input
                  type="text"
                  {...numPropsDec}
                  value={loyerMensuel}
                  onChange={(e) => setLoyerMensuel(e.target.value)}
                  className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <SelecteurCreditX
                  label="Type de bail"
                  value={bailType}
                  onChange={setBailType}
                  options={bailOptions}
                  placeholder="Sélectionner"
                  searchable={false}
                  clearable
                />
                {bailType === "determine" && (
                  <div>
                    <label className="block text-sm mb-1">Fin de bail</label>
                    <input
                      type="date"
                      value={bailFin}
                      onChange={(e) => setBailFin(e.target.value)}
                      className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none"
                    />
                  </div>
                )}
              </div>
            </div>
          )}

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
              disabled={!ok || saving}
              className={`px-4 py-2 rounded-xl text-white ${
                ok && !saving ? "bg-black hover:bg-gray-900" : "bg-gray-300 cursor-not-allowed"
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
