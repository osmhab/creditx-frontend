// src/pages/DossierInformationsPersonnelles/AdresseEmployeur.js
import React, { useState } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import PlaceOutlinedIcon from "@mui/icons-material/PlaceOutlined";
import AddressInput from "../../components/AddressInput";




export default function AdresseEmployeur() {
  const navigate = useNavigate();
  const { personneId, id, employeurId } = useParams();
  const routerLocation = useLocation();
  const draft = routerLocation.state?.draft ?? null;
  const fromType = routerLocation.state?.fromType ?? null; // "salarie" | "independant" | null


// Helpers pour l'adresse
const getFormatted = (a) => {
  if (!a) return "";
  if (typeof a === "string") return a;
  return a.formatted || a.formatted_address || a.description || a.label || "";
};

const normalizeAddress = (a) => {
  if (!a) return null;
  if (typeof a === "string") return { formatted: a };
  const formatted = getFormatted(a);
  // On renvoie un objet *clonable* par history.state (pas de fonctions/références)
  return {
    formatted,
    route: a?.route ?? null,
    streetNumber: a?.streetNumber ?? null,
    postalCode: a?.postalCode ?? null,
    locality: a?.locality ?? null,
    country: a?.country ?? null,
    lat: a?.lat ?? null,
    lng: a?.lng ?? null,
  };
};



// Adresse sélectionnée/éditée localement (objet retourné par AddressInput)
// -> si on arrive avec une adresse existante, on la pré-remplit
const [selected, setSelected] = useState(
  normalizeAddress(routerLocation.state?.initialAddress ?? null)
);


  // appelé par le composant quand une suggestion est choisie OU saisie validée
  const handleSelectAdresse = (addr) => {
  setSelected(normalizeAddress(addr));
};


  const handleContinuer = () => {
  const formatted = getFormatted(selected);
  if (!formatted) return;

  const safe = normalizeAddress(selected);

  navigate(`/informations/${personneId}/${id}/employeurs/${employeurId || "nouveau"}`, {
    replace: true,
    state: { selectedAddress: safe, fromType, draft },
  });
};





  return (
    <div className="min-h-screen bg-[#FCFCFC] flex justify-center px-4 pt-6 pb-20">
      <div className="w-full max-w-md">
        <button onClick={() => navigate(-1)} className="text-2xl mb-6">←</button>

        <div className="flex items-center gap-3 mb-4">
          <div className="w-9 h-9 rounded-full bg-creditxblue text-white flex items-center justify-center">
            <PlaceOutlinedIcon fontSize="small" />
          </div>
          <h1 className="text-xl font-semibold">Adresse de l’employeur</h1>
        </div>

        <div className="bg-white rounded-2xl p-4 space-y-4">
          {/* Autocomplete Google */}
          <AddressInput
            label="Rechercher une adresse"
            required
            value={selected}          // tu peux laisser null au départ, le composant gère
            onChange={(v) => setSelected(normalizeAddress(v))}    // si l'utilisateur édite manuellement
            onSelect={handleSelectAdresse} // quand il choisit une suggestion
            apiKey={process.env.REACT_APP_GOOGLE_MAPS_KEY}
          />

          <div className="flex items-center gap-3 pt-2">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="px-4 py-2 rounded-xl border border-gray-300 text-gray-700"
            >
              Annuler
            </button>

            <button
              type="button"
              onClick={handleContinuer}
              disabled={!selected || !getFormatted(selected)}
              className={`px-4 py-2 rounded-xl text-white ${
                selected && getFormatted(selected)
                    ? "bg-creditxblue hover:opacity-90"
                    : "bg-gray-300 cursor-not-allowed"
                }`}
            >
              Continuer
            </button>
          </div>

          {/* Petit aperçu de ce qui sera renvoyé (utile en debug) */}
          {getFormatted(selected) && (
            <div className="text-xs text-gray-500 pt-1">
              Sélection : {getFormatted(selected)}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}



