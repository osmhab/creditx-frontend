import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../AuthContext";
import { db } from "../firebase-config";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";

export default function NouvelleDemande() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [nom, setNom] = useState("Nouvelle demande");

  const handleCreate = async () => {
    try {
      await addDoc(collection(db, "demandes"), {
        uid: user.uid,
        email: user.email,
        nom,
        dateCreation: serverTimestamp(),
        envoyee:false,
        etatBien: null,
        etatInfos: null,
        etatIdentite: null,
        etatDocuments: null,
        etatResume: null,
        typeDemande: null,
      });
      navigate("/dashboard");
    } catch (error) {
      console.error("Erreur lors de la création de la demande:", error);
      alert("Échec de la création : " + error.message);
    }
  };

  

  return (
    <div className="min-h-screen bg-gray-50 px-6 py-12 flex flex-col items-center">
      <div className="w-full max-w-md">
        <button onClick={() => navigate(-1)} className="mb-8 text-black">
          <ArrowBackIcon />
        </button>

        <div className="space-y-6">
          <h1 className="text-2xl font-bold">Nouvelle demande</h1>
          <p className="text-sm text-gray-600">
            Veuillez nommer votre nouvelle demande
          </p>
          <input
            type="text"
            value={nom}
            onChange={(e) => setNom(e.target.value)}
            className="w-full bg-gray-100 rounded-xl px-4 py-3 text-sm"
          />
        </div>
      </div>

      <div className="w-full max-w-md mt-12">
        <button
          onClick={handleCreate}
          className="w-full bg-black text-white py-3 rounded-full text-sm"
        >
          Créer
        </button>
      </div>
    </div>
  );
}
