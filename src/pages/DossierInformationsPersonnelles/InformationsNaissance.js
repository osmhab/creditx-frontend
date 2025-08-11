import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { db } from "../../firebase-config";
import DateNaissanceCreditX from "../../components/DateNaissanceCreditX";

/**
 * Page: Date de naissance (design CreditX)
 * - Lit/écrit `personnes[index].dateNaissance` (ISO: YYYY-MM-DD) dans la collection `demandes`
 * - Utilise le composant réutilisable DateNaissanceCreditX (3 sélecteurs Jour/Mois/Année)
 * - Bouton Continuer activé uniquement si la date est valide
 */
export default function InformationsNaissance() {
  const navigate = useNavigate();
  const { personneId, id } = useParams();
  const index = parseInt(personneId);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dateIso, setDateIso] = useState(null); // "YYYY-MM-DD" ou null

  useEffect(() => {
    const fetchData = async () => {
      try {
        const snap = await getDoc(doc(db, "demandes", id));
        if (snap.exists()) {
          const data = snap.data();
          const p = data.personnes?.[index];
          if (p?.dateNaissance) setDateIso(p.dateNaissance);
        }
      } catch (e) {
        console.error("Erreur de lecture Firestore:", e);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id, index]);

  const handleSave = async () => {
    if (!dateIso) return; // sécurité
    setSaving(true);
    try {
      const ref = doc(db, "demandes", id);
      const snap = await getDoc(ref);
      if (!snap.exists()) throw new Error("Document introuvable");
      const data = snap.data();
      const personnes = [...(data.personnes || [])];
      personnes[index] = {
        ...personnes[index],
        dateNaissance: dateIso,
      };
      await updateDoc(ref, { personnes });
      navigate(`/informations/${index}/${id}`);
    } catch (e) {
      console.error("Erreur d'enregistrement Firestore:", e);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="p-6">Chargement...</div>;

  return (
    <div className="min-h-screen bg-[#FCFCFC] flex justify-center px-4 pt-6">
      <div className="w-full max-w-md">
        <button onClick={() => navigate(-1)} className="mb-4">
          <span className="text-xl">←</span>
        </button>

        <h1 className="text-2xl font-bold mb-1">Date de naissance</h1>
        <p className="text-sm text-gray-500 mb-6">
          Veuillez sélectionner votre date de naissance exacte
        </p>

        <div className="bg-white rounded-xl p-4">
          <DateNaissanceCreditX
            value={dateIso}
            onChange={(iso/* string|null */) => setDateIso(iso)}
            required
            // enforceAdult // ← décommente si tu veux imposer ≥ 18 ans
          />
        </div>

        <button
          onClick={handleSave}
          disabled={!dateIso || saving}
          className={`mt-6 w-full rounded-full py-3 text-center text-sm font-medium transition ${
            dateIso ? "bg-black text-white hover:bg-gray-900" : "bg-gray-200 text-gray-400 cursor-not-allowed"
          }`}
        >
          {saving ? "Enregistrement..." : "Continuer"}
        </button>
      </div>
    </div>
  );
}
