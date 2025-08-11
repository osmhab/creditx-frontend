import React, { useEffect, useState, useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../../firebase-config";
import BusinessOutlinedIcon from "@mui/icons-material/BusinessOutlined";

export default function InformationsPersonnelles() {
  const navigate = useNavigate();
  const { personneId, id } = useParams();
  const index = parseInt(personneId, 10);
  const [personne, setPersonne] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPersonne = async () => {
      const ref = doc(db, "demandes", id);
      const snap = await getDoc(ref);
      if (snap.exists()) {
        const data = snap.data();
        const personneData = data.personnes?.[index];
        setPersonne(personneData || null);
      }
      setLoading(false);
    };
    fetchPersonne();
  }, [index, id]);

  // Formatter générique, gère string / number / bool / array / objet adresse
  const formatValue = (val) => {
    if (val === null || val === undefined) return null;
    if (typeof val === "string") return val;
    if (typeof val === "number" || typeof val === "boolean") return String(val);
    if (Array.isArray(val)) return val.length ? val.join(", ") : null;
    if (typeof val === "object") {
      // cas fréquent : adresse sous forme d'objet
      const { formatted, route, streetNumber, postalCode, locality } = val;
      const line1 = route && streetNumber ? `${streetNumber} ${route}` : route;
      const line2 = [postalCode, locality].filter(Boolean).join(" ");
      const txt = formatted || [line1, line2].filter(Boolean).join(", ");
      return txt || null;
    }
    return null;
  };

  const renderLigne = (label, field, customValue, path) => {
    const raw = customValue ?? personne?.[field];
    const value = formatValue(raw);
    const isEmpty = !value;
    return (
      <div
        onClick={() => navigate(path)}
        className="flex justify-between items-center px-4 py-3 hover:bg-gray-50 cursor-pointer"
      >
        <div>
          <p className="text-sm text-black">{label}</p>
          <p className={`text-sm ${isEmpty ? "text-[#FF5C02]" : "text-gray-800"}`}>
            {isEmpty ? "Non renseigné" : value}
          </p>
        </div>
        <div className="text-gray-300">›</div>
      </div>
    );
  };

  if (loading || !personne) return <div className="p-6">Chargement...</div>;

  const titre =
    personne.prenom && personne.nom
      ? `${personne.prenom} ${personne.nom}`
      : "Nouveau demandeur";

  const sousTitre =
    personne.role === "secondaire"
      ? "Demandeur 2"
      : "Demandeur principal et administrateur";

  return (
    <div className="min-h-screen bg-[#FCFCFC] flex justify-center px-4 pt-6">
      <div className="w-full max-w-md">
        <button
          onClick={() => navigate(`/informations-personnelles?id=${id}`)}
          className="text-xl mb-6"
        >
          ←
        </button>

        <h1 className="text-2xl font-bold">{titre}</h1>
        <p className="text-sm text-gray-500 mb-6">{sousTitre}</p>

        <div className="bg-white rounded-xl divide-y">
          {personne.role === "secondaire" &&
            renderLigne(
              "Lien avec Habib Osmani",
              "relationAvecDemandeurPrincipal",
              null,
              `/informations/${index}/${id}/relation`
            )}

          {renderLigne("Civilité", "civilite", null, `/informations/${index}/${id}/civilite`)}
          {renderLigne("Prénom", "prenom", null, `/informations/${index}/${id}/prenom`)}
          {renderLigne("Nom de famille", "nom", null, `/informations/${index}/${id}/nom`)}
          {renderLigne("Date de naissance", "dateNaissance", null, `/informations/${index}/${id}/naissance`)}
          {renderLigne("État civil", "etatCivil", null, `/informations/${index}/${id}/etat-civil`)}

          {/* Nouvelle ligne Nationalité */}
          {renderLigne("Nationalité", "nationalite", null, `/informations/${index}/${id}/nationalite`)}

          {/* Adresse complète (objet ou string rétrocompat) */}
          {renderLigne(
            "Adresse complète",
            "adresse",
            // on tente d'abord objet adresse, sinon string legacy `adresseFormatted`
            personne?.adresse ?? personne?.adresseFormatted,
            `/informations/${index}/${id}/adresse`
          )}

          {renderLigne("Degré de formation achevé", "formation", null, `/informations/${index}/${id}/formation`)}

          {/* Enfants à charge */}
          {renderLigne(
            "Enfant(s) à charge",
            "enfantsACharge",
            personne?.enfantsACharge === true
              ? "Oui"
              : personne?.enfantsACharge === false
              ? "Non"
              : null,
            `/informations/${index}/${id}/enfants`
          )}
        </div>

        {/* Bloc Employeurs */}
        <h2 className="text-sm text-gray-500 mt-8 mb-2">Employeur·s</h2>
        <div
          onClick={() => navigate(`/informations/${index}/${id}/employeurs`)}
          className="bg-white rounded-xl px-4 py-3 flex items-center justify-between cursor-pointer hover:bg-gray-50"
        >
          <div className="flex items-center gap-3">
            <div className="w-6 h-6 bg-[#EEF2FF] text-blue-600 rounded-full flex items-center justify-center">
              <BusinessOutlinedIcon fontSize="small" />
            </div>
            <span className="text-sm font-medium">Ajouter</span>
          </div>
          <div className="text-gray-300">›</div>
        </div>
      </div>
    </div>
  );
}
