import React, { useEffect, useMemo, useRef, useState } from "react";
import SelecteurCreditX from "./SelecteurCreditX"; // ajuste le chemin selon ton arborescence
import { motion, AnimatePresence } from "framer-motion";

/**
 * DateNaissanceCreditX — sélecteur de date de naissance au design CreditX
 *
 * ✔ Mobile‑first, gros touch targets, UX fluide
 * ✔ 3 sélecteurs stylés (Jour / Mois / Année) avec auto‑avance du focus
 * ✔ Validation dynamique des jours selon mois + année bissextile
 * ✔ Format ISO (YYYY-MM-DD) en sortie + contrôle d'âge optionnel
 *
 * Props
 * - value?: string | { jour?: number; mois?: number; annee?: number }
 * - onChange: (isoDate: string | null, parts: { jour: number|null; mois: number|null; annee: number|null }) => void
 * - label?: string
 * - helperText?: string
 * - error?: string
 * - required?: boolean
 * - minYear?: number   // défaut: année courante - 120
 * - maxYear?: number   // défaut: année courante
 * - autoFocus?: boolean
 * - enforceAdult?: boolean // si true, force >= 18 ans
 *
 * Exemple d'utilisation:
 * <DateNaissanceCreditX
 *   value={dateNaissance}
 *   onChange={(iso, parts) => setDateNaissance(iso)}
 *   enforceAdult
 * />
 */
export default function DateNaissanceCreditX({
  value,
  onChange,
  label = "Date de naissance",
  helperText,
  error,
  required = false,
  minYear,
  maxYear,
  autoFocus = false,
  enforceAdult = false,
}) {
  const today = useMemo(() => new Date(), []);
  const defaultMax = today.getFullYear();
  const defaultMin = defaultMax - 120;
  const minY = minYear ?? defaultMin;
  const maxY = maxYear ?? defaultMax;

  // Décode value initiale
  const initial = useMemo(() => parseToParts(value), [value]);
  const [jour, setJour] = useState(initial.jour);
  const [mois, setMois] = useState(initial.mois);
  const [annee, setAnnee] = useState(initial.annee);

  const jourRef = useRef(null);
  const moisRef = useRef(null);
  const anneeRef = useRef(null);

  useEffect(() => {
    // recalcul des jours si mois/année changent et clamp la valeur
    const maxJours = daysInMonth(mois, annee);
    if (jour && maxJours && jour > maxJours) setJour(maxJours);
  }, [mois, annee]);

  // options
  const moisOptions = useMemo(
    () => [
      { value: 1, label: "Janvier" },
      { value: 2, label: "Février" },
      { value: 3, label: "Mars" },
      { value: 4, label: "Avril" },
      { value: 5, label: "Mai" },
      { value: 6, label: "Juin" },
      { value: 7, label: "Juillet" },
      { value: 8, label: "Août" },
      { value: 9, label: "Septembre" },
      { value: 10, label: "Octobre" },
      { value: 11, label: "Novembre" },
      { value: 12, label: "Décembre" },
    ],
    []
  );

  const anneeOptions = useMemo(() => {
    const arr = [];
    for (let y = maxY; y >= minY; y--) arr.push(y);
    return arr;
  }, [minY, maxY]);

  const jourOptions = useMemo(() => {
    const maxJ = daysInMonth(mois, annee) || 31;
    return Array.from({ length: maxJ }, (_, i) => i + 1);
  }, [mois, annee]);

  // Callback commun de sortie
  useEffect(() => {
    const iso = buildISO(annee, mois, jour);
    let finalISO = iso;
    let err = error;

    if (enforceAdult && iso) {
      const isAdult = checkAdult(iso, 18);
      if (!isAdult) {
        err = "Vous devez avoir au moins 18 ans.";
        finalISO = null;
      }
    }

    onChange?.(finalISO, {
      jour: jour ?? null,
      mois: mois ?? null,
      annee: annee ?? null,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [jour, mois, annee, enforceAdult]);

  // Auto-focus progressif
  const focusNext = (from) => {
    if (from === "jour" && moisRef.current) moisRef.current.focus();
    if (from === "mois" && anneeRef.current) anneeRef.current.focus();
  };

  const helper = helperText ?? (required ? "Champ requis" : undefined);

  return (
    <div className="w-full">
      {label && (
        <div className="mb-2">
          <label className="text-sm font-medium text-gray-900">
            {label}
            {required && <span className="text-red-500"> *</span>}
          </label>
        </div>
      )}

      <motion.div
        initial={{ opacity: 0, y: 4 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.16 }}
        className="grid grid-cols-3 gap-2"
      >
        {/* Jour */}
        <SelecteurCreditX
          label={undefined}
          value={jour ?? null}
          onChange={(v) => {
            setJour(toNumber(v));
            focusNext("jour");
          }}
          options={jourOptions.map((d) => ({ value: d, label: String(d).padStart(2, "0") }))}
          placeholder="JJ"
          required={required}
          searchable={false}
          clearable={false}
          className="[&>div>button]:py-3" // un peu plus compact
          ref={jourRef}
        />

        {/* Mois */}
        <SelecteurCreditX
          label={undefined}
          value={mois ?? null}
          onChange={(v) => {
            setMois(toNumber(v));
            focusNext("mois");
          }}
          options={moisOptions}
          placeholder="MM"
          required={required}
          searchable={false}
          clearable={false}
          className="[&>div>button]:py-3"
          ref={moisRef}
        />

        {/* Année */}
        <SelecteurCreditX
        label={undefined}
        value={annee ?? null}
        onChange={(v) => setAnnee(toNumber(v))}
        options={anneeOptions.map((y) => ({ value: y, label: String(y) }))}  // ← ICI
        placeholder="AAAA"
        required={required}
        searchable={false}
        clearable={false}
        className="[&>div>button]:py-3"
        ref={anneeRef}
        />

      </motion.div>

      {(helper || error) && (
        <p className={`mt-2 text-xs ${error ? "text-red-500" : "text-gray-500"}`}>
          {error || helper}
        </p>
      )}
    </div>
  );
}

// Utils
function toNumber(v) {
  if (typeof v === "number") return v;
  const n = parseInt(v, 10);
  return Number.isFinite(n) ? n : null;
}

function parseToParts(v) {
  if (!v) return { jour: null, mois: null, annee: null };
  if (typeof v === "string") {
    // attend un ISO "YYYY-MM-DD"
    const m = v.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (m) return { annee: +m[1], mois: +m[2], jour: +m[3] };
    return { jour: null, mois: null, annee: null };
  }
  return {
    jour: v.jour ?? null,
    mois: v.mois ?? null,
    annee: v.annee ?? null,
  };
}

function buildISO(annee, mois, jour) {
  if (!annee || !mois || !jour) return null;
  if (!isValidDate(annee, mois, jour)) return null;
  const mm = String(mois).padStart(2, "0");
  const dd = String(jour).padStart(2, "0");
  return `${annee}-${mm}-${dd}`;
}

function isValidDate(y, m, d) {
  if (!y || !m || !d) return false;
  const dm = daysInMonth(m, y);
  if (!dm) return false;
  return d >= 1 && d <= dm;
}

function daysInMonth(m, y) {
  if (!m || !y) return null;
  return new Date(y, m, 0).getDate(); // JS trick: day 0 = dernier jour du mois précédent
}

function checkAdult(iso, minYears = 18) {
  const [Y, M, D] = iso.split("-").map((x) => parseInt(x, 10));
  const birth = new Date(Y, M - 1, D);
  const now = new Date();
  const cutoff = new Date(now.getFullYear() - minYears, now.getMonth(), now.getDate());
  return birth <= cutoff;
}
