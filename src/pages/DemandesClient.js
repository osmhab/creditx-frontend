import React, { useEffect, useState } from "react";
import { useNavigate } from 'react-router-dom';
import { collection, deleteDoc, doc, onSnapshot, orderBy, query, where } from "firebase/firestore";
import { db } from "../firebase-config";
import { useAuth } from "../AuthContext";
import DeleteIcon from "@mui/icons-material/Delete";
import dayjs from "dayjs";
import "dayjs/locale/fr";
dayjs.locale("fr");

const DemandesClient = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [demandes, setDemandes] = useState([]);

  useEffect(() => {
    if (!user || !user.uid) return;
    const q = query(
      collection(db, "demandes"),
      where("uid", "==", user.uid),
      orderBy("dateCreation", "desc")
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setDemandes(data);
    });
    return () => unsubscribe();
  }, [user]);

  const supprimerDemande = async (demandeId) => {
    if (window.confirm("Souhaitez-vous vraiment supprimer cette demande ?")) {
      try {
        await deleteDoc(doc(db, "demandes", demandeId));
        console.log("Demande supprimée :", demandeId);
      } catch (error) {
        console.error("Erreur lors de la suppression :", error);
      }
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return "";
    const date = dayjs(dateStr.toDate());
    return date.format("[Modifiée le] D MMMM [à] HH[h]mm");
  };

  return (
    <div className="min-h-screen bg-[#F4F4F4] px-4 py-10">
      <div className="max-w-4xl mx-auto">
      <div
  className="flex items-center gap-3 mb-6 cursor-pointer hover:underline"
  onClick={() => navigate("/dashboard")}
>
  <svg
    xmlns="http://www.w3.org/2000/svg"
    className="h-5 w-5 text-gray-700"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
  >
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
  </svg>
  <span className="text-sm text-gray-700 font-medium">Retour</span>
</div>

        <h1 className="text-3xl font-bold mb-6">Demandes de crédit</h1>

        {demandes.map((demande) => (
          <div
            key={demande.id}
            className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-[#F8F8F8] rounded-2xl px-6 py-4 mb-4 cursor-pointer hover:bg-[#f0f0f0] transition"
          >
            <div
              className="flex-1 w-full"
              onClick={() => navigate(`/dashboard-client/${demande.id}`)}
            >
              <p className="font-semibold text-[15px] leading-tight">
                {demande.nom || "Sans nom"}
              </p>

              {demande.envoyee ? (
                <>
                  <p className="text-gray-500 text-sm mt-[2px]">Demande archivée</p>
                  {demande.derniereModification && (
                    <p className="text-gray-400 text-sm mt-1">
                      {dayjs(demande.derniereModification.toDate()).format("DD.MM.YYYY")}
                    </p>
                  )}
                </>
              ) : (
                <>
                  <p className="text-gray-400 text-sm mt-[2px]">
                    {formatDate(demande.derniereModification)}
                  </p>
                  <p className="text-[#FF5A00] text-sm mt-1">Action requise</p>
                </>
              )}
            </div>

            {!demande.envoyee && (
              <button
                onClick={() => supprimerDemande(demande.id)}
                className="text-red-500 hover:text-red-600 mt-3 sm:mt-0 sm:ml-4"
                title="Supprimer la demande"
              >
                <DeleteIcon />
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default DemandesClient;
