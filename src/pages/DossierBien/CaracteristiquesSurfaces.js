import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { db } from "../../firebase-config";
import TuneOutlinedIcon from "@mui/icons-material/TuneOutlined";
import ModalMessage from "../../components/ModalMessage";
import BlocExemple from "../../components/BlocExemple";
import { Typography, Tooltip, IconButton } from "@mui/material";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";

export default function CaracteristiquesSurfaces() {
  const navigate = useNavigate();
  const { id } = useParams();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [bien, setBien] = useState({});

  const [surfaceHabitableBrute, setSHB] = useState("");
  const [surfaceHabitableNette, setSHN] = useState("");
  const [surfacePonderee, setSP] = useState("");
  const [surfaceTerrain, setSurfaceTerrain] = useState("");
  const [nbPieces, setNbPieces] = useState("");
  const [nbChambres, setNbChambres] = useState("");

  const [openModalBrute, setOpenModalBrute] = useState(false);
  const [openModalNette, setOpenModalNette] = useState(false);
  const [openModalPonderee, setOpenModalPonderee] = useState(false);

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

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const snap = await getDoc(doc(db, "demandes", id));
        const data = snap.exists() ? snap.data() : {};
        const b = data.bien || {};
        if (!mounted) return;
        setBien(b);
        setSHB(b.surfaceHabitableBrute ?? b.surfaceHabitable ?? "");
        setSHN(b.surfaceHabitableNette ?? "");
        setSP(b.surfacePonderee ?? "");
        setSurfaceTerrain(b.surfaceTerrain ?? "");
        setNbPieces(b.nbPieces ?? "");
        setNbChambres(b.nbChambres ?? "");
      } catch (e) {
        console.error(e);
      } finally {
        mounted && setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, [id]);

  const numPropsInt = { inputMode: "numeric", pattern: "[0-9]*" };
  const numPropsDec = { inputMode: "decimal", pattern: "[0-9]*[.,]?[0-9]*" };

  const baseOk =
    (toFloatOrNull(surfaceHabitableBrute) > 0 || toFloatOrNull(surfaceHabitableNette) > 0) ||
    toFloatOrNull(surfacePonderee) > 0 ||
    (toFloatOrNull(nbPieces) > 0 && toIntOrNull(nbChambres) > 0);

  const handleSave = async () => {
    if (!baseOk) return;
    setSaving(true);
    try {
      const ref = doc(db, "demandes", id);
      const snap = await getDoc(ref);
      const data = snap.data() || {};
      const next = { ...(data.bien || {}) };

      next.surfaceHabitableBrute = toFloatOrNull(surfaceHabitableBrute);
      next.surfaceHabitableNette = toFloatOrNull(surfaceHabitableNette);
      next.surfacePonderee = toFloatOrNull(surfacePonderee);
      next.surfaceTerrain = toFloatOrNull(surfaceTerrain);

      // fallback surfaceHabitable (nette > brute)
      next.surfaceHabitable =
        toFloatOrNull(surfaceHabitableNette) ??
        toFloatOrNull(surfaceHabitableBrute) ??
        null;

      next.nbPieces = toFloatOrNull(nbPieces);
      next.nbChambres = toIntOrNull(nbChambres);

      await updateDoc(ref, { bien: next });
      navigate(`/bien/${id}`);
    } catch (e) {
      console.error("save surfaces:", e);
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
          <h1 className="text-xl font-semibold">Caractéristiques — Surfaces & pièces</h1>
        </div>

        <div className="bg-white rounded-2xl p-4 space-y-6">
          <div className="space-y-3">
            <div>
              <label className="block text-sm mb-1">
                <span className="flex items-center gap-1">
                  Surface habitable brute (m²) <span className="text-red-500">*</span>
                  <Tooltip title="Qu’est-ce que la surface brute ?">
                    <IconButton size="small" onClick={() => setOpenModalBrute(true)} sx={{ color: "#0047FF", p: 0.5 }}>
                      <InfoOutlinedIcon fontSize="inherit" />
                    </IconButton>
                  </Tooltip>
                </span>
              </label>
              <input
                type="text"
                {...numPropsDec}
                value={surfaceHabitableBrute}
                onChange={(e) => setSHB(e.target.value)}
                className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none"
              />
            </div>

            <div>
              <label className="block text-sm mb-1">
                <span className="flex items-center gap-1">
                  Surface habitable nette (m²)
                  <Tooltip title="Qu’est-ce que la surface nette ?">
                    <IconButton size="small" onClick={() => setOpenModalNette(true)} sx={{ color: "#0047FF", p: 0.5 }}>
                      <InfoOutlinedIcon fontSize="inherit" />
                    </IconButton>
                  </Tooltip>
                </span>
              </label>
              <input
                type="text"
                {...numPropsDec}
                value={surfaceHabitableNette}
                onChange={(e) => setSHN(e.target.value)}
                className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none"
              />
              {!(toFloatOrNull(surfaceHabitableBrute) > 0 || toFloatOrNull(surfaceHabitableNette) > 0) && (
                <p className="text-xs text-amber-600 mt-1">
                  Indique au moins la surface <b>brute</b> ou la surface <b>nette</b>.
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm mb-1">
                <span className="flex items-center gap-1">
                  Surface pondérée (m²)
                  <Tooltip title="Qu’est-ce que la surface pondérée ?">
                    <IconButton size="small" onClick={() => setOpenModalPonderee(true)} sx={{ color: "#0047FF", p: 0.5 }}>
                      <InfoOutlinedIcon fontSize="inherit" />
                    </IconButton>
                  </Tooltip>
                </span>
              </label>
              <input
                type="text"
                {...numPropsDec}
                value={surfacePonderee}
                onChange={(e) => setSP(e.target.value)}
                className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm mb-1">
              <span className="flex items-center gap-1">
                Surface du terrain (m²)
                <Tooltip title="Surface cadastrale du terrain.">
                  <IconButton size="small" onClick={() => {}} sx={{ color: "#0047FF", p: 0.5 }}>
                    <InfoOutlinedIcon fontSize="inherit" />
                  </IconButton>
                </Tooltip>
              </span>
            </label>
            <input
              type="text"
              {...numPropsDec}
              value={surfaceTerrain}
              onChange={(e) => setSurfaceTerrain(e.target.value)}
              className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm mb-1">Pièces</label>
              <input
                type="text"
                {...numPropsDec}
                value={nbPieces}
                onChange={(e) => setNbPieces(e.target.value)}
                className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none"
              />
            </div>
            <div>
              <label className="block text-sm mb-1">Chambres</label>
              <input
                type="text"
                {...numPropsInt}
                value={nbChambres}
                onChange={(e) => setNbChambres(e.target.value)}
                className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none"
              />
            </div>
          </div>

          <div className="flex items-center gap-3 pt-2">
            <button type="button" onClick={() => navigate(`/bien/${id}`)} className="px-4 py-2 rounded-xl border border-gray-300 text-gray-700">
              Annuler
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={!baseOk || saving}
              className={`px-4 py-2 rounded-xl text-white ${baseOk && !saving ? "bg-black hover:bg-gray-900" : "bg-gray-300 cursor-not-allowed"}`}
            >
              {saving ? "Enregistrement..." : "Continuer"}
            </button>
          </div>
        </div>

        {/* Modals */}
        <ModalMessage
          open={openModalBrute}
          onClose={() => setOpenModalBrute(false)}
          onConfirm={() => setOpenModalBrute(false)}
          title="Surface habitable brute — explication"
          message={
            <>
              <Typography variant="body1" sx={{ mb: 2 }}>
                La <strong>surface habitable brute</strong> est la surface totale (incluant cloisons, murs intérieurs, gaines).
              </Typography>
              <BlocExemple>
                <em>Exemple :</em><br /> Appartement au sol : 120 m²<br />
                Surface brute = <strong>120 m²</strong>
              </BlocExemple>
            </>
          }
          confirmText="Compris"
          onlyConfirm
          showCloseIcon
          iconType="knowledge"
        />
        <ModalMessage
          open={openModalNette}
          onClose={() => setOpenModalNette(false)}
          onConfirm={() => setOpenModalNette(false)}
          title="Surface habitable nette — explication"
          message={
            <>
              <Typography variant="body1" sx={{ mb: 2 }}>
                La <strong>surface habitable nette</strong> = brute – zones non utilisables (murs porteurs, gaines…).
              </Typography>
              <BlocExemple>
                <em>Exemple :</em><br /> Brute : 120 m² • Murs+gaines : 15 m²<br />
                Nette ≈ <strong>105 m²</strong>
              </BlocExemple>
            </>
          }
          confirmText="Compris" onlyConfirm showCloseIcon iconType="knowledge"
        />
        <ModalMessage
          open={openModalPonderee}
          onClose={() => setOpenModalPonderee(false)}
          onConfirm={() => setOpenModalPonderee(false)}
          title="Surface pondérée — explication"
          message={
            <>
              <Typography variant="body1" sx={{ mb: 2 }}>
                Surface “corrigée” (habitable + annexes avec coefficients).
              </Typography>
              <BlocExemple>
                <em>Exemple :</em><br />
                Habitable 100 • Balcon 20 (50% → 10) • Cave 10 (25% → 2.5)<br />
                Total ≈ <strong>112.5 m²</strong>
              </BlocExemple>
            </>
          }
          confirmText="Compris" onlyConfirm showCloseIcon iconType="knowledge"
        />
      </div>
    </div>
  );
}
