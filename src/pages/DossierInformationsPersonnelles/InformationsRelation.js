import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { db } from "../../firebase-config";

export default function InformationsRelation() {
  const navigate = useNavigate();
  const { personneId, id } = useParams();
  const index = parseInt(personneId);

  const [relation, setRelation] = useState("");
  const [loading, setLoading] = useState(false);

  const options = [
    "Conjoint-e (mariage)",
    "Partenaire (concubinage)",
    "Frère / Soeur",
    "Père / Mère",
  ];

  useEffect(() => {
    const fetchRelation = async () => {
      const snap = await getDoc(doc(db, "demandes", id));
      if (snap.exists()) {
        const data = snap.data();
        const personne = data.personnes?.[index];
        if (personne?.relationAvecDemandeurPrincipal) {
          setRelation(personne.relationAvecDemandeurPrincipal);
        }
      }
    };
    fetchRelation();
  }, [id, index]);

  const handleSave = async () => {
    setLoading(true);
    try {
      const ref = doc(db, "demandes", id);
      const snap = await getDoc(ref);
      const data = snap.data();
      const personnes = [...(data.personnes || [])];
      personnes[index] = {
        ...personnes[index],
        relationAvecDemandeurPrincipal: relation,
      };
      await updateDoc(ref, { personnes });
      navigate(`/informations/${index}/${id}`);
    } catch (error) {
      console.error("Erreur lors de la mise à jour de la relation :", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FCFCFC] flex justify-center px-4 pt-6">
      <div className="w-full max-w-md">
        <button
          onClick={() => navigate(`/informations/${index}/${id}`)}
          className="mb-4"
        >
          <span className="text-xl">←</span>
        </button>

        <h1 className="text-2xl font-bold mb-2">Lien avec le demandeur principal</h1>
        <p className="text-sm text-gray-500 mb-6">
          Merci d’indiquer le lien entre vous et le demandeur principal
        </p>

        <div className="space-y-4 mb-8">
          {options.map((opt) => (
            <div
              key={opt}
              onClick={() => setRelation(opt)}
              className={`w-full px-4 py-3 rounded-xl border cursor-pointer text-sm font-medium transition ${
                relation === opt
                  ? "border-black bg-black text-white"
                  : "border-gray-200 bg-white text-black hover:bg-gray-50"
              }`}
            >
              {opt}
            </div>
          ))}
        </div>

        <button
          onClick={handleSave}
          disabled={!relation || loading}
          className={`w-full rounded-full py-3 text-center text-sm font-medium transition ${
            relation
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
