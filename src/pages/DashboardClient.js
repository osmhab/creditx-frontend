import React, { useEffect, useState } from "react";
import { useAuth } from "../AuthContext";
import { useNavigate, useLocation } from "react-router-dom";
import {
  collection,
  query,
  where,
  onSnapshot,
  orderBy,
  doc,
  deleteDoc,
} from "firebase/firestore";
import { db } from "../firebase-config";
import LogoBlack from "../assets/logo-creditx-black.svg";
import LogoBlue from "../assets/logo-creditx-x-blue.svg";
import HomeIcon from "@mui/icons-material/Home";
import DescriptionIcon from "@mui/icons-material/Description";
import MenuIcon from "@mui/icons-material/Menu";
import CloseIcon from "@mui/icons-material/Close";
import ArrowForwardIosIcon from "@mui/icons-material/ArrowForwardIos";
import HelpIcon from "@mui/icons-material/Help";
import NotificationsIcon from "@mui/icons-material/Notifications";
import LogoutIcon from "@mui/icons-material/Logout";
import ModalMessage from "../components/ModalMessage";

export default function DashboardClient() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [demandes, setDemandes] = useState([]);
  const [menuOpen, setMenuOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [ongletActif, setOngletActif] = useState("accueil");
  const [modalInfo, setModalInfo] = useState({
    open: false,
    message: "",
  });

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

  const getInitial = (email) => email?.charAt(0)?.toUpperCase() || "?";

  const getStatutClass = (value) => {
    const val = (value || "").toLowerCase();
    if (val === "vérifié") return "text-[#00B050]";
    if (val === "action requise") return "text-[#FF5A00]";
    if (val === "envoyé") return "text-black";
    return "text-[#999999]";
  };

  const demandeEnCours = demandes.find(
    (d) => !d.statutGlobal || d.statutGlobal !== "finalisée"
  );

  const supprimerDemande = async (id) => {
    const confirm = window.confirm("Souhaitez-vous vraiment supprimer cette demande ?");
    if (!confirm) return;

    try {
      await deleteDoc(doc(db, "demandes", id));
      setDemandes((prev) => prev.filter((d) => d.id !== id));
    } catch (error) {
      console.error("Erreur lors de la suppression :", error);
    }
  };

  if (!user || !user.uid) {
    return (
      <div className="flex justify-center items-center h-screen text-gray-500 text-2xl lg:text-base">
        Chargement...
      </div>
    );
  }

  const getStatutLabel = (statut) => {
    if (statut === "Complété") return "Complété";
    if (statut === "Non défini") return "À compléter";
    return statut;
  };

  const getStatutAffichage = (key, value) => {
  const v = (value || "").toString();

  // Cas "Demande" (typeDemande) : on affiche sa valeur telle quelle ou "Action requise"
  if (key === "typeDemande") {
    if (!v || v === "Non défini") {
      return { label: "Action requise", color: "#FF5C02", icon: null, fontWeight: "font-semibold" };
    }
    return { label: v, color: "#000000", icon: null, fontWeight: "font-semibold" };
  }

  // États normalisés
  if (v === "Critère bloquant") {
    return { label: "Critère bloquant", color: "#FF5C02", icon: null, fontWeight: "font-semibold" };
  }
  if (v === "Terminé" || v === "Complété") {
    return { label: "Terminé", color: "#00B050", icon: null, fontWeight: "font-semibold" };
  }

  // Par défaut / Non défini
  return { label: "Action requise", color: "#FF5C02", icon: null, fontWeight: "font-semibold" };
};




  return (
    <div className="flex flex-col lg:flex-row min-h-screen bg-[#F7F7F7] relative">
      {/* Sidebar desktop */}
      <aside className="hidden lg:block w-64 px-6 pt-10">
        <img
          src={LogoBlack}
          alt="CreditX"
          className="w-28 mb-10 cursor-pointer"
          onClick={() => setOngletActif("accueil")}
        />
        <nav className="space-y-2">
          <div
            onClick={() => setOngletActif("accueil")}
            className={`flex items-center gap-3 px-3 py-2 rounded-lg cursor-pointer transition ${
              ongletActif === "accueil"
                ? "bg-blue-100 text-blue-700 font-semibold"
                : "text-gray-600 hover:bg-gray-100"
            }`}
          >
            <HomeIcon fontSize="small" />
            <span className="text-sm">Accueil</span>
          </div>
          <div
            onClick={() => setOngletActif("demandes")}
            className={`flex items-center gap-3 px-3 py-2 rounded-lg cursor-pointer transition ${
              ongletActif === "demandes"
                ? "bg-blue-100 text-blue-700 font-semibold"
                : "text-gray-600 hover:bg-gray-100"
            }`}
          >
            <DescriptionIcon fontSize="small" />
            <span className="text-sm">Mes demandes</span>
          </div>
        </nav>
      </aside>

      {/* Header mobile */}
      <div className="lg:hidden flex items-center justify-between p-4">
        <div className="flex items-center gap-4">
          <button onClick={() => setMenuOpen(!menuOpen)}>
            {menuOpen ? <CloseIcon fontSize="large" /> : <MenuIcon fontSize="large" />}
          </button>
          <img
            src={LogoBlack}
            alt="CreditX"
            className="w-24"
            onClick={() => setOngletActif("accueil")}
          />
        </div>

        <div
          id="avatar-button"
          onClick={() => setDropdownOpen(!dropdownOpen)}
          className="w-10 h-10 rounded-full bg-black text-white flex items-center justify-center font-bold cursor-pointer absolute right-4 top-4 lg:static lg:absolute lg:top-6 lg:right-6 z-50"
        >
          {getInitial(user?.email)}
        </div>

        {/* DROPDOWN — MOBILE */}
        {dropdownOpen && (
          <div
            id="dropdown-menu"
            className="fixed inset-0 z-50 bg-white px-6 py-8 flex flex-col"
          >
            <div className="flex justify-between items-start mb-8">
              <button onClick={() => setDropdownOpen(false)}>
                <CloseIcon className="text-gray-600" fontSize="large" />
              </button>
            </div>

            <div className="mb-8">
              <p className="font-bold text-2xl text-left">Habib Osmani</p>
              <p className="text-blue-600 text-base lg:text-sm text-left">
                habib.osmani@yahoo.fr
              </p>
            </div>

            <div className="bg-white rounded-xl shadow-sm p-6 space-y-6">
              <div className="flex items-center gap-3 text-lg lg:text-sm font-medium text-black">
                <HelpIcon className="text-blue-600" fontSize="medium" />
                Aide
              </div>
              <div className="flex items-center gap-3 text-lg lg:text-sm font-medium text-black">
                <NotificationsIcon className="text-blue-600" fontSize="medium" />
                Boite de réception
              </div>
              <div className="flex items-center gap-3 text-lg lg:text-sm font-medium text-black">
                <img src={LogoBlue} alt="logo" className="w-5 h-5" />
                A propos de nous
              </div>
              <div
                className="flex items-center gap-3 text-lg lg:text-sm font-medium text-black cursor-pointer"
                onClick={() => {
                  logout();
                  navigate("/login-client");
                }}
              >
                <LogoutIcon className="text-blue-600" fontSize="medium" />
                Me déconnecter
              </div>
            </div>
          </div>
        )}
        {/* FIN DROPDOWN MOBILE */}
      </div>

      {/* Menu burger mobile */}
      {menuOpen && (
        <div className="lg:hidden bg-white shadow-md rounded-xl mx-4 mt-2 z-50 absolute top-20 left-0 right-0">
          <nav className="flex flex-col">
            <button
              className={`flex items-center gap-2 px-4 py-3 text-lg lg:text-sm text-left cursor-pointer transition ${
                ongletActif === "accueil"
                  ? "text-blue-700 font-semibold bg-blue-50"
                  : "text-gray-600 hover:bg-gray-100"
              }`}
              onClick={() => {
                setOngletActif("accueil");
                setMenuOpen(false);
              }}
            >
              <HomeIcon fontSize="small" />
              Accueil
            </button>
            <button
              className={`flex items-center gap-2 px-4 py-3 text-lg lg:text-sm text-left cursor-pointer transition ${
                ongletActif === "demandes"
                  ? "text-blue-700 font-semibold bg-blue-50"
                  : "text-gray-600 hover:bg-gray-100"
              }`}
              onClick={() => {
                setOngletActif("demandes");
                setMenuOpen(false);
              }}
            >
              <DescriptionIcon fontSize="small" />
              Demandes de crédit
            </button>
          </nav>
        </div>
      )}

      <main className="flex-1 p-6 lg:p-12">
        {/* Avatar desktop */}
        <div
          id="avatar-button"
          onClick={() => setDropdownOpen(!dropdownOpen)}
          className="w-10 h-10 rounded-full bg-black text-white flex items-center justify-center font-bold cursor-pointer absolute right-4 top-4 lg:static lg:absolute lg:top-6 lg:right-6 z-50"
        >
          {getInitial(user?.email)}
        </div>

        {/* DROPDOWN — DESKTOP */}
        {dropdownOpen && (
          <div
            id="dropdown-menu"
            className="hidden lg:block absolute right-4 top-16 w-80 bg-white rounded-xl shadow-md z-[999] p-6 animate-slide-down"
          >
            <div className="lg:flex items-center justify-between mb-4">
              <div className="text-left">
                <p className="font-bold text-lg">Habib Osmani</p>
                <p className="text-blue-600 text-base break-all">{user?.email}</p>
              </div>
              <div className="w-12 h-12 rounded-full bg-gray-300 text-white flex items-center justify-center font-bold text-lg ml-auto mt-2 lg:mt-0 lg:ml-0">
                {getInitial(user?.email)}
              </div>
            </div>
            <hr className="my-4" />
            <div className="space-y-5 text-base">
              <div className="flex items-center gap-3 cursor-pointer">
                <HelpIcon className="text-blue-600" />
                Aide
              </div>
              <div className="flex items-center gap-3 cursor-pointer">
                <NotificationsIcon className="text-blue-600" />
                Boite de réception
              </div>
              <div className="flex items-center gap-3 cursor-pointer">
                <img src={LogoBlue} alt="logo" className="w-5 h-5" />
                A propos de nous
              </div>
              <div
                className="flex items-center gap-3 cursor-pointer"
                onClick={(e) => {
                  e.stopPropagation();
                  logout();
                  navigate("/login-client");
                }}
              >
                <LogoutIcon className="text-blue-600" />
                Me déconnecter
              </div>
            </div>
          </div>
        )}
        {/* FIN DROPDOWN DESKTOP */}

        <div className="flex justify-between items-start mb-8 lg:mb-10 relative">
          <h2 className="text-2xl lg:text-xl font-bold">
            {ongletActif === "accueil" && (
              <>
                Accueil
                {demandes.length > 0 && demandes[0]?.nom && (
                  <span className="text-gray-500 font-normal"> &gt; {demandes[0].nom}</span>
                )}
              </>
            )}
            {ongletActif === "demandes" && "Mes demandes"}
          </h2>
        </div>

        {ongletActif === "accueil" && (
          <>
            {!demandeEnCours ? (
              <div className="bg-white rounded-3xl p-10 shadow-md text-center">
                <h3 className="text-3xl font-bold mb-4">Bienvenu sur CreditX</h3>
                <p className="text-base lg:text-sm text-gray-600 mb-6">
                  Pour lancer une nouvelle demande, cliquez sur le bouton et laissez-vous guider.
                </p>
                <button
                  onClick={() => navigate("/nouvelle-demande")}
                  className="bg-black text-white px-6 py-3 rounded-full text-base lg:text-sm font-medium hover:bg-gray-900"
                >
                  Nouvelle demande
                </button>
              </div>
            ) : (
              <div className="bg-white rounded-3xl shadow-md flex flex-col lg:flex-row overflow-hidden">
                <div className="flex-1 px-6 py-8 lg:px-10">
                  <h3 className="text-3xl lg:text-4xl font-extrabold leading-tight mb-4">
                    Finalisez votre demande
                  </h3>
                  <div className="h-[4px] w-52 bg-blue-600 mb-4 rounded-full" />
                  <p className="text-base lg:text-sm text-gray-700 leading-relaxed max-w-md">
                    Vous y êtes presque. Effectuez les tâches restantes pour pouvoir envoyer votre demande.
                  </p>
                </div>

                {/* Liste d'étapes */}
                <div className="w-full lg:w-[420px] bg-[#F4F4F4] p-3 lg:p-6 rounded-b-3xl lg:rounded-b-none lg:rounded-r-3xl">
                  {[
                    "typeDemande",
                    "etatInfos",
                    "etatBien",
                    "etatIdentite",
                    "etatDocuments",
                    "etatResume",
                  ].map((key, i) => {
                    const labels = [
                      "Demande",
                      "Informations personnelles",
                      "Informations sur le bien",
                      "Authentification d’identité",
                      "Pièces jointes",
                      "Résumé et acceptation",
                    ];
                    const statut = demandes[0]?.[key] || "Non défini";
                    const statutAffichage = getStatutAffichage(key, statut);

                    return (
                      <div
                        key={key}
                        className="bg-white px-5 py-4 cursor-pointer hover:bg-gray-50 transition flex justify-between items-center"
                        onClick={() => {
                          const id = demandes[0]?.id;

                          if (key === "typeDemande") {
                            navigate("/type-demande");
                          } else if (key === "etatInfos") {
    
                            navigate(`/informations-personnelles?id=${id}`);
                            } else if (key === "etatBien") {
                              navigate(`/bien/${id}`);
                          } else if (["etatIdentite", "etatDocuments", "etatResume"].includes(key)) {
                            let message = "";
                            if (key === "etatIdentite") {
                              message =
                                "Veuillez d’abord compléter les étapes précédentes avant d'accéder à l'authentification d’identité.";
                            } else if (key === "etatDocuments") {
                              message =
                                "Vous devez remplir les informations personnelles et du bien avant d’accéder aux pièces jointes.";
                            } else if (key === "etatResume") {
                              message =
                                "Le résumé et l’acceptation ne sont disponibles qu’après avoir rempli toutes les sections.";
                            }

                            setModalInfo({
                              open: true,
                              message,
                            });
                          }
                        }}
                      >
                        <div>
                          <p className="font-semibold text-base lg:text-sm leading-tight">
                            {labels[i]}
                          </p>

                          <div className="flex items-center gap-2 mt-[2px]">
                            <p
                              className={`text-sm lg:text-xs ${statutAffichage.fontWeight}`}
                              style={{ color: statutAffichage.color }}
                            >
                              {statutAffichage.label}
                            </p>
                            {statutAffichage.icon && (
                              <span className="text-sm">{statutAffichage.icon}</span>
                            )}
                          </div>
                        </div>

                        <ArrowForwardIosIcon fontSize="small" className="text-gray-300" />
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </>
        )}

        {ongletActif === "demandes" && (
          <div className="pt-6">
            {demandes.length === 0 ? (
              <p className="text-gray-500 text-base lg:text-sm">Aucune demande encore enregistrée.</p>
            ) : (
              demandes.map((demande) => (
                <div
                  key={demande.id}
                  className="flex justify-between items-center bg-white rounded-xl p-4 mb-3 shadow-sm"
                >
                  <div
                    onClick={() => navigate(`/dashboard-client/${demande.id}`)}
                    className="cursor-pointer w-full"
                  >
                    <p className="font-semibold text-base lg:text-sm">
                      {demande.nom || "Sans nom"}
                    </p>
                    <p className="text-sm lg:text-xs text-gray-400 mt-1">
                      {demande.envoyee ? "Demande envoyée" : "Action requise"}
                    </p>
                  </div>
                  {!demande.envoyee && (
                    <button
                      onClick={() => supprimerDemande(demande.id)}
                      className="ml-4 text-base lg:text-sm text-red-500 hover:underline"
                    >
                      Supprimer
                    </button>
                  )}
                </div>
              ))
            )}
          </div>
        )}

        <ModalMessage
          open={modalInfo.open}
          onClose={() => setModalInfo({ open: false, message: "" })}
          onConfirm={() => setModalInfo({ open: false, message: "" })}
          title="Section non disponible"
          message={modalInfo.message}
          confirmText="J’ai compris"
          onlyConfirm
          showCloseIcon
        />
      </main>
    </div>
  );
}
