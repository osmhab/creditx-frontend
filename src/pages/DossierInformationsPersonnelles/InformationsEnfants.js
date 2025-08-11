import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { db } from "../../firebase-config";
import CompteurCreditX from "../../components/CompteurCreditX";
import DateNaissanceCreditX from "../../components/DateNaissanceCreditX";



export default function InformationsEnfants() {
  const navigate = useNavigate();
  const { personneId, id } = useParams();
  const index = parseInt(personneId);

  const [enfantsACharge, setEnfantsACharge] = useState(null);
  const [nombre, setNombre] = useState(1);
  const [enfants, setEnfants] = useState([{ prenom: "", dateNaissance: "" }]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      const snap = await getDoc(doc(db, "demandes", id));
      if (snap.exists()) {
        const data = snap.data();
        const personne = data.personnes?.[index];
        if (personne) {
          if (personne.enfantsACharge !== undefined) {
            setEnfantsACharge(personne.enfantsACharge);
          }
          if (Array.isArray(personne.enfants) && personne.enfants.length > 0) {
            setEnfants(personne.enfants);
            setNombre(personne.enfants.length);
          }
        }
      }
    };
    fetchData();
  }, [id, index]);

  const handleChangeEnfant = (i, field, value) => {
    const updated = [...enfants];
    updated[i][field] = value;
    setEnfants(updated);
  };

  const handleNombreChange = (n) => {
  const nb = parseInt(n, 10);
  setNombre(nb);
  const current = enfants.slice(0, nb);
  while (current.length < nb) {
    current.push({ prenom: "", dateNaissance: "" });
  }
  setEnfants(current);
};


  const handleSave = async () => {
    setLoading(true);
    try {
      const ref = doc(db, "demandes", id);
      const snap = await getDoc(ref);
      const data = snap.data();
      const personnes = [...(data.personnes || [])];
      personnes[index] = {
        ...personnes[index],
        enfantsACharge: enfantsACharge,
        enfants: enfantsACharge ? enfants : [],
      };
      await updateDoc(ref, { personnes });
      navigate(`/informations/${index}/${id}`);
    } catch (error) {
      console.error("Erreur lors de la sauvegarde :", error);
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

        <h1 className="text-2xl font-bold mb-2">Enfants à charge</h1>
        <p className="text-sm text-gray-500 mb-6">
          Avez-vous des enfants à charge (moins de 18 ans ou moins de 25 ans en formation) ?
        </p>

        <div className="flex gap-3 mb-6">
          <button
            onClick={() => {
              setEnfantsACharge(true);
              setNombre(1);
              setEnfants([{ prenom: "", dateNaissance: "" }]);
            }}
            className={`px-4 py-2 rounded-full border text-sm font-medium transition ${
              enfantsACharge === true
                ? "bg-black text-white"
                : "bg-white text-black border-gray-300 hover:bg-gray-50"
            }`}
          >
            Oui
          </button>
          <button
            onClick={() => {
              setEnfantsACharge(false);
              setNombre(0);
              setEnfants([]);
            }}
            className={`px-4 py-2 rounded-full border text-sm font-medium transition ${
              enfantsACharge === false
                ? "bg-black text-white"
                : "bg-white text-black border-gray-300 hover:bg-gray-50"
            }`}
          >
            Non
          </button>
        </div>

        {enfantsACharge && (
          <div className="mb-6 space-y-4">
           <CompteurCreditX
  label="Nombre d’enfants"
  value={nombre}
  onChange={(n) => handleNombreChange(n)}
  min={1}            // au moins 1 si enfantsACharge = true
  max={10}           // tu peux ajuster
  step={1}
  size="lg"          // un peu plus grand pour le confort
  helperText="Moins de 18 ans ou moins de 25 ans en formation"
/>


            {enfants.map((enfant, i) => (
              <div key={i} className="bg-gray-50 p-4 rounded-xl space-y-3">
                <h3 className="font-medium text-sm mb-1">Enfant {i + 1}</h3>
                <input
                  type="text"
                  placeholder="Prénom"
                  className="w-full p-3 rounded-xl bg-white text-sm border"
                  value={enfant.prenom}
                  onChange={(e) => handleChangeEnfant(i, "prenom", e.target.value)}
                />

                {/* Remplacement par le nouveau composant de date */}
                <DateNaissanceCreditX
                  value={enfant.dateNaissance || null}
                  onChange={(iso /* string|null */) => handleChangeEnfant(i, "dateNaissance", iso)}
                  required
                />
              </div>
            ))}
          </div>
        )}

        <button
          onClick={handleSave}
          disabled={loading || enfantsACharge === null}
          className={`w-full rounded-full py-3 text-center text-sm font-medium transition ${
            enfantsACharge !== null
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
