import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { db } from "../../firebase-config";
import SelecteurCreditX from "../../components/SelecteurCreditX";



export default function InformationsDegreFormation() {
  const navigate = useNavigate();
  const { personneId, id } = useParams();
  const index = parseInt(personneId);

  const [formation, setFormation] = useState("");
  const [loading, setLoading] = useState(false);

  const options = [
    "Aucune formation achevée",
    "Formation obligatoire",
    "Formation professionnelle (CFC, AFP)",
    "Maturité ou diplôme de culture générale",
    "Formation tertiaire (HES, université, etc.)",
  ];

  useEffect(() => {
    const fetchFormation = async () => {
      const snap = await getDoc(doc(db, "demandes", id));
      if (snap.exists()) {
        const data = snap.data();
        const personne = data.personnes?.[index];
        if (personne?.formation) setFormation(personne.formation);
      }
    };
    fetchFormation();
  }, [id, index]);

  const handleSave = async () => {
    setLoading(true);
    try {
      const ref = doc(db, "demandes", id);
      const snap = await getDoc(ref);
      const data = snap.data();
      const personnes = [...(data.personnes || [])];
      personnes[index] = { ...personnes[index], formation };
      await updateDoc(ref, { personnes });
      navigate(`/informations/${index}/${id}`);
    } catch (error) {
      console.error("Erreur lors de la mise à jour du degré de formation :", error);
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

        <h1 className="text-2xl font-bold mb-2">Degré de formation</h1>
        <p className="text-sm text-gray-500 mb-6">
          Veuillez sélectionner votre formation la plus élevée
        </p>

        <SelecteurCreditX
  label="Degré de formation"
  value={formation || null}
  onChange={setFormation}
  options={options}
  placeholder="Sélectionner un degré de formation"
  searchable={false}
/>

<br></br>

<button
  onClick={handleSave}
  disabled={!formation || loading}
  className={`w-full rounded-full py-3 text-center text-sm font-medium transition ${
    formation ? "bg-black text-white hover:bg-gray-900" : "bg-gray-200 text-gray-400 cursor-not-allowed"
  }`}
>
  {loading ? "Enregistrement..." : "Continuer"}
</button>
      </div>
    </div>
  );
}
