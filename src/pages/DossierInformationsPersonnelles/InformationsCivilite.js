import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { db } from "../../firebase-config";
import SelecteurCreditX from "../../components/SelecteurCreditX";

export default function InformationsCivilite() {
  const navigate = useNavigate();
  const { personneId, id } = useParams();
  const index = parseInt(personneId);

  const [civilite, setCivilite] = useState("");
  const [loading, setLoading] = useState(false);

  const options = ["Monsieur", "Madame"];

  useEffect(() => {
    const fetchCivilite = async () => {
      const snap = await getDoc(doc(db, "demandes", id));
      if (snap.exists()) {
        const data = snap.data();
        const personne = data.personnes?.[index];
        if (personne?.civilite) setCivilite(personne.civilite);
      }
    };
    fetchCivilite();
  }, [id, index]);

  const handleSave = async () => {
    setLoading(true);
    try {
      const ref = doc(db, "demandes", id);
      const snap = await getDoc(ref);
      const data = snap.data();
      const personnes = [...(data.personnes || [])];
      personnes[index] = { ...personnes[index], civilite };
      await updateDoc(ref, { personnes });
      navigate(`/informations/${index}/${id}`);
    } catch (error) {
      console.error("Erreur lors de la mise à jour de la civilité :", error);
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


<h1 className="text-2xl font-bold mb-2">Civilité</h1>
<p className="text-sm text-gray-500 mb-6">
  Merci de sélectionner la civilité correspondant à votre pièce d’identité officielle
</p>

<SelecteurCreditX
  label="Civilité"
  value={civilite || null}
  onChange={setCivilite}
  options={options}
  placeholder="Sélectionner une civilité"
  required
  searchable={false}
/>

<br></br>

<button
  onClick={handleSave}
  disabled={!civilite || loading}
  className={`w-full rounded-full py-3 text-center text-sm font-medium transition ${
    civilite ? "bg-black text-white hover:bg-gray-900" : "bg-gray-200 text-gray-400 cursor-not-allowed"
  }`}
>
  {loading ? "Enregistrement..." : "Continuer"}
</button>

      </div>
    </div>
  );
}
