// src/pages/DossierFinancement/FinancementApport.js
import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { db } from "../../firebase-config";
import SavingsOutlinedIcon from '@mui/icons-material/SavingsOutlined';
import { Tooltip, IconButton, Typography, Chip } from "@mui/material";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import DeleteOutlineOutlinedIcon from "@mui/icons-material/DeleteOutlineOutlined";
import AddIcon from "@mui/icons-material/Add";
import SelecteurCreditX from "../../components/SelecteurCreditX";
import ModalMessage from "../../components/ModalMessage";

// ====== Types de sources
const TYPE_OPTIONS = [
  { value: "liquidites", label: "Liquidités, avoirs en compte, titres" },
  { value: "lpp", label: "2e pilier (LPP) — versement anticipé / mise en gage" },
  { value: "libre_passage", label: "2e pilier — compte / police de libre passage" },
  { value: "pilier3", label: "Avoirs de 3e pilier (3a/3b)" },
  { value: "donation", label: "Donation" },
  { value: "avance_hoirie", label: "Avance d’hoirie" },
];

const BOOL_OPTIONS = [
  { value: true, label: "Oui" },
  { value: false, label: "Non" },
];

const BANQUES_CH = [
  { value: "UBS", label: "UBS" },
  { value: "Credit_Suisse", label: "Credit Suisse" },
  { value: "Raiffeisen", label: "Raiffeisen" },
  { value: "PostFinance", label: "PostFinance" },
  { value: "ZKB", label: "Banque Cantonale de Zurich (ZKB)" },
  { value: "BCV", label: "Banque Cantonale Vaudoise (BCV)" },
  { value: "BCGE", label: "Banque Cantonale de Genève (BCGE)" },
  { value: "Migros_Bank", label: "Banque Migros" },
  { value: "Valiant", label: "Valiant" },
  { value: "Autre", label: "Autre (préciser)" },
];

const INSTITUTIONS_LPP = [
  { value: "Publica", label: "PUBLICA" },
  { value: "AXA_LPP", label: "AXA Fondation LPP" },
  { value: "SwissLife_LPP", label: "Swiss Life LPP" },
  { value: "Zurich_LPP", label: "Zurich LPP" },
  { value: "Liberty_LPP", label: "Liberty LPP" },
  { value: "Migros_Pensionskasse", label: "Caisse de pensions Migros" },
  { value: "Autre", label: "Autre (préciser)" },
];

const INSTITUTIONS_3 = [
  { value: "UBS", label: "UBS" },
  { value: "Raiffeisen", label: "Raiffeisen" },
  { value: "PostFinance", label: "PostFinance" },
  { value: "AXA", label: "AXA" },
  { value: "SwissLife", label: "Swiss Life" },
  { value: "Zurich", label: "Zurich" },
  { value: "VZ", label: "VZ" },
  { value: "Autre", label: "Autre (préciser)" },
];

// ====== Helpers
const numPropsDec = { inputMode: "decimal", pattern: "[0-9]*[.,]?[0-9]*" };
const toFloatOrNull = (v) => {
  if (v === "" || v == null) return null;
  const n = Number(String(v).replaceAll("’", "").replaceAll("'", "").replace(",", "."));
  return Number.isFinite(n) ? n : null;
};
const fmtCHF = (n) =>
  typeof n === "number" && !Number.isNaN(n) ? `${Number(n).toLocaleString("fr-CH")} CHF` : "—";

// squelette d’une ligne selon type
const defaultForType = (type, isRP) => {
  switch (type) {
    case "liquidites":
      return { type, montant: "", banque: null, banqueAutre: "" };
    case "lpp":
      return { type, montant: "", institution: null, institutionAutre: "", disponible: "", miseEnGage: null };
    case "libre_passage":
      return { type, montant: "", institution: null, institutionAutre: "" };
    case "pilier3":
      return { type, p3Type: isRP ? null : "3b", valeurRachat: "", dateValeur: "", institution: null, institutionAutre: "" };
    case "donation":
      return { type, montant: "", date: "" };
    case "avance_hoirie":
      return { type, montant: "", date: "" };
    default:
      return { type };
  }
};

// ====== Composant
export default function FinancementApport() {
  const navigate = useNavigate();
  const { id } = useParams();

  // UI
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Contexte
  const [usage, setUsage] = useState(null);
  const [prixAchat, setPrixAchat] = useState(null);
  const isRP = useMemo(() => {
    const u = String(usage || "").toLowerCase();
    return u.includes("résidence") || u.includes("residence");
  }, [usage]);

  // lignes dynamiques
  const [lignes, setLignes] = useState([]);

  // modals
  const [modalAddOpen, setModalAddOpen] = useState(false);
  const [typeToAdd, setTypeToAdd] = useState(null);

  const [openModalP3, setOpenModalP3] = useState(false);
  const [openModalDon, setOpenModalDon] = useState(false);
  const [openModalAvh, setOpenModalAvh] = useState(false);
  const [openModalLiquidites, setOpenModalLiquidites] = useState(false);

  // charge
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const snap = await getDoc(doc(db, "demandes", id));
        const data = snap.exists() ? snap.data() : {};
        const bien = data.bien || {};
        const fin = data.financement || {};
        const ap = fin.apport || {};

        if (!mounted) return;

        setUsage(bien.usage || null);
        setPrixAchat(typeof bien.prixAchat === "number" ? bien.prixAchat : null);

        // 1) si déjà des lignes => charge telles quelles
        if (Array.isArray(ap.lignes) && ap.lignes.length) {
          setLignes(ap.lignes);
          setLoading(false);
          return;
        }

        // 2) sinon, rétro-compat depuis ancien format
        const tmp = [];
        if (ap.liquidites?.montant) {
          tmp.push({
            type: "liquidites",
            montant: ap.liquidites.montant ?? "",
            banque: ap.liquidites.banque ?? null,
            banqueAutre: ap.liquidites.banqueAutre ?? "",
          });
        }
        if (ap.lpp?.montant) {
          tmp.push({
            type: "lpp",
            montant: ap.lpp.montant ?? "",
            institution: ap.lpp.institution ?? null,
            institutionAutre: ap.lpp.institutionAutre ?? "",
            disponible: ap.lpp.disponibleVersementAnticipe ?? "",
            miseEnGage: typeof ap.lpp.miseEnGage === "boolean" ? ap.lpp.miseEnGage : null,
          });
        }
        if (ap.librePassage?.montant) {
          tmp.push({
            type: "libre_passage",
            montant: ap.librePassage.montant ?? "",
            institution: ap.librePassage.institution ?? null,
            institutionAutre: ap.librePassage.institutionAutre ?? "",
          });
        }
        if (ap.pilier3?.valeurRachat) {
          tmp.push({
            type: "pilier3",
            p3Type: ap.pilier3.type ?? (isRP ? null : "3b"),
            valeurRachat: ap.pilier3.valeurRachat ?? "",
            dateValeur: ap.pilier3.dateValeur ?? "",
            institution: ap.pilier3.institution ?? null,
            institutionAutre: ap.pilier3.institutionAutre ?? "",
          });
        }
        if (ap.donation?.montant) {
          tmp.push({ type: "donation", montant: ap.donation.montant ?? "", date: ap.donation.date ?? "" });
        }
        if (ap.avanceHoirie?.montant) {
          tmp.push({ type: "avance_hoirie", montant: ap.avanceHoirie.montant ?? "", date: ap.avanceHoirie.date ?? "" });
        }

        setLignes(tmp);
      } catch (e) {
        console.error("Load apport:", e);
      } finally {
        mounted && setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [id, isRP]);

  // === Comptabilisation (total) et "fonds propres durs"
  const includedAmount = (ln) => {
    switch (ln.type) {
      case "liquidites": {
        const m = toFloatOrNull(ln.montant) || 0;
        return m > 0 ? m : 0;
      }
      case "lpp": {
        // Compté (soft) uniquement RP + règles mini
        if (!isRP) return 0;
        const m = toFloatOrNull(ln.montant) || 0;
        const disp = toFloatOrNull(ln.disponible) || 0;
        if (m >= 20000 && disp >= 20000 && ln.miseEnGage === false) return m;
        return 0;
      }
      case "libre_passage": {
        if (!isRP) return 0;
        const m = toFloatOrNull(ln.montant) || 0;
        return m >= 20000 ? m : 0;
      }
      case "pilier3": {
        const v = toFloatOrNull(ln.valeurRachat) || 0;
        // 3a: seulement RP ; 3b: RP ou rendement
        const okType = ln.p3Type === "3b" || (isRP && ln.p3Type === "3a");
        return okType ? v : 0;
      }
      case "donation": {
        const m = toFloatOrNull(ln.montant) || 0;
        return m > 0 ? m : 0;
      }
      case "avance_hoirie": {
        const m = toFloatOrNull(ln.montant) || 0;
        return m > 0 ? m : 0;
      }
      default:
        return 0;
    }
  };

  // Ce qui compte comme "fonds propres durs"
  const includedHardAmount = (ln) => {
    switch (ln.type) {
      case "liquidites":
        return includedAmount(ln); // tout compte comme dur
      case "pilier3":
        return ln.p3Type === "3b" ? includedAmount(ln) : 0; // 3b = dur ; 3a = pas dur
      case "donation":
      case "avance_hoirie":
        return includedAmount(ln); // dur
      case "lpp":
      case "libre_passage":
        return 0; // 2e pilier = pas dur
      default:
        return 0;
    }
  };

  const totalApport = useMemo(
    () => (lignes || []).reduce((sum, ln) => sum + includedAmount(ln), 0),
    [lignes, isRP]
  );

  const totalApportDur = useMemo(
    () => (lignes || []).reduce((sum, ln) => sum + includedHardAmount(ln), 0),
    [lignes, isRP]
  );

  const ratioApport = useMemo(() => {
    if (!(typeof prixAchat === "number") || prixAchat <= 0) return null;
    return Math.round((totalApport / prixAchat) * 100);
  }, [prixAchat, totalApport]);

  const ratioApportDur = useMemo(() => {
    if (!(typeof prixAchat === "number") || prixAchat <= 0) return null;
    return Math.round((totalApportDur / prixAchat) * 100);
  }, [prixAchat, totalApportDur]);

  // Exigences minimales
  const reqTotalRP = useMemo(() => (typeof prixAchat === "number" ? 0.2 * prixAchat : null), [prixAchat]);
  const reqDurRP = useMemo(() => (typeof prixAchat === "number" ? 0.1 * prixAchat : null), [prixAchat]);
  const reqDurRendement = useMemo(
    () => (typeof prixAchat === "number" ? 0.25 * prixAchat : null),
    [prixAchat]
  );

  const meetsRP_Total = reqTotalRP != null ? totalApport >= reqTotalRP : null;
  const meetsRP_Dur = reqDurRP != null ? totalApportDur >= reqDurRP : null;
  const meetsRendement_Dur = reqDurRendement != null ? totalApportDur >= reqDurRendement : null;

  // actions lignes
  const addLigne = (t) => setLignes((prev) => [...prev, defaultForType(t, isRP)]);
  const removeLigne = (idx) => setLignes((prev) => prev.filter((_, i) => i !== idx));
  const patchLigne = (idx, patch) =>
    setLignes((prev) => prev.map((ln, i) => (i === idx ? { ...ln, ...patch } : ln)));

  // options de type disponibles (filtrées selon usage)
  const typeOptionsForAdd = useMemo(() => {
    return TYPE_OPTIONS.filter((opt) => {
      // 2e pilier non autorisé pour bien de rendement
      if (!isRP && (opt.value === "lpp" || opt.value === "libre_passage")) return false;
      return true;
    });
  }, [isRP]);

  const allowedTypesSet = useMemo(
    () => new Set(typeOptionsForAdd.map((o) => o.value)),
    [typeOptionsForAdd]
  );

  const labelType = (t) => TYPE_OPTIONS.find((x) => x.value === t)?.label || t;

  // save
  const handleSave = async () => {
    setSaving(true);
    try {
      const ref = doc(db, "demandes", id);
      const snap = await getDoc(ref);
      const data = snap.data() || {};
      const financement = { ...(data.financement || {}) };

      // Nettoyage des valeurs "Autre"
      const clean = (arr) =>
        (arr || []).map((ln) => {
          const out = { ...ln };
          if (ln.type === "liquidites" && ln.banque !== "Autre") out.banqueAutre = null;
          if ((ln.type === "lpp" || ln.type === "libre_passage") && ln.institution !== "Autre")
            out.institutionAutre = null;
          if (ln.type === "pilier3" && ln.institution !== "Autre") out.institutionAutre = null;
          return out;
        });

      financement.apport = {
        lignes: clean(lignes),
        total: totalApport,
        totalDurs: totalApportDur,
      };
      financement.apportTotal = totalApport;
      financement.apportDursTotal = totalApportDur;
      financement.apportCalcAuto = true;

      await updateDoc(ref, { financement });
      navigate(`/financement/${id}`);
    } catch (e) {
      console.error("Save apport:", e);
      alert("Impossible d’enregistrer. Réessaie.");
    } finally {
      setSaving(false);
    }
  };

  // --- helpers progress ---
const clamp01 = (x) => Math.max(0, Math.min(1, x));
const barColor = (ratio) =>
  ratio >= 1 ? "bg-green-500" : ratio >= 0.5 ? "bg-yellow-400" : "bg-orange-500";

// 100% visuel légèrement avant la fin (96%)
const TARGET_VISUAL_POS = 0.96;

function ProgressWithMarker({ ratio }) {
  const clamped = clamp01(ratio);
  const percent = Math.min(100, Math.round(clamped * 100));
  const colorClass = barColor(clamped); // "bg-green-500" | "bg-yellow-400" | "bg-orange-500"

  return (
    <div className="relative w-full h-2.5 bg-gray-100 rounded-full overflow-hidden">
      {/* Remplissage */}
      <div
        className={`absolute inset-y-0 left-0 ${colorClass} z-0 transition-all`}
        style={{ width: `${percent}%` }}
      />
      {/* Repère 100% (à ~96%) */}
      <div
        className="absolute inset-y-0 z-10 flex items-stretch"
        style={{ left: `${TARGET_VISUAL_POS * 100}%` }}
        aria-hidden="true"
      >
        <div className="w-[2px] h-full bg-gray-400/70" />
      </div>
    </div>
  );
}


// Montants "pris en compte" (tu as déjà totalApport = somme des sources prises en compte)
const totalEligible = totalApport; // alias lisible

// Montants "fonds propres durs" : tout sauf 2e pilier (LPP + libre passage).
// (3e pilier A/B sont considérés durs ici; 3a reste RP uniquement via ta logique existante)
const amountHard = (ln) => {
  switch (ln.type) {
    case "liquidites":      return toFloatOrNull(ln.montant) || 0;
    case "donation":        return toFloatOrNull(ln.montant) || 0;
    case "avance_hoirie":   return toFloatOrNull(ln.montant) || 0;
    case "pilier3": {
      const v = toFloatOrNull(ln.valeurRachat) || 0;
      // 3b toujours dur; 3a dur seulement en RP (déjà filtré par ailleurs)
      if (ln.p3Type === "3b") return v;
      if (isRP && ln.p3Type === "3a") return v;
      return 0;
    }
    // 2e pilier -> pas "dur"
    case "lpp":
    case "libre_passage":
    default:
      return 0;
  }
};

const totalHard = useMemo(
  () => (lignes || []).reduce((s, ln) => s + amountHard(ln), 0),
  [lignes, isRP]
);

// Seuils requis
const requiredTotal = typeof prixAchat === "number" && prixAchat > 0
  ? Math.round(prixAchat * (isRP ? 0.20 : 0.25))
  : null;

// En RP: minimum 10% de "durs". En rendement: tout doit être dur, donc 25% durs.
const requiredHard = typeof prixAchat === "number" && prixAchat > 0
  ? Math.round(prixAchat * (isRP ? 0.10 : 0.25))
  : null;

// Ratios pour la barre
const ratioTotalReq = requiredTotal ? totalEligible / requiredTotal : 0;
const ratioHardReq  = requiredHard  ? totalHard     / requiredHard  : 0;


  if (loading) return <div className="p-6 text-base">Chargement...</div>;

  return (
    <div className="min-h-screen bg-[#FCFCFC] flex justify-center px-4 pt-6">
      <div className="w-full max-w-md">
        {/* back */}
        <button onClick={() => navigate(`/financement/${id}`)} className="mb-4">
          <span className="text-xl">←</span>
        </button>

        {/* header */}
        <div className="flex items-center gap-3 mb-4">
          <div className="w-9 h-9 rounded-full bg-creditxblue text-white flex items-center justify-center">
            <SavingsOutlinedIcon fontSize="small" />
          </div>
          <h1 className="text-xl font-semibold">Budget & apport</h1>
        </div>

        <div className="bg-white rounded-2xl p-4 space-y-5">
          {/* Contexte */}
          {/* Montant minimum requis */}
<div className="rounded-xl border border-gray-200 p-3 space-y-3">
  <div className="flex items-center justify-between">
    <p className="text-sm font-medium">Montant minimum requis</p>
    <p className="text-sm text-gray-600">
      {requiredTotal != null ? `${fmtCHF(totalEligible)} / ${fmtCHF(requiredTotal)}` : "—"}
    </p>
  </div>

  {/* Barre progression - total */}
  <ProgressWithMarker ratio={ratioTotalReq} />


  {/* Sous-ligne d’explication */}
  <p className="text-xs text-gray-500">
    {isRP
      ? "Résidence principale : 20% du prix d’achat minimum."
      : "Bien de rendement : 25% du prix d’achat minimum (fonds propres durs uniquement)."}
  </p>

  {/* Fonds propres durs */}
  <div className="flex items-center justify-between mt-3">
    <p className="text-xs font-medium">Fonds propres durs (minimum)</p>
    <p className="text-xs text-gray-600">
      {requiredHard != null ? `${fmtCHF(totalHard)} / ${fmtCHF(requiredHard)}` : "—"}
    </p>
  </div>
  <ProgressWithMarker ratio={ratioHardReq} />


  <p className="text-[11px] text-gray-500">
    Les “fonds propres durs” excluent le 2e pilier (LPP et libre passage). En RP, au moins 10% doivent être durs.
  </p>
</div>


          {/* Lignes */}
          {lignes.length === 0 && (
            <p className="text-sm text-gray-500">Aucune source d’apport ajoutée pour l’instant.</p>
          )}

          <div className="space-y-3">
            {lignes.map((ln, idx) => {
              const included = includedAmount(ln);

              // Avertissements spécifiques
              const showLPPWarn =
                ln.type === "lpp" &&
                (toFloatOrNull(ln.montant) < 20000 ||
                  toFloatOrNull(ln.disponible) < 20000 ||
                  ln.miseEnGage !== false);

              const showLPWarn = ln.type === "libre_passage" && toFloatOrNull(ln.montant) < 20000;

              const show3Warn =
                ln.type === "pilier3" &&
                !(ln.p3Type === "3b" || (isRP && ln.p3Type === "3a"));

              return (
                <div key={idx} className="border border-gray-200 rounded-xl p-3">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">{labelType(ln.type)}</span>
                     
                    </div>
                    <IconButton size="small" onClick={() => removeLigne(idx)} sx={{ color: "#ef4444" }}>
                      <DeleteOutlineOutlinedIcon fontSize="small" />
                    </IconButton>
                  </div>

                  {/* Champs dynamiques — une seule ligne par champ */}
                  {ln.type === "liquidites" && (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <label className="text-xs text-gray-700">Liquidités, avoirs en compte, titres</label>
                        <Tooltip title="Qu’entend-on par liquidités / titres ?">
                          <IconButton size="small" onClick={() => setOpenModalLiquidites(true)} sx={{ color: "#0047FF", p: 0.5 }}>
                            <InfoOutlinedIcon fontSize="inherit" />
                          </IconButton>
                        </Tooltip>
                      </div>

                      <div>
                        <label className="block text-xs mb-1">Montant (CHF)</label>
                        <input
                          type="text"
                          {...numPropsDec}
                          value={ln.montant || ""}
                          onChange={(e) => patchLigne(idx, { montant: e.target.value })}
                          placeholder="p. ex. 50’000"
                          className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none"
                        />
                      </div>

                      <div>
                        <SelecteurCreditX
                          label="Banque"
                          value={ln.banque || null}
                          onChange={(v) => patchLigne(idx, { banque: v })}
                          options={BANQUES_CH}
                          placeholder="Sélectionner"
                          searchable
                          clearable
                        />
                        {ln.banque === "Autre" && (
                          <input
                            type="text"
                            value={ln.banqueAutre || ""}
                            onChange={(e) => patchLigne(idx, { banqueAutre: e.target.value })}
                            placeholder="Nom de la banque"
                            className="mt-2 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none"
                          />
                        )}
                      </div>
                    </div>
                  )}

                  {ln.type === "lpp" && (
                    <div className="space-y-3">
                      {!isRP && (
                        <p className="text-xs text-amber-600">
                          Les avoirs LPP ne sont pas pris en compte pour un usage autre que Résidence principale.
                        </p>
                      )}

                      <div>
                        <label className="block text-xs mb-1">Montant (min. 20’000)</label>
                        <input
                          type="text"
                          {...numPropsDec}
                          value={ln.montant || ""}
                          onChange={(e) => patchLigne(idx, { montant: e.target.value })}
                          placeholder="p. ex. 40’000"
                          className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none"
                        />
                      </div>

                      <div>
                        <SelecteurCreditX
                          label="Institution"
                          value={ln.institution || null}
                          onChange={(v) => patchLigne(idx, { institution: v })}
                          options={INSTITUTIONS_LPP}
                          placeholder="Sélectionner"
                          searchable
                          clearable
                        />
                        {ln.institution === "Autre" && (
                          <input
                            type="text"
                            value={ln.institutionAutre || ""}
                            onChange={(e) => patchLigne(idx, { institutionAutre: e.target.value })}
                            placeholder="Nom de l’institution"
                            className="mt-2 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none"
                          />
                        )}
                      </div>

                      <div>
                        <label className="block text-xs mb-1">Disponible pour versement anticipé</label>
                        <input
                          type="text"
                          {...numPropsDec}
                          value={ln.disponible || ""}
                          onChange={(e) => patchLigne(idx, { disponible: e.target.value })}
                          placeholder="Voir certificat LPP"
                          className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none"
                        />
                      </div>

                      <div>
                        <SelecteurCreditX
                          label="Mise en gage"
                          value={typeof ln.miseEnGage === "boolean" ? ln.miseEnGage : null}
                          onChange={(v) => patchLigne(idx, { miseEnGage: v })}
                          options={BOOL_OPTIONS}
                          placeholder="Oui / Non"
                          searchable={false}
                          clearable
                        />
                      </div>

                      {showLPPWarn && (
                        <p className="text-xs text-amber-600">
                          Rappel: minimum 20’000 CHF sur le montant <em>et</em> le disponible, et <b>pas</b> de mise en gage.
                        </p>
                      )}
                    </div>
                  )}

                  {ln.type === "libre_passage" && (
                    <div className="space-y-3">
                      {!isRP && (
                        <p className="text-xs text-amber-600">
                          Le libre passage n’est compté en fonds propres que pour une Résidence principale.
                        </p>
                      )}

                      <div>
                        <label className="block text-xs mb-1">Montant (min. 20’000)</label>
                        <input
                          type="text"
                          {...numPropsDec}
                          value={ln.montant || ""}
                          onChange={(e) => patchLigne(idx, { montant: e.target.value })}
                          placeholder="p. ex. 25’000"
                          className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none"
                        />
                        {showLPWarn && <p className="text-xs text-amber-600 mt-1">Minimum 20’000 CHF.</p>}
                      </div>

                      <div>
                        <SelecteurCreditX
                          label="Institution"
                          value={ln.institution || null}
                          onChange={(v) => patchLigne(idx, { institution: v })}
                          options={INSTITUTIONS_LPP}
                          placeholder="Sélectionner"
                          searchable
                          clearable
                        />
                        {ln.institution === "Autre" && (
                          <input
                            type="text"
                            value={ln.institutionAutre || ""}
                            onChange={(e) => patchLigne(idx, { institutionAutre: e.target.value })}
                            placeholder="Nom de l’institution"
                            className="mt-2 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none"
                          />
                        )}
                      </div>
                    </div>
                  )}

                  {ln.type === "pilier3" && (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <label className="text-xs text-gray-700">Avoirs de 3e pilier</label>
                        <Tooltip title="Valeur de rachat = montant récupérable à la date indiquée">
                          <IconButton size="small" onClick={() => setOpenModalP3(true)} sx={{ color: "#0047FF", p: 0.5 }}>
                            <InfoOutlinedIcon fontSize="inherit" />
                          </IconButton>
                        </Tooltip>
                      </div>

                      <div>
                        <SelecteurCreditX
                          label="Type"
                          value={ln.p3Type || null}
                          onChange={(v) => patchLigne(idx, { p3Type: v })}
                          options={[
                            ...(isRP ? [{ value: "3a", label: "Prévoyance liée (3a)" }] : []),
                            { value: "3b", label: "Prévoyance libre (3b)" },
                          ]}
                          placeholder="Sélectionner"
                          searchable={false}
                          clearable
                        />
                      </div>

                      <div>
                        <label className="block text-xs mb-1">Valeur de rachat (CHF)</label>
                        <input
                          type="text"
                          {...numPropsDec}
                          value={ln.valeurRachat || ""}
                          onChange={(e) => patchLigne(idx, { valeurRachat: e.target.value })}
                          placeholder="p. ex. 50’000"
                          className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none"
                        />
                      </div>

                      <div>
                        <label className="block text-xs mb-1">Date</label>
                        <input
                          type="date"
                          value={ln.dateValeur || ""}
                          onChange={(e) => patchLigne(idx, { dateValeur: e.target.value })}
                          className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none"
                        />
                      </div>

                      <div>
                        <SelecteurCreditX
                          label="Institution"
                          value={ln.institution || null}
                          onChange={(v) => patchLigne(idx, { institution: v })}
                          options={INSTITUTIONS_3}
                          placeholder="Sélectionner"
                          searchable
                          clearable
                        />
                        {ln.institution === "Autre" && (
                          <input
                            type="text"
                            value={ln.institutionAutre || ""}
                            onChange={(e) => patchLigne(idx, { institutionAutre: e.target.value })}
                            placeholder="Nom de l’institution"
                            className="mt-2 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none"
                          />
                        )}
                      </div>

                      {show3Warn && (
                        <p className="text-xs text-amber-600">
                          Le 3a n’est pris en compte que pour une Résidence principale. Sinon, utiliser 3b.
                        </p>
                      )}
                    </div>
                  )}

                  {ln.type === "donation" && (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <label className="text-xs text-gray-700">Donation</label>
                        <Tooltip title="Somme donnée (souvent par la famille) sans contrepartie.">
                          <IconButton size="small" onClick={() => setOpenModalDon(true)} sx={{ color: "#0047FF", p: 0.5 }}>
                            <InfoOutlinedIcon fontSize="inherit" />
                          </IconButton>
                        </Tooltip>
                      </div>

                      <div>
                        <label className="block text-xs mb-1">Montant (CHF)</label>
                        <input
                          type="text"
                          {...numPropsDec}
                          value={ln.montant || ""}
                          onChange={(e) => patchLigne(idx, { montant: e.target.value })}
                          placeholder="p. ex. 50’000"
                          className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none"
                        />
                      </div>

                      <div>
                        <label className="block text-xs mb-1">Date</label>
                        <input
                          type="date"
                          value={ln.date || ""}
                          onChange={(e) => patchLigne(idx, { date: e.target.value })}
                          className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none"
                        />
                      </div>
                    </div>
                  )}

                  {ln.type === "avance_hoirie" && (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <label className="text-xs text-gray-700">Avance d’hoirie</label>
                        <Tooltip title="Avance consentie sur un futur héritage.">
                          <IconButton size="small" onClick={() => setOpenModalAvh(true)} sx={{ color: "#0047FF", p: 0.5 }}>
                            <InfoOutlinedIcon fontSize="inherit" />
                          </IconButton>
                        </Tooltip>
                      </div>

                      <div>
                        <label className="block text-xs mb-1">Montant (CHF)</label>
                        <input
                          type="text"
                          {...numPropsDec}
                          value={ln.montant || ""}
                          onChange={(e) => patchLigne(idx, { montant: e.target.value })}
                          placeholder="p. ex. 50’000"
                          className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none"
                        />
                      </div>

                      <div>
                        <label className="block text-xs mb-1">Date</label>
                        <input
                          type="date"
                          value={ln.date || ""}
                          onChange={(e) => patchLigne(idx, { date: e.target.value })}
                          className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none"
                        />
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Ajouter une source */}
          <button
            type="button"
            onClick={() => { setTypeToAdd(null); setModalAddOpen(true); }}
            className="w-full mt-1 px-3 py-2 rounded-xl border border-dashed border-gray-300 text-sm hover:bg-gray-50 flex items-center justify-center gap-2"
          >
            <AddIcon fontSize="small" /> Ajouter une source d’apport
          </button>

          {/* Récap & exigences */}
          <div className="rounded-xl bg-gray-50 p-3 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Apport total (comptabilisé)</span>
              <span className="text-sm font-semibold">
                {fmtCHF(totalApport)} {ratioApport != null ? `• ${ratioApport}%` : ""}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Fonds propres durs (comptabilisés)</span>
              <span className="text-sm font-semibold">
                {fmtCHF(totalApportDur)} {ratioApportDur != null ? `• ${ratioApportDur}%` : ""}
              </span>
            </div>

            {isRP ? (
              <div className="pt-2 space-y-1">
                <p className={`text-xs ${meetsRP_Total ? "text-green-700" : "text-amber-600"}`}>
                  Exigence RP — Minimum <b>20%</b> au total
                  {reqTotalRP != null && ` (${fmtCHF(reqTotalRP)})`} — {meetsRP_Total ? "OK" : "Insuffisant"}
                </p>
                <p className={`text-xs ${meetsRP_Dur ? "text-green-700" : "text-amber-600"}`}>
                  Exigence RP — Minimum <b>10%</b> en <b>fonds propres durs</b>
                  {reqDurRP != null && ` (${fmtCHF(reqDurRP)})`} — {meetsRP_Dur ? "OK" : "Insuffisant"}
                </p>
              </div>
            ) : (
              <div className="pt-2">
                <p className={`text-xs ${meetsRendement_Dur ? "text-green-700" : "text-amber-600"}`}>
                  Exigence bien de rendement — Minimum <b>25%</b> en <b>fonds propres durs</b>
                  {reqDurRendement != null && ` (${fmtCHF(reqDurRendement)})`} — {meetsRendement_Dur ? "OK" : "Insuffisant"}
                </p>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3 pt-2">
            <button
              type="button"
              onClick={() => navigate(`/financement/${id}`)}
              className="px-4 py-2 rounded-xl border border-gray-300 text-gray-700"
            >
              Annuler
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className={`px-4 py-2 rounded-xl text-white ${
                !saving ? "bg-black hover:bg-gray-900" : "bg-gray-300 cursor-not-allowed"
              }`}
            >
              {saving ? "Enregistrement..." : "Continuer"}
            </button>
          </div>
        </div>

        {/* Modale — choisir le type à l’ajout (taille augmentée) */}
        <ModalMessage
          open={modalAddOpen}
          onClose={() => setModalAddOpen(false)}
          onConfirm={() => {
            if (!typeToAdd) return;
            if (!allowedTypesSet.has(typeToAdd)) return; // garde-fou usage
            addLigne(typeToAdd);
            setModalAddOpen(false);
          }}
          title="Ajouter une source d’apport"
          message={
            <div className="space-y-4">
              <SelecteurCreditX
                label="Type de source"
                value={typeToAdd}
                onChange={setTypeToAdd}
                placeholder="Sélectionner"
                searchable={false}
                clearable
                options={typeOptionsForAdd}
              />
              {!isRP && (
                <Typography variant="caption" sx={{ color: "#6b7280", display: "block" }}>
                  Pour un <strong>bien de rendement</strong>, seules les sources suivantes sont autorisées :
                  Liquidités, 3e pilier B, Donation, Avance d’hoirie.
                </Typography>
              )}
            </div>
          }
          confirmText="Ajouter"
          showCloseIcon
          maxWidth="md"
          paperSx={{ maxHeight: "90vh" }}
          contentSx={{ minHeight: 380 }}
          iconType="knowledge"
        />

        {/* Modales d’info */}
        <ModalMessage
          open={openModalLiquidites}
          onClose={() => setOpenModalLiquidites(false)}
          onConfirm={() => setOpenModalLiquidites(false)}
          title="Liquidités / Titres — définition"
          message={
            <>
              <Typography variant="body1" sx={{ mb: 1 }}>
                Par <b>liquidités</b> on entend les avoirs immédiatement disponibles:
                comptes à vue/épargne, dépôts à terme, cash. Les <b>titres</b> (actions, obligations, fonds)
                sont également admis et comptent comme <b>fonds propres durs</b>.
              </Typography>
              <Typography variant="caption" sx={{ color: "#6b7280" }}>
                Les avoirs de prévoyance (2e pilier LPP / 3a) ne sont <u>pas</u> des fonds propres durs.
              </Typography>
            </>
          }
          confirmText="Compris"
          onlyConfirm
          showCloseIcon
          iconType="knowledge"
        />

        <ModalMessage
          open={openModalP3}
          onClose={() => setOpenModalP3(false)}
          onConfirm={() => setOpenModalP3(false)}
          title="Valeur de rachat — explication"
          message={
            <>
              <Typography variant="body1" sx={{ mb: 1 }}>
                La <strong>valeur de rachat</strong> correspond au montant récupérable de votre contrat (3a/3b) à la date indiquée.
              </Typography>
              <Typography variant="caption" sx={{ color: "#6b7280" }}>
                Elle ne correspond pas forcément au total de primes versées. Demandez cette information à votre assureur.
              </Typography>
            </>
          }
          confirmText="Compris" onlyConfirm showCloseIcon iconType="knowledge"
        />
        <ModalMessage
          open={openModalDon}
          onClose={() => setOpenModalDon(false)}
          onConfirm={() => setOpenModalDon(false)}
          title="Donation — définition"
          message={
            <Typography variant="body1">
              <strong>Donation</strong> : transfert volontaire d’un montant (souvent familial) sans contrepartie.
            </Typography>
          }
          confirmText="Compris" onlyConfirm showCloseIcon iconType="knowledge"
        />
        <ModalMessage
          open={openModalAvh}
          onClose={() => setOpenModalAvh(false)}
          onConfirm={() => setOpenModalAvh(false)}
          title="Avance d’hoirie — définition"
          message={
            <Typography variant="body1">
              Somme avancée sur un futur héritage, généralement actée par écrit.
            </Typography>
          }
          confirmText="Compris" onlyConfirm showCloseIcon iconType="knowledge"
        />
      </div>
    </div>
  );
}
