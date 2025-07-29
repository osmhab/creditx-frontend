import React from "react";
import { useNavigate } from "react-router-dom";

export default function InformationsPersonnelles() {
  const navigate = useNavigate();

  const champs = [
    { label: "Civilité", chemin: "civilite" },
    { label: "Prénom", chemin: "prenom" },
    { label: "Nom de famille", chemin: "nom" },
    { label: "Date de naissance", chemin: "naissance" },
    { label: "Etat civil", chemin: "etat-civil" },
    { label: "Adresse complète", chemin: "adresse" },
    { label: "Degré de formation achevé", chemin: "formation" },
    { label: "Enfant(s) à charge", chemin: "enfants" }
  ];

  return (
    <div className="min-h-screen bg-[#FCFCFC] flex justify-center px-4 pt-6">
      <div className="w-full max-w-md">
        <button onClick={() => navigate("/dashboard")} className="mb-4">
          <span className="text-xl">←</span>
        </button>

        <h1 className="text-2xl font-bold mb-1">Nouveau demandeur</h1>
        <p className="text-sm text-gray-500 mb-6">
          Demandeur principal et administrateur
        </p>

        <h2 className="text-sm font-medium mb-3">Informations personnelles</h2>

        <div className="bg-white rounded-2xl p-4">
          <ul>
            {champs.map((champ) => (
              <li
                key={champ.label}
                className="py-3 cursor-pointer hover:bg-gray-50 rounded-xl px-2 -mx-2 transition"
                onClick={() => navigate(`/informations/${champ.chemin}`)}
              >
                <p className="text-[15px] font-medium leading-tight">
                  {champ.label}
                </p>
                <p className="text-xs text-gray-400 mt-1">Non renseigné</p>
              </li>
            ))}
          </ul>
        </div>

        <p className="text-sm text-gray-400 mt-6">Employeur·s</p>
        <div
          onClick={() => navigate("/ajouter-employeur")}
          className="flex justify-between items-center mt-2 px-4 py-3 bg-white rounded-xl cursor-pointer border border-gray-200"
        >
          <span className="flex items-center gap-2 text-sm font-medium">
            <span className="text-lg">📄</span> Ajouter
          </span>
          <span className="text-gray-400">➔</span>
        </div>
      </div>
    </div>
  );
}