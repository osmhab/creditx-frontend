import React, { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { db } from "../../firebase-config";
import PersonIcon from "@mui/icons-material/Person";
import DeleteOutlineOutlinedIcon from "@mui/icons-material/DeleteOutlineOutlined";
import ModalMessage from "../../components/ModalMessage";

const MAX_PERSONNES = 2;

export default function DonneesPersonnelles() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const id = searchParams.get("id");

  const [donnees, setDonnees] = useState(null);
  const [loading, setLoading] = useState(true);

  const [modalConfirm, setModalConfirm] = useState(false);
  const [indexToDelete, setIndexToDelete] = useState(null);

  const fetchData = async () => {
    const ref = doc(db, "demandes", id);
    const snap = await getDoc(ref);
    if (snap.exists()) {
      setDonnees(snap.data());
    } else {
      setDonnees({});
    }
    setLoading(false);
  };

  useEffect(() => {
    if (id) fetchData();
  }, [id]);

  const handleAjouterPersonne = async () => {
    const ref = doc(db, "demandes", id);
    const nouvellesPersonnes = donnees?.personnes || [];

    if (nouvellesPersonnes.length >= MAX_PERSONNES) return;

    const role = nouvellesPersonnes.length === 0 ? "principal" : "secondaire";

    nouvellesPersonnes.push({
      prenom: "",
      nom: "",
      etatCivil: "",
      nationalite: "",
      employeurs: [],
      role,
    });

    await updateDoc(ref, {
      personnes: nouvellesPersonnes,
    });

    fetchData();
    navigate(`/informations/${nouvellesPersonnes.length - 1}/${id}`);
  };

  const confirmerSuppression = (index) => {
    setIndexToDelete(index);
    setModalConfirm(true);
  };

  const handleSupprimerPersonne = async () => {
    if (indexToDelete === null) return;

    const ref = doc(db, "demandes", id);
    const nouvellesPersonnes = [...(donnees?.personnes || [])];
    nouvellesPersonnes.splice(indexToDelete, 1);

    await updateDoc(ref, {
      personnes: nouvellesPersonnes,
    });

    setModalConfirm(false);
    setIndexToDelete(null);
    fetchData();
  };

  const getInitials = (prenom, nom) => {
    return ((prenom?.charAt(0) || "") + (nom?.charAt(0) || "")).toUpperCase();
  };

  if (loading) return <div className="p-6">Chargement...</div>;

  const personnes = donnees?.personnes || [];

  return (
    <div className="min-h-screen bg-white flex justify-center px-4 pt-6">
      <div className="w-full max-w-md">
        <button
          onClick={() => navigate("/dashboard")}
          className="text-2xl lg:text-xl mb-4"
        >
          ←
        </button>

        <h1 className="text-2xl lg:text-xl font-bold mb-6">Données personnelles</h1>

        <div className="bg-[#F9F9F9] rounded-xl divide-y">
          {personnes.length > 0 &&
            personnes.map((personne, index) => {
              const manqueRelation =
                personne.role === "secondaire" &&
                !personne.relationAvecDemandeurPrincipal;

              return (
                <div
                  key={index}
                  className="flex items-center justify-between p-4 group"
                >
                  <div
                    onClick={() => navigate(`/informations/${index}/${id}`)}
                    className="flex items-center gap-4 cursor-pointer"
                  >
                    <div className="w-10 h-10 bg-blue-600 text-white font-bold flex items-center justify-center rounded-full">
                      {getInitials(personne.prenom, personne.nom)}
                    </div>
                    <div>
                      <p className="font-medium text-base lg:text-sm">
                        {personne.prenom || (
                          <span className="text-[#FF5C02]">Prénom non renseigné</span>
                        )}{" "}
                        {personne.nom || (
                          <span className="text-[#FF5C02]">Nom non renseigné</span>
                        )}
                      </p>
                      <p className="text-sm lg:text-xs text-gray-500">
                        {index === 0 ? "Demandeur principal" : "Demandeur 2"}
                      </p>
                      {manqueRelation && (
                        <p className="text-sm lg:text-xs text-[#FF5C02]">
                          Lien non renseigné
                        </p>
                      )}
                    </div>
                  </div>

                  {personne.role === "secondaire" && (
                    <button
                      onClick={() => confirmerSuppression(index)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <DeleteOutlineOutlinedIcon fontSize="small" />
                    </button>
                  )}
                </div>
              );
            })}

          {personnes.length < MAX_PERSONNES && (
            <div
              onClick={handleAjouterPersonne}
              className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-100"
            >
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-gray-200 text-gray-600 flex items-center justify-center rounded-full">
                  <PersonIcon fontSize="small" />
                </div>
                <div>
                  <p className="font-medium text-base lg:text-sm">
                    {personnes.length === 0
                      ? "Ajouter une première personne"
                      : "Ajouter une autre personne"}
                  </p>
                </div>
              </div>
              <span className="text-gray-400">➔</span>
            </div>
          )}
        </div>

        <ModalMessage
          open={modalConfirm}
          onClose={() => setModalConfirm(false)}
          onConfirm={handleSupprimerPersonne}
          title="Supprimer cette personne ?"
          message={`Êtes-vous sûr de vouloir supprimer ${
            donnees?.personnes?.[indexToDelete]?.prenom || ""
          } ${donnees?.personnes?.[indexToDelete]?.nom || ""} ? Cette action est irréversible.`}
          confirmText="Supprimer"
          cancelText="Annuler"
        />
      </div>
    </div>
  );
}
