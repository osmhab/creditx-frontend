import React, { useEffect, useState, useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { db } from "../../firebase-config";
import BusinessOutlinedIcon from "@mui/icons-material/BusinessOutlined";
import DeleteOutlineOutlinedIcon from "@mui/icons-material/DeleteOutlineOutlined";
import ModalMessage from "../../components/ModalMessage";
import AssignmentTurnedInOutlinedIcon from "@mui/icons-material/AssignmentTurnedInOutlined";
import { computeEtatPersonne, computeEtatGlobal } from "../../utils/etatInfos";



const computeEtatInfosFromEmpList = (employeurs = []) => {
  if (!Array.isArray(employeurs) || employeurs.length === 0) return "Action requise";
  if (employeurs.some((e) => e?.bloquant === true)) return "Critère bloquant";
  const allComplete = employeurs.every((e) => e?.complet === true && e?.bloquant !== true);
  return allComplete ? "Terminé" : "Action requise";
};


export default function InformationsPersonnelles() {
  const navigate = useNavigate();
  const { personneId, id } = useParams();
  const index = parseInt(personneId, 10);
  const [personne, setPersonne] = useState(null);
  const [loading, setLoading] = useState(true);
  const [modalConfirmEmp, setModalConfirmEmp] = useState(false);
  const [empIndexToDelete, setEmpIndexToDelete] = useState(null);


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

  const confirmerSuppressionEmployeur = (index) => {
  setEmpIndexToDelete(index);
  setModalConfirmEmp(true);
};

const handleSupprimerEmployeur = async () => {
  if (empIndexToDelete === null) return;

  const ref = doc(db, "demandes", id);
  const snap = await getDoc(ref);
  if (!snap.exists()) {
    setModalConfirmEmp(false);
    setEmpIndexToDelete(null);
    return;
  }

  const data = snap.data();
  const personnes = Array.isArray(data.personnes) ? [...data.personnes] : [];
  const p = personnes[index] || {};
  const employeurs = Array.isArray(p.employeurs) ? [...p.employeurs] : [];

  // suppression dans la liste locale
  employeurs.splice(empIndexToDelete, 1);

  // recompose la personne courante avec sa nouvelle liste d'employeurs
  const personneMaj = { ...p, employeurs };

  // calcule l'état de CETTE personne puis l'écrit dessus
  const etatPersonne = computeEtatPersonne(personneMaj);
  personnes[index] = { ...personneMaj, etatInfos: etatPersonne };

  // calcule l'état GLOBAL du dossier (toutes les personnes)
  const etatGlobal = computeEtatGlobal(personnes);

  // persist: personnes + etatInfos global
  await updateDoc(ref, { personnes, etatInfos: etatGlobal });

  // UI local
  setPersonne(personnes[index] || null);
  setModalConfirmEmp(false);
  setEmpIndexToDelete(null);
};







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
  const disabled = !path;

  return (
    <div
      onClick={() => !disabled && navigate(path)}
      className={`flex justify-between items-center px-4 py-3 ${
        disabled ? "cursor-not-allowed" : "hover:bg-gray-50 cursor-pointer"
      }`}
    >
      <div>
        {/* libellé toujours noir */}
        <p className="text-base lg:text-sm text-black">{label}</p>

        {/* valeur : grise si disabled */}
        <p
          className={`text-base lg:text-sm ${
            isEmpty
              ? "text-[#FF5C02]"
              : disabled
              ? "text-gray-400"
              : "text-gray-800"
          }`}
        >
          {isEmpty ? "Non renseigné" : value}
        </p>
      </div>

      {!disabled && <div className="text-gray-300">›</div>}
    </div>
  );
};






  if (loading || !personne) return <div className="p-6 text-base lg:text-sm">Chargement...</div>;

  const titre =
    personne.prenom && personne.nom
      ? `${personne.prenom} ${personne.nom}`
      : "Nouveau demandeur";

  const sousTitre =
    personne.role === "secondaire"
      ? "Demandeur 2"
      : "Demandeur principal et administrateur";

  const isConjointMariage =
  personne?.relationAvecDemandeurPrincipal === "Conjoint-e (mariage)";


  return (
    <div className="min-h-screen bg-[#FCFCFC] flex justify-center px-4 pt-6">
      <div className="w-full max-w-md">
        <button
          onClick={() => navigate(`/informations-personnelles?id=${id}`)}
          className="text-2xl lg:text-xl mb-6"
        >
          ←
        </button>

        <h1 className="text-2xl lg:text-xl font-bold">{titre}</h1>
        <p className="text-base lg:text-sm text-gray-500 mb-6">{sousTitre}</p>

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
          {renderLigne(
            "État civil",
            "etatCivil",
            null,
            isConjointMariage ? null : `/informations/${index}/${id}/etat-civil`
          )}

          {/* Nouvelle ligne Nationalité */}
          {renderLigne("Nationalité", "nationalite", null, `/informations/${index}/${id}/nationalite`)}

          {/* Adresse complète (objet ou string rétrocompat) */}
          {renderLigne(
            "Adresse complète",
            "adresse",
            personne?.adresse ?? personne?.adresseFormatted,
            isConjointMariage ? null : `/informations/${index}/${id}/adresse`
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

{/* Bloc Crédits & engagements */}
<h2 className="text-base lg:text-sm text-gray-500 mt-8 mb-2">Crédits & engagements</h2>

<div
  onClick={() => navigate(`/informations/${index}/${id}/credits`)}
  className="bg-white rounded-2xl px-4 py-3 flex items-center justify-between cursor-pointer hover:bg-gray-50"
>
  <div className="flex items-center gap-3">
    <div className="w-8 h-8 rounded-full bg-[#EEF2FF] flex items-center justify-center">
      <AssignmentTurnedInOutlinedIcon fontSize="small" className="text-creditxblue" />
    </div>
    <div>
      <div className="text-base lg:text-sm font-medium">Ouvrir le questionnaire</div>
      {/* Etat de la section charges */}
      {(() => {
        const ch = personne?.charges;
        const etat = ch?.bloquant ? "Critère bloquant" : ch?.complet ? "Terminé" : "Action requise";
        const color = etat === "Terminé" ? "#00B050" : "#FF5C02";
        return <div className="text-sm" style={{ color }}>{etat}</div>;
      })()}
    </div>
  </div>
</div>



{/* Bloc Employeurs */}
<h2 className="text-base lg:text-sm text-gray-500 mt-8 mb-2">Employeur·s</h2>

<div className="space-y-3 mb-10">


  {/* Ajouter — toujours visible */}
<div
  onClick={() => navigate(`/informations/${index}/${id}/employeurs/nouveau`)}
  className="bg-white rounded-2xl px-4 py-3 flex items-center justify-between cursor-pointer hover:bg-gray-50"
>
  <div className="flex items-center gap-3">
    <div className="w-8 h-8 rounded-full bg-[#EEF2FF] flex items-center justify-center">
      <BusinessOutlinedIcon fontSize="small" className="text-blue-600" />
    </div>
    <div>
      <div className="text-base lg:text-sm font-medium">Ajouter</div>
      {(!Array.isArray(personne?.employeurs) || personne.employeurs.length === 0) && (
        <div className="text-sm text-[#FF5C02]">Action requise</div>
      )}
    </div>
  </div>
  <div className="text-gray-300">›</div>
</div>


  {/* Liste des employeurs existants */}
  {Array.isArray(personne?.employeurs) &&
    personne.employeurs.map((emp, i) => {
      const nom = emp?.nom || emp?.raisonSociale || "Employeur sans nom";

      // Libellé de statut propre
      const statutAffiche =
        emp?.statutAffichage ||
        (emp?.statutEntreprise === "independant"
          ? "Indépendant"
          : emp?.statutEntreprise === "salarie"
          ? "Salarié"
          : "—");

       // État granulaire par employeur
      const etatEmp = emp?.bloquant
        ? "Critère bloquant"
        : emp?.complet
        ? "Terminé"
        : "Action requise";
      const etatColor = etatEmp === "Terminé" ? "#00B050" : "#FF5C02";

      return (
        <div
          key={i}
          className="bg-white rounded-2xl px-4 py-3 flex items-center justify-between hover:bg-gray-50"
        >
          {/* Zone cliquable (ouvre l’édition) */}
          <div
            onClick={() => navigate(`/informations/${index}/${id}/employeurs/${i}`)}
            className="flex items-center gap-3 cursor-pointer flex-1 min-w-0"
          >
            <div className="w-8 h-8 rounded-full bg-creditxblue flex items-center justify-center">
              <BusinessOutlinedIcon fontSize="small" className="text-white" />
            </div>
            <div className="min-w-0">
              <div className="text-base lg:text-sm font-medium truncate">
                {nom}
              </div>
              <div className="text-sm text-gray-500">{statutAffiche}</div>
              <div className="text-sm" style={{ color: etatColor }}>{etatEmp}</div>
            </div>
          </div>

          {/* Actions (chevron + poubelle) */}
          <div className="flex items-center gap-2 pl-3">
            <button
              onClick={(e) => {
                e.stopPropagation(); // n’ouvre pas l’édition
                confirmerSuppressionEmployeur(i);
              }}
              className="text-red-500 hover:text-red-700"
              title="Supprimer cet employeur"
              type="button"
            >
              <DeleteOutlineOutlinedIcon fontSize="small" />
            </button>
          </div>
        </div>
      );
    })}
</div>

{/* Modale de confirmation de suppression — en dehors de la boucle */}
<ModalMessage
  open={modalConfirmEmp}
  onClose={() => setModalConfirmEmp(false)}
  onConfirm={handleSupprimerEmployeur}
  title="Supprimer cet employeur ?"
  message={`Cette action est irréversible. Voulez-vous vraiment supprimer cet employeur ?`}
  confirmText="Supprimer"
  cancelText="Annuler"
/>

      </div>
    </div>
  );
}

