// src/pages/DossierInformationsPersonnelles/InformationsCredits.js
import React, { useMemo, useState, useCallback, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { db } from "../../firebase-config";
import AssignmentTurnedInOutlinedIcon from "@mui/icons-material/AssignmentTurnedInOutlined";

/** Helper global de section: emplo + crédits -> etat */
const computeEtatInfos = (personne) => {
  const employeurs = Array.isArray(personne?.employeurs) ? personne.employeurs : [];
  const charges = personne?.charges || null;

  // Si un employeur OU les charges sont bloquants -> Critère bloquant
  const empBloquant = employeurs.some((e) => e?.bloquant === true);
  const chBloquant = charges?.bloquant === true;
  if (empBloquant || chBloquant) return "Critère bloquant";

  // "Terminé" si:
  // - au moins 1 employeur ET tous complets
  // - charges complètes
  const hasAnyEmp = employeurs.length > 0;
  const allEmpOk = hasAnyEmp && employeurs.every((e) => e?.complet === true && e?.bloquant !== true);
  const chargesOk = charges?.complet === true;

  return allEmpOk && chargesOk ? "Terminé" : "Action requise";
};

export default function InformationsCredits() {
  const navigate = useNavigate();
  const { personneId, id } = useParams();
  const pIndex = Number(personneId);

  // ---------- CHF helpers ----------
  const formatCHF = useCallback((val) => {
    if (val === null || val === undefined || val === "") return "";
    const n = typeof val === "number" ? val : Number(String(val).replace(/[^0-9.-]/g, ""));
    if (Number.isNaN(n)) return "";
    return n.toLocaleString("fr-CH");
  }, []);
  const parseCHF = useCallback((s) => {
    if (s === null || s === undefined || s === "") return null;
    const n = Number(String(s).replace(/[^0-9.-]/g, ""));
    return Number.isNaN(n) ? null : n;
  }, []);

  // ---------- State ----------
  const [loading, setLoading] = useState(true);

  // 1) Poursuites ?
  const [hasPoursuites, setHasPoursuites] = useState(null); // true|false

  // 2) Crédits (liste de mensualités)
  const [hasCredits, setHasCredits] = useState(null); // true|false
  const [credits, setCredits] = useState([]); // [string montantCHF]

  // 3) Leasings (liste de mensualités)
  const [hasLeasings, setHasLeasings] = useState(null); // true|false
  const [leasings, setLeasings] = useState([]); // [string montantCHF]

  // 4) Pensions alimentaires ?
  const [hasPension, setHasPension] = useState(null); // true|false
  const [pensionMontant, setPensionMontant] = useState("");

  // ---------- Pré-remplissage ----------
  useEffect(() => {
    (async () => {
      const ref = doc(db, "demandes", id);
      const snap = await getDoc(ref);
      if (snap.exists()) {
        const data = snap.data();
        const pers = Array.isArray(data.personnes) ? data.personnes : [];
        const p = pers[pIndex] || {};
        const ch = p.charges || null;

        if (ch) {
          setHasPoursuites(ch.hasPoursuites ?? null);

          setHasCredits(ch.hasCredits ?? null);
          setCredits(Array.isArray(ch.credits) ? ch.credits.map((n) => formatCHF(n)) : []);

          setHasLeasings(ch.hasLeasings ?? null);
          setLeasings(Array.isArray(ch.leasings) ? ch.leasings.map((n) => formatCHF(n)) : []);

          setHasPension(ch.hasPension ?? null);
          setPensionMontant(ch.pensionMontant ? formatCHF(ch.pensionMontant) : "");
        }
      }
      setLoading(false);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, pIndex]);

  // ---------- UI helpers ----------
  const RadioBtn = ({ checked, onClick, label }) => (
    <button
      type="button"
      onClick={onClick}
      className={`px-3 py-2 rounded-xl border text-sm ${
        checked ? "border-creditxblue text-creditxblue" : "border-gray-300 text-gray-700"
      }`}
    >
      {label}
    </button>
  );

  const InfoEnd = ({ children }) => (
    <div className="mt-4 rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-800">
      <div className="font-medium mb-1">💡 FIN DU FORMULAIRE</div>
      <div>{children}</div>
    </div>
  );

  // ---------- Validation ----------
  const canSave = useMemo(() => {
    // Q1 obligatoire
    if (hasPoursuites === null) return false;
    if (hasPoursuites === true) return true; // formulaire s’arrête ici (bloquant)

    // Q2: crédits -> si oui, au moins 1 mensualité et toutes valides
    if (hasCredits === null) return false;
    if (hasCredits === true) {
      if (credits.length === 0) return false;
      if (!credits.every((s) => parseCHF(s) !== null && parseCHF(s) >= 0)) return false;
    }

    // Q3: leasings
    if (hasLeasings === null) return false;
    if (hasLeasings === true) {
      if (leasings.length === 0) return false;
      if (!leasings.every((s) => parseCHF(s) !== null && parseCHF(s) >= 0)) return false;
    }

    // Q4: pension
    if (hasPension === null) return false;
    if (hasPension === true) {
      if (parseCHF(pensionMontant) === null) return false;
    }

    return true;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasPoursuites, hasCredits, credits, hasLeasings, leasings, hasPension, pensionMontant]);

  // ---------- Actions ----------
  const addCredit = () => setCredits((arr) => [...arr, ""]);
  const updateCredit = (i, v) =>
    setCredits((arr) => arr.map((x, idx) => (idx === i ? v : x)));
  const removeCredit = (i) => setCredits((arr) => arr.filter((_, idx) => idx !== i));

  const addLeasing = () => setLeasings((arr) => [...arr, ""]);
  const updateLeasing = (i, v) =>
    setLeasings((arr) => arr.map((x, idx) => (idx === i ? v : x)));
  const removeLeasing = (i) => setLeasings((arr) => arr.filter((_, idx) => idx !== i));

  // ---------- Save ----------
  const handleSave = async () => {
    const ref = doc(db, "demandes", id);
    const snap = await getDoc(ref);
    if (!snap.exists()) return;

    const data = snap.data();
    const pers = Array.isArray(data.personnes) ? [...data.personnes] : [];
    const p = pers[pIndex] || {};
    const employeurs = Array.isArray(p.employeurs) ? p.employeurs : [];

    const payload = {
      hasPoursuites: hasPoursuites === true,
      hasCredits: hasCredits === true,
      credits: hasCredits ? credits.map((s) => parseCHF(s) || 0) : [],
      hasLeasings: hasLeasings === true,
      leasings: hasLeasings ? leasings.map((s) => parseCHF(s) || 0) : [],
      hasPension: hasPension === true,
      pensionMontant: hasPension ? parseCHF(pensionMontant) || 0 : 0,
    };

    // Etat local charges
    let bloquant = payload.hasPoursuites === true;
    let complet = false;

    if (!bloquant) {
      const creditsOK = payload.hasCredits ? payload.credits.length > 0 && payload.credits.every((n) => n >= 0) : true;
      const leasingsOK =
        payload.hasLeasings ? payload.leasings.length > 0 && payload.leasings.every((n) => n >= 0) : true;
      const pensionOK = payload.hasPension ? payload.pensionMontant >= 0 : true;
      // Tous les champs obligatoires fournis
      complet = creditsOK && leasingsOK && pensionOK;
    } else {
      // Formulaire s’arrête dès Q1 -> considéré “terminé” mais bloquant
      complet = true;
    }

    const charges = { ...payload, bloquant, complet };

    // Ecrit sur la personne
    const personneMaj = { ...p, charges };
    // etatInfos global (emplois + charges) pour cette personne
    const newEtat = computeEtatInfos(personneMaj);

    // Persiste: personne + etatInfos dossier
    pers[pIndex] = { ...personneMaj, etatInfos: newEtat };
    await updateDoc(ref, { personnes: pers, etatInfos: newEtat });

    navigate(`/informations/${pIndex}/${id}`);
  };

  if (loading) return <div className="p-6">Chargement…</div>;

  return (
    <div className="min-h-screen bg-[#FCFCFC] flex justify-center px-4 pt-6 pb-20">
      <div className="w-full max-w-md">
        <button onClick={() => navigate(-1)} className="text-2xl mb-6">←</button>

        <div className="flex items-center gap-3 mb-4">
          <div className="w-9 h-9 rounded-full bg-creditxblue text-white flex items-center justify-center">
            <AssignmentTurnedInOutlinedIcon fontSize="small" />
          </div>
          <h1 className="text-xl font-semibold">Crédits & engagements</h1>
        </div>

        <div className="bg-white rounded-2xl p-4 space-y-6">
          {/* Q1 - Poursuites */}
          <div>
            <div className="text-sm text-gray-600 mb-2">Avez-vous des poursuites en cours ? *</div>
            <div className="flex gap-2">
              <RadioBtn checked={hasPoursuites === true} onClick={() => setHasPoursuites(true)} label="Oui" />
              <RadioBtn checked={hasPoursuites === false} onClick={() => setHasPoursuites(false)} label="Non" />
            </div>
            {hasPoursuites === true && (
              <InfoEnd>
                Malheureusement, vous ne pouvez pas aller plus loin. Revenez lorsque vous pourrez présenter
                un extrait de poursuites vierge.
              </InfoEnd>
            )}
          </div>

          {/* Q2 - Crédits (si pas de poursuites) */}
          {hasPoursuites === false && (
            <>
              <div>
                <div className="text-sm text-gray-600 mb-2">Avez-vous un ou plusieurs crédits en cours ? *</div>
                <div className="flex gap-2">
                  <RadioBtn checked={hasCredits === true} onClick={() => setHasCredits(true)} label="Oui" />
                  <RadioBtn checked={hasCredits === false} onClick={() => setHasCredits(false)} label="Non" />
                </div>

                {hasCredits === true && (
                  <div className="mt-3 space-y-2">
                    {credits.map((v, i) => (
                      <div key={i} className="flex gap-2 items-center">
                        <input
                          inputMode="numeric"
                          className="w-full rounded-xl border px-3 py-2"
                          placeholder="CHF 1’000"
                          value={formatCHF(v)}
                          onChange={(e) => updateCredit(i, e.target.value)}
                        />
                        <button
                          type="button"
                          className="px-2 py-1 text-sm rounded-lg border text-gray-700"
                          onClick={() => removeCredit(i)}
                        >
                          Suppr.
                        </button>
                      </div>
                    ))}
                    <button
                      type="button"
                      className="px-3 py-2 rounded-xl border border-creditxblue text-creditxblue"
                      onClick={addCredit}
                    >
                      Ajouter une mensualité
                    </button>
                  </div>
                )}
              </div>

              {/* Q3 - Leasings */}
              <div>
                <div className="text-sm text-gray-600 mb-2">Avez-vous un ou plusieurs leasings en cours ? *</div>
                <div className="flex gap-2">
                  <RadioBtn checked={hasLeasings === true} onClick={() => setHasLeasings(true)} label="Oui" />
                  <RadioBtn checked={hasLeasings === false} onClick={() => setHasLeasings(false)} label="Non" />
                </div>

                {hasLeasings === true && (
                  <div className="mt-3 space-y-2">
                    {leasings.map((v, i) => (
                      <div key={i} className="flex gap-2 items-center">
                        <input
                          inputMode="numeric"
                          className="w-full rounded-xl border px-3 py-2"
                          placeholder="CHF 1’000"
                          value={formatCHF(v)}
                          onChange={(e) => updateLeasing(i, e.target.value)}
                        />
                        <button
                          type="button"
                          className="px-2 py-1 text-sm rounded-lg border text-gray-700"
                          onClick={() => removeLeasing(i)}
                        >
                          Suppr.
                        </button>
                      </div>
                    ))}
                    <button
                      type="button"
                      className="px-3 py-2 rounded-xl border border-creditxblue text-creditxblue"
                      onClick={addLeasing}
                    >
                      Ajouter une mensualité
                    </button>
                  </div>
                )}
              </div>

              {/* Q4 - Pension */}
              <div>
                <div className="text-sm text-gray-600 mb-2">Payez-vous des pensions alimentaires ? *</div>
                <div className="flex gap-2">
                  <RadioBtn checked={hasPension === true} onClick={() => setHasPension(true)} label="Oui" />
                  <RadioBtn checked={hasPension === false} onClick={() => setHasPension(false)} label="Non" />
                </div>

                {hasPension === true && (
                  <div className="mt-3">
                    <input
                      inputMode="numeric"
                      className="w-full rounded-xl border px-3 py-2"
                      placeholder="CHF 1’000"
                      value={formatCHF(pensionMontant)}
                      onChange={(e) => setPensionMontant(e.target.value)}
                    />
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        {/* Actions */}
        <div className="mt-6 mb-10 flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="tw px-4 py-2 rounded-xl border border-gray-300 text-gray-700"
            type="button"
          >
            Annuler
          </button>
          <button
            onClick={handleSave}
            disabled={!canSave}
            className={`tw px-4 py-2 rounded-xl text-white ${
              canSave ? "bg-creditxblue hover:opacity-90" : "bg-gray-300 cursor-not-allowed"
            }`}
            type="button"
          >
            Enregistrer
          </button>
        </div>
      </div>
    </div>
  );
}
