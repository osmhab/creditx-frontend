import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { db } from "../../firebase-config";
import TuneOutlinedIcon from "@mui/icons-material/TuneOutlined";
import SelecteurCreditX from "../../components/SelecteurCreditX";
import { Tooltip, IconButton, Typography } from "@mui/material";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import ModalMessage from "../../components/ModalMessage";

export default function CoproprietePPE() {
  const navigate = useNavigate();
  const { id } = useParams();

  // UI state
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Contexte bien
  const [typeBien, setTypeBien] = useState(null);

  // PPE
  const [estPPE, setEstPPE] = useState(null); // true | false | null
  const [chargesMensuelles, setChargesMensuelles] = useState(""); // CHF
  const [nbLots, setNbLots] = useState(""); // int

  // (optionnel) détail des charges – utile pour le conseiller, pas bloquant
  const [chargesDetails, setChargesDetails] = useState({
    chauffage: null,
    eauChaude: null,
    fondsRenovation: null,
    concierge: null,
    ascenseur: null,
  });

  // Modals
  const [openModalCharges, setOpenModalCharges] = useState(false);
  const [openModalLots, setOpenModalLots] = useState(false);

  const boolOptions = useMemo(
    () => [
      { value: true, label: "Oui" },
      { value: false, label: "Non" },
    ],
    []
  );

  // helpers
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

  // Load
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const snap = await getDoc(doc(db, "demandes", id));
        const data = snap.exists() ? snap.data() : {};
        const bien = data.bien || {};
        if (!mounted) return;

        setTypeBien(bien.typeBien || null);

        const ppe = bien.ppe || {};
        // Si appartement, on force par défaut estPPE = true (cohérent en Suisse) si aucune info utilisateur
        const isAppartementInit = String(bien.typeBien || "").toLowerCase().includes("appartement");
        setEstPPE(typeof ppe.estPPE === "boolean" ? ppe.estPPE : (isAppartementInit ? true : null));

        setChargesMensuelles(ppe.chargesMensuelles ?? "");
        setNbLots(ppe.nbLots ?? "");
        setChargesDetails({
          chauffage: ppe.chargesDetails?.chauffage ?? null,
          eauChaude: ppe.chargesDetails?.eauChaude ?? null,
          fondsRenovation: ppe.chargesDetails?.fondsRenovation ?? null,
          concierge: ppe.chargesDetails?.concierge ?? null,
          ascenseur: ppe.chargesDetails?.ascenseur ?? null,
        });
      } catch (e) {
        console.error("Load PPE:", e);
      } finally {
        mounted && setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, [id]);

  // Si l’utilisateur met explicitement "Non" => vider et masquer les champs
  useEffect(() => {
    if (estPPE === false) {
      setChargesMensuelles("");
      setNbLots("");
      setChargesDetails({
        chauffage: null,
        eauChaude: null,
        fondsRenovation: null,
        concierge: null,
        ascenseur: null,
      });
    }
  }, [estPPE]);

  // Validation : requis si appartement OU estPPE === true — sauf si l’utilisateur a dit explicitement "Non"
  const isAppartement = String(typeBien || "").toLowerCase().includes("appartement");
  const ppeRequise = estPPE === false ? false : (isAppartement || estPPE === true);

  const ok =
    !ppeRequise ||
    ((toFloatOrNull(chargesMensuelles) > 0) && (toIntOrNull(nbLots) > 0));

  const handleSave = async () => {
    if (!ok) return;
    setSaving(true);
    try {
      const ref = doc(db, "demandes", id);
      const snap = await getDoc(ref);
      const data = snap.data() || {};
      const next = { ...(data.bien || {}) };

      next.ppe = {
        estPPE: estPPE === null ? (isAppartement ? true : null) : estPPE,
        chargesMensuelles: estPPE === false ? null : toFloatOrNull(chargesMensuelles),
        nbLots: estPPE === false ? null : toIntOrNull(nbLots),
        chargesDetails: estPPE === false ? {} : {
          chauffage: chargesDetails.chauffage,
          eauChaude: chargesDetails.eauChaude,
          fondsRenovation: chargesDetails.fondsRenovation,
          concierge: chargesDetails.concierge,
          ascenseur: chargesDetails.ascenseur,
        },
      };

      await updateDoc(ref, { bien: next });
      navigate(`/bien/${id}`);
    } catch (e) {
      console.error("Save PPE:", e);
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
          <h1 className="text-xl font-semibold">Copropriété (PPE)</h1>
        </div>

        <div className="bg-white rounded-2xl p-4 space-y-6">
          <SelecteurCreditX
            label="Est-ce une PPE ?"
            value={estPPE}
            onChange={setEstPPE}
            options={boolOptions}
            placeholder="Oui / Non"
            searchable={false}
            clearable
          />

          {/* Alerte légère si appartement + réponse Non */}
          {isAppartement && estPPE === false && (
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800">
              La plupart des appartements en Suisse sont en PPE. Confirmez que ce bien n’est pas en PPE.
            </div>
          )}

          {/* Les champs ci-dessous sont affichés uniquement si la PPE n'est PAS explicitement "Non" */}
          {estPPE !== false && (
            <>
              <div>
                <label className="block text-sm mb-1">
                  <span className="flex items-center gap-1">
                    Charges PPE (CHF / mois) {ppeRequise && <span className="text-red-500">*</span>}
                    <Tooltip title="Montant mensuel versé à la PPE (charges communes).">
                      <IconButton size="small" onClick={() => setOpenModalCharges(true)} sx={{ color: "#0047FF", p: 0.5 }}>
                        <InfoOutlinedIcon fontSize="inherit" />
                      </IconButton>
                    </Tooltip>
                  </span>
                </label>
                <input
                  type="text"
                  {...numPropsDec}
                  value={chargesMensuelles}
                  onChange={(e) => setChargesMensuelles(e.target.value)}
                  className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none"
                />
                {ppeRequise && !(toFloatOrNull(chargesMensuelles) > 0) && (
                  <p className="text-xs text-amber-600 mt-1">Champ requis pour un appartement ou une PPE.</p>
                )}
              </div>

              <div>
                <label className="block text-sm mb-1">
                  <span className="flex items-center gap-1">
                    Nombre de lots de la PPE {ppeRequise && <span className="text-red-500">*</span>}
                    <Tooltip title="Nombre total d’unités du règlement PPE (appartements, commerces...).">
                      <IconButton size="small" onClick={() => setOpenModalLots(true)} sx={{ color: "#0047FF", p: 0.5 }}>
                        <InfoOutlinedIcon fontSize="inherit" />
                      </IconButton>
                    </Tooltip>
                  </span>
                </label>
                <input
                  type="text"
                  {...numPropsInt}
                  value={nbLots}
                  onChange={(e) => setNbLots(e.target.value)}
                  className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none"
                />
                {ppeRequise && !(toIntOrNull(nbLots) > 0) && (
                  <p className="text-xs text-amber-600 mt-1">Indiquez un entier &gt; 0.</p>
                )}
              </div>

              {/* Détails optionnels des charges (non bloquants) */}
              <div className="grid grid-cols-2 gap-3">
                <SelecteurCreditX
                  label="Charges incluent le chauffage ?"
                  value={chargesDetails.chauffage}
                  onChange={(v) => setChargesDetails((d) => ({ ...d, chauffage: v }))}
                  options={boolOptions}
                  placeholder="Oui / Non"
                  searchable={false}
                  clearable
                />
                <SelecteurCreditX
                  label="Charges incluent l’eau chaude ?"
                  value={chargesDetails.eauChaude}
                  onChange={(v) => setChargesDetails((d) => ({ ...d, eauChaude: v }))}
                  options={boolOptions}
                  placeholder="Oui / Non"
                  searchable={false}
                  clearable
                />
                <SelecteurCreditX
                  label="Fonds de rénovation inclus ?"
                  value={chargesDetails.fondsRenovation}
                  onChange={(v) => setChargesDetails((d) => ({ ...d, fondsRenovation: v }))}
                  options={boolOptions}
                  placeholder="Oui / Non"
                  searchable={false}
                  clearable
                />
                <SelecteurCreditX
                  label="Concierge inclus ?"
                  value={chargesDetails.concierge}
                  onChange={(v) => setChargesDetails((d) => ({ ...d, concierge: v }))}
                  options={boolOptions}
                  placeholder="Oui / Non"
                  searchable={false}
                  clearable
                />
                <SelecteurCreditX
                  label="Ascenseur inclus ?"
                  value={chargesDetails.ascenseur}
                  onChange={(v) => setChargesDetails((d) => ({ ...d, ascenseur: v }))}
                  options={boolOptions}
                  placeholder="Oui / Non"
                  searchable={false}
                  clearable
                />
              </div>
            </>
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

        {/* Modals */}
        <ModalMessage
          open={openModalCharges}
          onClose={() => setOpenModalCharges(false)}
          onConfirm={() => setOpenModalCharges(false)}
          title="Charges PPE — explication"
          message={
            <>
              <Typography variant="body1" sx={{ mb: 2 }}>
                Montant mensuel versé par le propriétaire pour les dépenses communes
                (chauffage collectif, eau chaude, entretien des parties communes,
                ascenseur, fonds de rénovation, etc.).
              </Typography>
              <Typography variant="caption" sx={{ color: "#6b7280" }}>
                Si vous ne connaissez pas exactement le détail, indiquez simplement le total mensuel.
              </Typography>
            </>
          }
          confirmText="Compris" onlyConfirm showCloseIcon iconType="knowledge"
        />

        <ModalMessage
          open={openModalLots}
          onClose={() => setOpenModalLots(false)}
          onConfirm={() => setOpenModalLots(false)}
          title="Nombre de lots — explication"
          message={
            <Typography variant="body1">
              Nombre total d’unités prévues par le règlement PPE (appartements, locaux, etc.).
              Cette information se trouve généralement dans l’acte constitutif ou le PV d’AG.
            </Typography>
          }
          confirmText="Compris" onlyConfirm showCloseIcon iconType="knowledge"
        />
      </div>
    </div>
  );
}
