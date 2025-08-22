// src/DossierBien/AdresseBien.js
import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { db } from "../../firebase-config";
import AddressInput from "../../components/AddressInput";
import PlaceOutlinedIcon from "@mui/icons-material/PlaceOutlined";


// Modèle standardisé (identique à InfosAdresse côté personnes)
const EMPTY = {
  formatted: "",
  route: "",
  streetNumber: "",
  postalCode: "",
  locality: "",
  country: "CH",
};

const normalizeAdresse = (raw) => {
  if (!raw) return { ...EMPTY };
  if (typeof raw === "string") return { ...EMPTY, formatted: raw };
  return { ...EMPTY, ...raw };
};

const isValidAdresse = (a) =>
  Boolean(a.route && a.streetNumber && a.postalCode && a.locality);

export default function AdresseBien() {
  const navigate = useNavigate();
  const { id } = useParams(); // id = id de la demande

  const [adresse, setAdresse] = useState(EMPTY);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Charger l'adresse du bien existante
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const snap = await getDoc(doc(db, "demandes", id));
        if (snap.exists() && mounted) {
          const data = snap.data() || {};
          const bien = data.bien || {};
          const current = normalizeAdresse(bien.adresse ?? bien.adresseFormatted);
          setAdresse(current);
        }
      } catch (e) {
        console.error("Erreur de chargement de l'adresse du bien:", e);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [id]);

  // Maintenir "formatted" propre si l'utilisateur remplit manuellement
  const formatted = useMemo(() => {
    const line1 =
      adresse.route && adresse.streetNumber
        ? `${adresse.streetNumber} ${adresse.route}`
        : adresse.route;
    const line2 = [adresse.postalCode, adresse.locality].filter(Boolean).join(" ");
    return [line1, line2].filter(Boolean).join(", ");
  }, [adresse.route, adresse.streetNumber, adresse.postalCode, adresse.locality]);

  useEffect(() => {
    setAdresse((prev) => ({ ...prev, formatted }));
  }, [formatted]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const ref = doc(db, "demandes", id);
      const snap = await getDoc(ref);
      const data = snap.data() || {};
      const bien = { ...(data.bien || {}) };

      const adr = { ...normalizeAdresse(adresse) };
      const adrFormatted =
        adr.formatted ||
        [
          adr.streetNumber && adr.route ? `${adr.streetNumber} ${adr.route}` : adr.route,
          [adr.postalCode, adr.locality].filter(Boolean).join(" "),
        ]
          .filter(Boolean)
          .join(", ");

      bien.adresse = adr;                 // <- objet structuré (nouveau standard)
      bien.adresseFormatted = adrFormatted; // <- string legacy-friendly

      await updateDoc(ref, { bien });

      // Retour au hub Bien : il recalculera etatBien automatiquement
      navigate(`/bien/${id}`);
    } catch (error) {
      console.error("Erreur lors de l'enregistrement de l'adresse du bien:", error);
      alert("Impossible d'enregistrer l'adresse du bien. Réessaie.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="p-6 text-base lg:text-sm">Chargement...</div>;

  return (
    <div className="min-h-screen bg-[#FCFCFC] flex justify-center px-4 pt-6">
      <div className="w-full max-w-md">
        <button onClick={() => navigate(`/bien/${id}`)} className="mb-4">
            <span className="text-xl">←</span>
        </button>


        <div className="flex items-center gap-3 mb-4">
            <div className="w-9 h-9 rounded-full bg-creditxblue text-white flex items-center justify-center">
                <PlaceOutlinedIcon fontSize="small" />
            </div>
                <h1 className="text-xl font-semibold">Adresse du bien</h1>
        </div>

        <p className="text-sm text-gray-500 mb-6">
          Indique l’adresse exacte du bien que tu souhaites financer (pas ton adresse personnelle).
        </p>

        <div className="mb-6">
          <AddressInput
            apiKey={process.env.REACT_APP_GOOGLE_MAPS_API_KEY}
            value={adresse}
            onChange={setAdresse}
            countryRestriction={["CH"]}
            label="Adresse du bien"
            required
          />
        </div>

        {/* Récapitulatif visuel */}
        <div className="rounded-2xl border border-gray-100 bg-white p-3 text-xs text-gray-600 mb-6">
          <div className="font-medium text-gray-700 mb-1">Récapitulatif</div>
          <div>{adresse.formatted || "—"}</div>
        </div>

        <button
          onClick={handleSave}
          disabled={!isValidAdresse(adresse) || saving}
          className={`w-full rounded-full py-3 text-center text-sm font-medium transition ${
            isValidAdresse(adresse) && !saving
              ? "bg-black text-white hover:bg-gray-900"
              : "bg-gray-200 text-gray-400 cursor-not-allowed"
          }`}
        >
          {saving ? "Enregistrement..." : "Continuer"}
        </button>
      </div>
    </div>
  );
}
