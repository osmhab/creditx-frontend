import React, { useEffect, useMemo, useRef, useState, forwardRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, X, Search } from "lucide-react";

/**
 * SelecteurCreditX — sélecteur réutilisable, élégant et fluide (CreditX)
 *
 * Props
 * - label?: string
 * - value: string | number | null
 * - onChange: (v: string | number | null) => void
 * - options: Array<string | number | { value: string|number; label: string }>
 * - priority?: (string|number)[]    // valeurs à épingler en haut
 * - placeholder?: string
 * - helperText?: string
 * - error?: string                   // si défini, affiche l'état d'erreur
 * - disabled?: boolean
 * - required?: boolean
 * - searchable?: boolean             // par défaut true
 * - clearable?: boolean              // par défaut true
 * - emptyMessage?: string            // message quand aucune option ne matche
 * - className?: string
 */
const SelecteurCreditX = forwardRef(function SelecteurCreditX({
  label,
  value,
  onChange,
  options,
  priority = [],
  placeholder = "Sélectionner...",
  helperText,
  error,
  disabled = false,
  required = false,
  searchable = true,
  clearable = true,
  emptyMessage = "Aucun résultat",
  className = "",
}, forwardedRef) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const containerRef = useRef(null);
  const btnRef = useRef(null);

  // Merge external ref to button
  function setButtonRef(el) {
    btnRef.current = el;
    if (typeof forwardedRef === "function") forwardedRef(el);
    else if (forwardedRef) forwardedRef.current = el;
  }

  // Normalise options: string | number | {value,label}
  const normalized = useMemo(() => {
    const arr = (options || []).map((o) => {
      if (typeof o === "string" || typeof o === "number") {
        return { value: o, label: String(o) };
      }
      return o; // { value, label }
    });
    // Déduplique par value
    const map = new Map();
    for (const o of arr) if (!map.has(o.value)) map.set(o.value, o);
    return Array.from(map.values());
  }, [options]);

  const prioSet = useMemo(() => new Set(priority), [priority]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = q
      ? normalized.filter((o) => o.label.toLowerCase().includes(q))
      : normalized;
    const prio = list.filter((o) => prioSet.has(o.value));
    const rest = list.filter((o) => !prioSet.has(o.value));
    return { prio, rest };
  }, [normalized, query, prioSet]);

  // Fermer au clic extérieur
  useEffect(() => {
    function handleClickOutside(e) {
      if (!open) return;
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false);
        setQuery("");
      }
    }
    window.addEventListener("mousedown", handleClickOutside);
    return () => window.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  // Keyboard nav depuis le bouton
  useEffect(() => {
    function onKey(e) {
      if (!btnRef.current) return;
      if (document.activeElement !== btnRef.current) return;
      if (e.key === "ArrowDown" || e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        setOpen(true);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const currentLabel = useMemo(() => {
    const found = normalized.find((o) => o.value === value);
    return found?.label ?? "";
  }, [normalized, value]);

  const ringColor = error
    ? "ring-1 ring-red-400 focus:ring-red-500"
    : "ring-1 ring-transparent focus:ring-black/20";

  return (
    <div className={`w-full ${className}`} ref={containerRef}>
      {label && (
        <div className="mb-1 flex items-center gap-2">
          <label className="text-sm font-medium text-gray-900">
            {label}{required && <span className="text-red-500"> *</span>}
          </label>
          {error && (
            <span className="text-xs text-red-500">{error}</span>
          )}
        </div>
      )}

      <div className="relative">
        <button
          ref={setButtonRef}
          type="button"
          disabled={disabled}
          onClick={() => !disabled && setOpen((v) => !v)}
          className={`w-full group flex items-center justify-between rounded-xl bg-gray-100 px-4 py-3 text-left text-sm text-gray-800 transition ${ringColor} disabled:opacity-60 disabled:cursor-not-allowed`}
          aria-haspopup="listbox"
          aria-expanded={open}
        >
          <span className={`truncate ${!currentLabel ? "text-gray-400" : ""}`}>
            {currentLabel || placeholder}
          </span>
          <div className="flex items-center gap-1">
            {clearable && value !== null && value !== undefined && value !== "" && !disabled && (
              <X
                aria-label="Effacer la valeur"
                className="h-4 w-4 opacity-50 hover:opacity-100"
                onClick={(e) => {
                  e.stopPropagation();
                  onChange(null);
                }}
              />
            )}
            <ChevronDown className={`h-4 w-4 transition ${open ? "rotate-180" : ""}`} />
          </div>
        </button>

        <AnimatePresence>
          {open && (
            <motion.div
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 4 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.16 }}
              className="absolute z-50 mt-2 w-full overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-xl"
              role="listbox"
            >
              {searchable && (
                <div className="flex items-center gap-2 px-3 pt-3">
                  <Search className="h-4 w-4 text-gray-400" />
                  <input
                    autoFocus
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Rechercher..."
                    className="w-full rounded-lg bg-gray-50 px-3 py-2 text-sm outline-none focus:bg-gray-100"
                  />
                </div>
              )}

              <div className="max-h-64 overflow-auto py-2">
                {/* Section prioritaire */}
                {filtered.prio.length > 0 && (
                  <Section
                    title="Suggestions"
                    items={filtered.prio}
                    value={value}
                    onChoose={(v) => {
                      onChange(v);
                      setOpen(false);
                      setQuery("");
                    }}
                  />
                )}

                {/* Section reste */}
                <Section
                  title={filtered.prio.length ? "Toutes les options" : undefined}
                  items={filtered.rest}
                  value={value}
                  onChoose={(v) => {
                    onChange(v);
                    setOpen(false);
                    setQuery("");
                  }}
                  emptyMessage={emptyMessage}
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {(helperText || error) && (
        <p className={`mt-2 text-xs ${error ? "text-red-500" : "text-gray-500"}`}>
          {error || helperText}
        </p>
      )}
    </div>
  );
});

export default SelecteurCreditX;

function Section({ title, items, value, onChoose, emptyMessage }) {
  if (!items || items.length === 0) {
    return (
      <div className="px-3 py-8 text-center text-sm text-gray-400">
        {emptyMessage || "Aucune option"}
      </div>
    );
  }
  return (
    <div>
      {title && (
        <div className="px-4 pb-1 pt-2 text-[11px] font-semibold uppercase tracking-wide text-gray-400">
          {title}
        </div>
      )}
      <ul className="py-1">
        {items.map((o) => (
          <li key={o.value}>
            <button
              type="button"
              role="option"
              aria-selected={value === o.value}
              onClick={() => onChoose(o.value)}
              className={`flex w-full items-center justify-between px-4 py-2 text-sm transition hover:bg-gray-50 ${
                value === o.value ? "bg-gray-50" : ""
              }`}
            >
              <span className="truncate">{o.label}</span>
              {value === o.value && (
                <span className="text-[10px] font-medium text-gray-500">Sélectionné</span>
              )}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
