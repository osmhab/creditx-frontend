import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { db } from "../../firebase-config";
import SelecteurCreditX from "../../components/SelecteurCreditX";



const paysPrioritaires = ["Suisse", "France", "Allemagne", "Italie", "Autriche", "Liechtenstein"];

const toutesLesNationalites = [
  "Afghanistan", "Afrique du Sud", "Albanie", "Algérie", "Allemagne", "Andorre", "Angola", "Arabie Saoudite", "Argentine", "Arménie",
  "Australie", "Autriche", "Azerbaïdjan", "Bahamas", "Bahreïn", "Bangladesh", "Belgique", "Bénin", "Bhoutan", "Biélorussie",
  "Bolivie", "Bosnie-Herzégovine", "Botswana", "Brésil", "Brunei", "Bulgarie", "Burkina Faso", "Burundi", "Cambodge", "Cameroun",
  "Canada", "Cap-Vert", "Chili", "Chine", "Chypre", "Colombie", "Comores", "Congo", "Corée du Nord", "Corée du Sud", "Costa Rica",
  "Côte d’Ivoire", "Croatie", "Cuba", "Danemark", "Djibouti", "Dominique", "Égypte", "Émirats arabes unis", "Équateur", "Érythrée",
  "Espagne", "Estonie", "Eswatini", "États-Unis", "Éthiopie", "Fidji", "Finlande", "France", "Gabon", "Gambie", "Géorgie", "Ghana",
  "Grèce", "Guatemala", "Guinée", "Guinée-Bissau", "Guinée équatoriale", "Guyana", "Haïti", "Honduras", "Hongrie", "Inde", "Indonésie",
  "Irak", "Iran", "Irlande", "Islande", "Israël", "Italie", "Jamaïque", "Japon", "Jordanie", "Kazakhstan", "Kenya", "Kirghizistan",
  "Kiribati", "Koweït", "Laos", "Lesotho", "Lettonie", "Liban", "Libéria", "Libye", "Liechtenstein", "Lituanie", "Luxembourg", "Macédoine",
  "Madagascar", "Malaisie", "Malawi", "Maldives", "Mali", "Malte", "Maroc", "Marshall", "Maurice", "Mauritanie", "Mexique", "Micronésie",
  "Moldavie", "Monaco", "Mongolie", "Monténégro", "Mozambique", "Namibie", "Nauru", "Népal", "Nicaragua", "Niger", "Nigeria", "Norvège",
  "Nouvelle-Zélande", "Oman", "Ouganda", "Ouzbékistan", "Pakistan", "Palaos", "Palestine", "Panama", "Papouasie-Nouvelle-Guinée",
  "Paraguay", "Pays-Bas", "Pérou", "Philippines", "Pologne", "Portugal", "Qatar", "République centrafricaine", "République dominicaine",
  "République tchèque", "Roumanie", "Royaume-Uni", "Russie", "Rwanda", "Saint-Kitts-et-Nevis", "Saint-Marin", "Saint-Vincent-et-les-Grenadines",
  "Sainte-Lucie", "Salomon", "Salvador", "Samoa", "Sénégal", "Serbie", "Seychelles", "Sierra Leone", "Singapour", "Slovaquie", "Slovénie",
  "Somalie", "Soudan", "Soudan du Sud", "Sri Lanka", "Suède", "Suisse", "Suriname", "Syrie", "Tadjikistan", "Tanzanie", "Tchad", "Thaïlande",
  "Timor oriental", "Togo", "Tonga", "Trinité-et-Tobago", "Tunisie", "Turkménistan", "Turquie", "Tuvalu", "Ukraine", "Uruguay", "Vanuatu",
  "Vatican", "Venezuela", "Viêt Nam", "Yémen", "Zambie", "Zimbabwe"
];

const nationalitesTriees = [...new Set([...paysPrioritaires, ...toutesLesNationalites.sort()])];

export default function InformationsNationalite() {
  const navigate = useNavigate();
  const { personneId, id } = useParams();
  const index = parseInt(personneId);

  const [nationalite, setNationalite] = useState("");
  const [autorisationSejour, setAutorisationSejour] = useState("");
  const [loading, setLoading] = useState(false);

  const estSuisse = nationalite === "Suisse";

  useEffect(() => {
    const fetch = async () => {
      const snap = await getDoc(doc(db, "demandes", id));
      if (snap.exists()) {
        const data = snap.data();
        const personne = data.personnes?.[index];
        if (personne?.nationalite) setNationalite(personne.nationalite);
        if (personne?.autorisationSejour) setAutorisationSejour(personne.autorisationSejour);
      }
    };
    fetch();
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
        nationalite,
        autorisationSejour: estSuisse ? null : autorisationSejour,
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

        <h1 className="text-2xl font-bold mb-2">Nationalité</h1>
        <p className="text-sm text-gray-500 mb-6">
          Veuillez sélectionner votre nationalité actuelle
        </p>

        <SelecteurCreditX
  label="Nationalité"
  value={nationalite || null}
  onChange={(v) => setNationalite(v)}
  options={nationalitesTriees}
  priority={["Suisse","France","Allemagne","Italie","Autriche","Liechtenstein"]}
  placeholder="Sélectionner une nationalité"
  required
/>

<br></br>


        {!estSuisse && nationalite && (
          <div className="mb-8">
            <p className="text-sm text-gray-600 mb-2">
              Quelle est votre autorisation de séjour ?
            </p>
            <div className="flex gap-3">
              {["B", "C"].map((type) => (
                <button
                  key={type}
                  onClick={() => setAutorisationSejour(type)}
                  className={`px-4 py-2 rounded-full border text-sm font-medium transition ${
                    autorisationSejour === type
                      ? "bg-black text-white"
                      : "bg-white text-black border-gray-300 hover:bg-gray-50"
                  }`}
                >
                  Permis {type}
                </button>
              ))}
            </div>
          </div>
        )}

        <button
          onClick={handleSave}
          disabled={
            !nationalite || (!estSuisse && !autorisationSejour) || loading
          }
          className={`w-full rounded-full py-3 text-center text-sm font-medium transition ${
            nationalite && (estSuisse || autorisationSejour)
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
