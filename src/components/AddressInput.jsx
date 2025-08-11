import React, { useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, MapPin, Pencil, ChevronDown, Loader2, X } from "lucide-react";

/**
 * CreditX AddressInput
 * — Google Places (auto) + saisie manuelle (fallback)
 * — UX optimisée mobile + animations Framer Motion
 * — Design minimal, propre, inspiré de CreditX (fond blanc, accents bleus)
 *
 * Props
 * - value: {
 *     formatted?: string,
 *     route?: string,
 *     streetNumber?: string,
 *     postalCode?: string,
 *     locality?: string,
 *     country?: string
 *   }
 * - onChange: (value) => void
 * - label?: string (par défaut: "Adresse")
 * - required?: boolean
 * - apiKey?: string (optionnel – si non fourni, on suppose que Maps JS est déjà chargé)
 * - countryRestriction?: string | string[] (par défaut: "CH")
 * - className?: string
 */

const DEFAULT_VALUE = {
  formatted: "",
  route: "",
  streetNumber: "",
  postalCode: "",
  locality: "",
  country: "CH",
};

function loadGoogleScript(apiKey) {
  if (typeof window === "undefined") return Promise.resolve(false);
  if (window.google && window.google.maps && window.google.maps.places) return Promise.resolve(true);
  if (!apiKey) return Promise.resolve(false);

  const id = "google-maps-js";
  const existing = document.getElementById(id);
  if (existing) {
    return new Promise((resolve) => {
      existing.addEventListener("load", () => resolve(true));
      existing.addEventListener("error", () => resolve(false));
    });
  }

  const script = document.createElement("script");
  script.id = id;
  script.async = true;
  script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places&language=fr`;

  return new Promise((resolve) => {
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.head.appendChild(script);
  });
}

const useGoogleReady = (apiKey) => {
  const [ready, setReady] = useState(false);
  useEffect(() => {
    let mounted = true;
    (async () => {
      const ok = await loadGoogleScript(apiKey);
      if (!mounted) return;
      setReady(!!(ok || (window.google && window.google.maps && window.google.maps.places)));
    })();
    return () => { mounted = false; };
  }, [apiKey]);
  return ready;
};

const cx = (...classes) => classes.filter(Boolean).join(" ");

function parseAddressFromPlace(place) {
  const components = place.address_components || [];
  const get = (type) => components.find((c) => c.types.includes(type))?.long_name || "";
  const short = (type) => components.find((c) => c.types.includes(type))?.short_name || "";
  const route = get("route");
  const streetNumber = get("street_number");
  const postalCode = get("postal_code");
  const locality = get("locality") || get("postal_town") || get("administrative_area_level_2");
  const country = short("country") || "";
  const formatted = place.formatted_address || [streetNumber, route, postalCode, locality].filter(Boolean).join(", ");
  return { formatted, route, streetNumber, postalCode, locality, country };
}

function SuggestionItem({ primary, secondary, onClick, active }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cx(
        "w-full text-left px-3 py-2 rounded-xl transition-colors",
        active ? "bg-blue-50" : "hover:bg-gray-50"
      )}
    >
      <div className="flex items-center gap-2">
        <MapPin className="h-4 w-4 opacity-70" />
        <div>
          <div className="text-sm font-medium text-gray-900 leading-tight">{primary}</div>
          {secondary && (
            <div className="text-xs text-gray-500 leading-tight">{secondary}</div>
          )}
        </div>
      </div>
    </button>
  );
}

export default function AddressInput({
  value: controlledValue,
  onChange,
  label = "Adresse",
  required = false,
  apiKey,
  countryRestriction = "CH",
  className,
}) {
  const ready = useGoogleReady(apiKey);
  const [internal, setInternal] = useState(() => ({ ...DEFAULT_VALUE, ...(controlledValue || {}) }));
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [openList, setOpenList] = useState(false);
  const [manual, setManual] = useState(false);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef(null);
  const serviceRef = useRef(null);
  const sessionTokenRef = useRef(null);

  const countryArray = useMemo(() => (Array.isArray(countryRestriction) ? countryRestriction : [countryRestriction]), [countryRestriction]);

  // keep controlled value in sync
  useEffect(() => {
    if (controlledValue) setInternal((prev) => ({ ...prev, ...controlledValue }));
  }, [controlledValue]);

  // init places service
  useEffect(() => {
    if (!ready || manual) return;
    if (!window.google?.maps?.places) return;
    serviceRef.current = new window.google.maps.places.AutocompleteService();
    sessionTokenRef.current = new window.google.maps.places.AutocompleteSessionToken();
  }, [ready, manual]);

  // fetch suggestions
  useEffect(() => {
    const svc = serviceRef.current;
    if (!ready || manual || !svc) return;
    if (!query || query.trim().length < 3) {
      setSuggestions([]);
      return;
    }
    const controller = new AbortController();
    setLoading(true);
    const request = {
      input: query,
      componentRestrictions: { country: countryArray },
      types: ["address"],
      sessionToken: sessionTokenRef.current,
      language: "fr",
    };
    // AutocompleteService doesn't support AbortController but we keep pattern for symmetry
    svc.getPlacePredictions(request, (preds) => {
      setSuggestions((preds || []).slice(0, 6));
      setLoading(false);
      setOpenList(true);
    });
    return () => controller.abort();
  }, [query, ready, manual, countryArray]);

  function emitChange(next) {
    setInternal(next);
    onChange?.(next);
  }

  async function handleSelect(pred) {
    if (!window.google?.maps?.places) return;
    try {
      setLoading(true);
      const placesService = new window.google.maps.places.PlacesService(document.createElement("div"));
      await new Promise((resolve) => {
        placesService.getDetails(
          {
            placeId: pred.place_id,
            fields: ["address_components", "formatted_address"],
            sessionToken: sessionTokenRef.current,
          },
          (place) => {
            const parsed = parseAddressFromPlace(place || {});
            emitChange(parsed);
            setQuery(parsed.formatted || `${parsed.streetNumber || ""} ${parsed.route || ""}`.trim());
            setSuggestions([]);
            setOpenList(false);
            setLoading(false);
            resolve();
          }
        );
      });
    } catch (e) {
      setLoading(false);
    }
  }

  function clearAll() {
    setQuery("");
    emitChange({ ...DEFAULT_VALUE, country: countryArray[0] || "CH" });
    setSuggestions([]);
    setOpenList(false);
  }

  const missingNumber = internal.route && !internal.streetNumber;

  return (
    <div className={cx("w-full", className)}>
      <label className="block mb-1 text-sm font-medium text-gray-900">
        {label} {required && <span className="text-blue-600">*</span>}
      </label>

      {/* Search / Autocomplete field */}
      <div className={cx(
        "group relative flex items-center gap-2 rounded-2xl border border-gray-200 bg-white px-3 py-2",
        "focus-within:border-blue-500 focus-within:ring-4 focus-within:ring-blue-100"
      )}>
        <Search className="h-4 w-4 shrink-0 text-gray-400" />
        <input
          ref={inputRef}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setOpenList(true)}
          placeholder={ready && !manual ? "Commencez à taper votre adresse…" : "Rue et numéro"}
          className="w-full bg-transparent outline-none text-[15px] placeholder:text-gray-400"
          inputMode="text"
          autoComplete="off"
        />
        {loading && <Loader2 className="h-4 w-4 animate-spin text-gray-400" />}
        {(query || internal.formatted) && (
          <button type="button" onClick={clearAll} className="rounded-full p-1 hover:bg-gray-100">
            <X className="h-4 w-4 text-gray-500" />
          </button>
        )}
        <button
          type="button"
          onClick={() => setManual((m) => !m)}
          className="flex items-center gap-1 rounded-xl border border-gray-200 px-2 py-1 text-xs text-gray-600 hover:bg-gray-50"
          title={manual ? "Utiliser la recherche" : "Saisie manuelle"}
        >
          <Pencil className="h-3.5 w-3.5" />
          {manual ? "Auto" : "Manuel"}
        </button>
      </div>

      {/* Suggestions dropdown */}
      <AnimatePresence>
        {!manual && ready && openList && suggestions.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.18 }}
            className="mt-2 overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-[0_10px_30px_rgba(0,0,0,0.06)]"
          >
            {suggestions.map((s, idx) => (
              <SuggestionItem
                key={s.place_id}
                primary={s.structured_formatting?.main_text || s.description}
                secondary={s.structured_formatting?.secondary_text}
                onClick={() => handleSelect(s)}
                active={idx === 0}
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Manual fields or resolved address */}
      <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label className="mb-1 block text-xs font-medium text-gray-700">Rue</label>
          <div className="relative">
            <input
              className={cx(
                "w-full rounded-2xl border border-gray-200 bg-white px-3 py-2 text-sm outline-none",
                "focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
              )}
              value={internal.route}
              onChange={(e) => emitChange({ ...internal, route: e.target.value })}
              placeholder="Rue"
            />
            {missingNumber && (
              <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-[11px] text-amber-600">
                Nº ?
              </span>
            )}
          </div>
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-700">Numéro</label>
          <input
            className={cx(
              "w-full rounded-2xl border border-gray-200 bg-white px-3 py-2 text-sm outline-none",
              "focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
            )}
            value={internal.streetNumber}
            onChange={(e) => emitChange({ ...internal, streetNumber: e.target.value })}
            placeholder="Nº"
            inputMode="numeric"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-700">Code postal</label>
          <input
            className={cx(
              "w-full rounded-2xl border border-gray-200 bg-white px-3 py-2 text-sm outline-none",
              "focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
            )}
            value={internal.postalCode}
            onChange={(e) => emitChange({ ...internal, postalCode: e.target.value.replace(/[^0-9]/g, "") })}
            placeholder="1950"
            inputMode="numeric"
            maxLength={6}
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-700">Localité</label>
          <input
            className={cx(
              "w-full rounded-2xl border border-gray-200 bg-white px-3 py-2 text-sm outline-none",
              "focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
            )}
            value={internal.locality}
            onChange={(e) => emitChange({ ...internal, locality: e.target.value })}
            placeholder="Sion"
          />
        </div>
      </div>

      {/* Helper / formatted */}
      <div className="mt-2 flex items-center justify-between">
        <div className="text-xs text-gray-500">
          {internal.route || internal.locality ? (
            <span>
              {internal.streetNumber ? `${internal.streetNumber} ` : ""}
              {internal.route}
              {internal.postalCode || internal.locality ? ", " : ""}
              {internal.postalCode} {internal.locality}
            </span>
          ) : (
            <span>Entrez une adresse complète. Pays: {internal.country || countryArray[0] || "CH"}</span>
          )}
        </div>
        <button
          type="button"
          onClick={() => {
            const formatted = [
              internal.streetNumber && internal.route ? `${internal.streetNumber} ${internal.route}` : internal.route,
              [internal.postalCode, internal.locality].filter(Boolean).join(" ")
            ].filter(Boolean).join(", ");
            emitChange({ ...internal, formatted });
          }}
          className="text-xs rounded-xl border border-gray-200 px-2 py-1 text-gray-600 hover:bg-gray-50"
        >
          Mettre à jour le formaté
        </button>
      </div>

      {/* Validation hint */}
      <AnimatePresence>
        {missingNumber && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            className="mt-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-[12px] text-amber-800"
          >
            Le numéro de rue semble manquant. Ajoutez-le pour une adresse plus précise.
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// --- Exemple d'utilisation ---
// <AddressInput
//   apiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY}
//   value={adresse}
//   onChange={setAdresse}
//   countryRestriction={["CH", "FR"]}
// />
