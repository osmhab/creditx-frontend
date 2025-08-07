import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { db } from "../../firebase-config";

export default function InformationsNomFamille() {
  const navigate = useNavigate();
  const { personneId, id } = useParams();
  const index = parseInt(personneId);

  const [nom, setNom] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchNom = async () => {
      const snap = await getDoc(doc(db, "demandes", id));
      if (snap.exists()) {
        const data = snap.data();
        const personne = data.personnes?.[index];
        if (personne?.nom) setNom(personne.nom);
      }
    };
    fetchNom();
  }, [id, index]);

  const handleSave = async () => {
    setLoading(true);
    try {
      const ref = doc(db, "demandes", id);
      const snap = await getDoc(ref);
      const data = snap.data();
      const personnes = [...(data.personnes || [])];
      personnes[index] = { ...personnes[index], nom };
      await updateDoc(ref, { personnes });
      navigate(`/informations/${index}/${id}`);
    } catch (error) {
      console.error("Erreur lors de la mise à jour du nom :", error);
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

        <h1 className="text-2xl font-bold mb-2">Nom de famille</h1>
        <p className="text-sm text-gray-500 mb-6">
          Tel qu’il apparaît sur votre carte d’identité officielle
        </p>

        <input
          type="text"
          placeholder="Nom de famille"
          value={nom}
          onChange={(e) => setNom(e.target.value)}
          className="w-full p-4 bg-gray-100 rounded-xl mb-8 text-sm"
        />

        <button
          onClick={handleSave}
          disabled={!nom || loading}
          className={`w-full rounded-full py-3 text-center text-sm font-medium transition ${
            nom ? "bg-black text-white hover:bg-gray-900" : "bg-gray-200 text-gray-400 cursor-not-allowed"
          }`}
        >
          {loading ? "Enregistrement..." : "Continuer"}
        </button>
      </div>
    </div>
  );
}
