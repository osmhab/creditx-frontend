import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { db } from "../../firebase-config";
import TuneOutlinedIcon from "@mui/icons-material/TuneOutlined";
import SelecteurCreditX from "../../components/SelecteurCreditX";
import ModalMessage from "../../components/ModalMessage";
import { Typography, Tooltip, IconButton } from "@mui/material";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";

export default function CaracteristiquesEtagesParkings() {
  const navigate = useNavigate();
  const { id } = useParams();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [bien, setBien] = useState({});

  const [etage, setEtage] = useState("");
  const [etagesImmeuble, setEtagesImmeuble] = useState("");
  const [ascenseur, setAscenseur] = useState(null);
  const [parkInt, setParkInt] = useState("");
  const [parkExt, setParkExt] = useState("");
  const [parkInclus, setParkInclus] = useState(null);

  const [openModalEtages, setOpenModalEtages] = useState(false);

  const boolOptions = [
    { value: true, label: "Oui" },
    { value: false, label: "Non" },
  ];

  const toIntOrNull = (v) => {
    if (v === "" || v == null) return null;
    const n = Number(String(v).replace(",", "."));
    return Number.isFinite(n) ? Math.trunc(n) : null;
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
        setEtage(b.etage ?? "");
        setEtagesImmeuble(b.etagesImmeuble ?? "");
        setAscenseur(typeof b.ascenseur === "boolean" ? b.ascenseur : null);
        setParkInt(b.parkings?.interieur ?? "");
        setParkExt(b.parkings?.exterieur ?? "");
        setParkInclus(typeof b.parkings?.inclusDansPrix === "boolean" ? b.parkings.inclusDansPrix : null);
      } catch (e) {
        console.error(e);
      } finally {
        mounted && setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, [id]);

  const numPropsInt = { inputMode: "numeric", pattern: "[0-9]*" };
  const isAppartement = bien?.typeBien === "appartement";

  const handleSave = async () => {
    setSaving(true);
    try {
      const ref = doc(db, "demandes", id);
      const snap = await getDoc(ref);
      const data = snap.data() || {};
      const next = { ...(data.bien || {}) };

      next.etage = toIntOrNull(etage);
      next.etagesImmeuble = toIntOrNull(etagesImmeuble);
      if (ascenseur !== null) next.ascenseur = ascenseur;

      next.parkings = {
        interieur: toIntOrNull(parkInt),
        exterieur: toIntOrNull(parkExt),
        inclusDansPrix: parkInclus === null ? null : parkInclus,
      };

      await updateDoc(ref, { bien: next });
      navigate(`/bien/${id}`);
    } catch (e) {
      console.error("save étages/parkings:", e);
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
          <h1 className="text-xl font-semibold">Caractéristiques — Étages & parkings</h1>
        </div>

        <div className="bg-white rounded-2xl p-4 space-y-6">
          {isAppartement ? (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm mb-1">Étage</label>
                <input
                  type="text"
                  {...numPropsInt}
                  value={etage}
                  onChange={(e) => setEtage(e.target.value)}
                  className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none"
                />
              </div> 
              <div>
                <label className="block text-sm mb-1">
                  <span className="flex items-center gap-1">
                    Nombre étages (sans compter le rez-de-chaussée)
                    <Tooltip title="Important">
                      <IconButton size="small" onClick={() => setOpenModalEtages(true)} sx={{ color: "#0047FF", p: 0.5 }}>
                        <InfoOutlinedIcon fontSize="inherit" />
                      </IconButton>
                    </Tooltip>
                  </span>
                </label>
                <input
                  type="text"
                  {...numPropsInt}
                  value={etagesImmeuble}
                  onChange={(e) => setEtagesImmeuble(e.target.value)}
                  className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none"
                />
              </div>
            </div>
          ) : (
            <div>
              <label className="block text-sm mb-1">
                <span className="flex items-center gap-1">
                  Nb étages immeuble
                  <Tooltip title="Important">
                    <IconButton size="small" onClick={() => setOpenModalEtages(true)} sx={{ color: "#0047FF", p: 0.5 }}>
                      <InfoOutlinedIcon fontSize="inherit" />
                    </IconButton>
                  </Tooltip>
                </span>
              </label>
              <input
                type="text"
                {...numPropsInt}
                value={etagesImmeuble}
                onChange={(e) => setEtagesImmeuble(e.target.value)}
                className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none"
              />
            </div>
          )}

          
            <SelecteurCreditX
              label="Ascenseur"
              value={ascenseur}
              onChange={setAscenseur}
              options={boolOptions}
              placeholder="Sélectionner"
              searchable={false}
              clearable
            />
          

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-sm mb-1">Parking int.</label>
              <input
                type="text"
                {...numPropsInt}
                value={parkInt}
                onChange={(e) => setParkInt(e.target.value)}
                className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none"
              />
            </div>
            <div>
              <label className="block text-sm mb-1">Parking ext.</label>
              <input
                type="text"
                {...numPropsInt}
                value={parkExt}
                onChange={(e) => setParkExt(e.target.value)}
                className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none"
              />
            </div>
            <div>
              <label className="block text-sm mb-1">Inclus dans le prix ?</label>
              <SelecteurCreditX
                value={parkInclus}
                onChange={setParkInclus}
                options={boolOptions}
                placeholder="Oui / Non"
                searchable={false}
                clearable
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
              disabled={saving}
              className={`px-4 py-2 rounded-xl text-white ${!saving ? "bg-black hover:bg-gray-900" : "bg-gray-300 cursor-not-allowed"}`}
            >
              {saving ? "Enregistrement..." : "Continuer"}
            </button>
          </div>
        </div>

        <ModalMessage
          open={openModalEtages}
          onClose={() => setOpenModalEtages(false)}
          onConfirm={() => setOpenModalEtages(false)}
          title="Nombre d’étages de l’immeuble"
          message={
            <Typography variant="body1">
              <strong>Ne pas compter le rez‑de‑chaussée.</strong> Indiquez uniquement les étages au‑dessus du rez.
            </Typography>
          }
          confirmText="Compris" onlyConfirm showCloseIcon iconType="knowledge"
        />
      </div>
    </div>
  );
}
