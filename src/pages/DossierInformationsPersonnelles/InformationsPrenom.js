import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function InformationsPrenom() {
  const navigate = useNavigate();
  const [prenom, setPrenom] = useState("Habib");

  return (
    <div className="min-h-screen bg-[#FCFCFC] flex justify-center px-4 pt-6">
      <div className="w-full max-w-md">
        <button onClick={() => navigate(-1)} className="mb-4">
          <span className="text-xl">←</span>
        </button>

        <h1 className="text-2xl font-bold mb-2">Prénom</h1>
        <p className="text-sm text-gray-500 mb-6">
          Veuillez inscrire votre prénom tel que mentionné sur votre carte d’identité officielle
        </p>

        <input
          type="text"
          placeholder="Prénom"
          value={prenom}
          onChange={(e) => setPrenom(e.target.value)}
          className="w-full p-4 bg-gray-100 rounded-xl mb-8 text-sm"
        />

        <button
          onClick={() => navigate("/informations")}
          className="w-full bg-black text-white rounded-full py-3 text-center font-medium text-sm hover:bg-gray-900"
        >
          Continuer
        </button>
      </div>
    </div>
  );
}