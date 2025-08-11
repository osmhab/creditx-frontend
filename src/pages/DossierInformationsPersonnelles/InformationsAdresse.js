import React, { useEffect, useState, useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { db } from "../../firebase-config";
import AddressInput from "../../components/AddressInput";

/**
 * Écran Adresse – version CreditX
 * - Utilise le composant AddressInput (Google Places + manuel)
 * - Sauvegarde un objet structuré dans Firestore: {
 *     formatted, route, streetNumber, postalCode, locality, country
 *   }
 * - Ajoute aussi une string `adresseFormatted` pour la rétrocompatibilité
 */

const EMPTY = {
  formatted: "",
  route: "",
  streetNumber: "",
  postalCode: "",
  locality: "",
  country: "CH",
};

function normalizeAdresse(raw) {
  if (!raw) return { ...EMPTY };
  if (typeof raw === "string") return { ...EMPTY, formatted: raw };
  // s'assure que toutes les clés existent
  return { ...EMPTY, ...raw };
}

function isValidAdresse(a) {
  return Boolean(a.route && a.streetNumber && a.postalCode && a.locality);
}

export default function InformationsAdresse() {
  const navigate = useNavigate();
  const { personneId, id } = useParams();
  const index = Number.parseInt(personneId, 10);

  const [adresse, setAdresse] = useState(EMPTY);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // Charger l'adresse existante
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setLoading(true);
        const snap = await getDoc(doc(db, "demandes", id));
        if (snap.exists()) {
          const data = snap.data();
          const personne = data.personnes?.[index];
          // accepte objet {..} OU ancienne string (adresseFormatted)
          const current = normalizeAdresse(personne?.adresse ?? personne?.adresseFormatted);
          if (mounted) setAdresse(current);
        }
      } catch (e) {
        console.error("Erreur de chargement de l'adresse:", e);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [id, index]);

  // Mettre à jour le champ formatted à la volée quand les éléments clés changent
  const formatted = useMemo(() => {
    const line1 = adresse.route && adresse.streetNumber ? `${adresse.streetNumber} ${adresse.route}` : adresse.route;
    const line2 = [adresse.postalCode, adresse.locality].filter(Boolean).join(" ");
    return [line1, line2].filter(Boolean).join(", ");
  }, [adresse.route, adresse.streetNumber, adresse.postalCode, adresse.locality]);

  useEffect(() => {
    // si l'utilisateur remplit manuellement, on maintient formatted propre
    setAdresse((prev) => ({ ...prev, formatted }));
  }, [formatted]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const ref = doc(db, "demandes", id);
      const snap = await getDoc(ref);
      const data = snap.data() || {};
      const personnes = Array.isArray(data.personnes) ? [...data.personnes] : [];
      const personne = { ...(personnes[index] || {}) };

      const adr = { ...normalizeAdresse(adresse) };
      // string rétrocompatible pour tous les écrans historiques
      const adrFormatted = adr.formatted ||
        [
          adr.streetNumber && adr.route ? `${adr.streetNumber} ${adr.route}` : adr.route,
          [adr.postalCode, adr.locality].filter(Boolean).join(" ")
        ].filter(Boolean).join(", ");

      personne.adresse = adr;                   // <- objet (nouveau standard)
      personne.adresseFormatted = adrFormatted; // <- string (legacy-friendly)

      personnes[index] = personne;
      await updateDoc(ref, { personnes });
      navigate(`/informations/${index}/${id}`);
    } catch (error) {
      console.error("Erreur lors de la mise à jour de l'adresse:", error);
      alert("Impossible d'enregistrer l'adresse. Réessaie.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FCFCFC] flex justify-center px-4 pt-6">
      <div className="w-full max-w-md">
        <button onClick={() => navigate(-1)} className="mb-4">
          <span className="text-xl">←</span>
        </button>

        <h1 className="text-2xl font-bold mb-2">Adresse</h1>
        <p className="text-sm text-gray-500 mb-6">Merci d’indiquer votre adresse complète actuelle</p>

        {/* AddressInput – UX mobile + Framer + Google Places */}
        <div className="mb-6">
          <AddressInput
            apiKey={process.env.REACT_APP_GOOGLE_MAPS_API_KEY}
            value={adresse}
            onChange={setAdresse}
            countryRestriction={["CH"]}
            label="Adresse"
            required
          />
        </div>

        {/* Résumé visuel */}
        <div className="rounded-2xl border border-gray-100 bg-white p-3 text-xs text-gray-600 mb-6">
          <div className="font-medium text-gray-700 mb-1">Récapitulatif</div>
          <div>{adresse.formatted || "—"}</div>
        </div>

        <button
          onClick={handleSave}
          disabled={!isValidAdresse(adresse) || saving || loading}
          className={`w-full rounded-full py-3 text-center text-sm font-medium transition ${
            isValidAdresse(adresse) && !saving && !loading
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
