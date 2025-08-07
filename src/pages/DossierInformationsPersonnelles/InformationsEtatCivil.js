import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { db } from "../../firebase-config";

export default function InformationsEtatCivil() {
  const navigate = useNavigate();
  const { personneId, id } = useParams();
  const index = parseInt(personneId);

  const [etatCivil, setEtatCivil] = useState("");
  const [loading, setLoading] = useState(false);

  const options = ["Célibataire", "Marié(e)", "Divorcé(e)", "Veuf(ve)"];

  useEffect(() => {
    const fetchEtatCivil = async () => {
      const snap = await getDoc(doc(db, "demandes", id));
      if (snap.exists()) {
        const data = snap.data();
        const personne = data.personnes?.[index];
        if (personne?.etatCivil) setEtatCivil(personne.etatCivil);
      }
    };
    fetchEtatCivil();
  }, [id, index]);

  const handleSave = async () => {
    setLoading(true);
    try {
      const ref = doc(db, "demandes", id);
      const snap = await getDoc(ref);
      const data = snap.data();
      const personnes = [...(data.personnes || [])];
      personnes[index] = { ...personnes[index], etatCivil };
      await updateDoc(ref, { personnes });
      navigate(`/informations/${index}/${id}`);
    } catch (error) {
      console.error("Erreur lors de la mise à jour de l'état civil :", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FCFCFC] flex justify-center px-4 pt-6">
      <div className="w-full max-w-md">
        <button onClick={() => navigate(-1)} className="mb-4">
          <span className="text-xl">←</span>
        </button>

        <h1 className="text-2xl font-bold mb-2">État civil</h1>
        <p className="text-sm text-gray-500 mb-6">
          Merci de sélectionner votre état civil actuel
        </p>

        <div className="flex flex-col gap-3 mb-8">
          {options.map((option) => (
            <button
              key={option}
              onClick={() => setEtatCivil(option)}
              className={`w-full py-3 rounded-xl text-sm border ${
                etatCivil === option
                  ? "bg-black text-white"
                  : "bg-white text-black border-gray-300"
              }`}
            >
              {option}
            </button>
          ))}
        </div>

        <button
          onClick={handleSave}
          disabled={!etatCivil || loading}
          className={`w-full rounded-full py-3 text-center text-sm font-medium transition ${
            etatCivil
              ? "bg-black text-white hover:bg-gray-900"
              : "bg-gray-200 text-gray-400 cursor-not-allowed"
          }`}
        >
          {loading ? "Enregistrement..." : "Continuer"}
        </button>
      </div>
    </div>
  );
}
