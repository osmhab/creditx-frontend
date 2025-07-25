import React, { useEffect, useState } from "react";
import { useAuth } from "../AuthContext";
import { useNavigate } from "react-router-dom";
import { collection, query, where, onSnapshot, orderBy, doc, deleteDoc } from "firebase/firestore";
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

export default function DashboardClient() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [demandes, setDemandes] = useState([]);
  const [menuOpen, setMenuOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);

const handleDelete = async () => {
  if (!demandeEnCours?.id) return;

  const confirm = window.confirm("Souhaitez-vous vraiment supprimer cette demande ?");
  if (!confirm) return;

  try {
    await deleteDoc(doc(db, "demandes", demandeEnCours.id));
    setDemandes([]); // vide le state pour forcer l'affichage du bouton 'Nouvelle demande'
  } catch (error) {
    console.error("Erreur lors de la suppression :", error);
  }
};




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

if (!user || !user.uid) return null;



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

console.log("DEMANDES : ", demandes);
console.log("DEMANDE EN COURS : ", demandeEnCours);

if (!user || !user.uid) {
  return (
    <div className="flex justify-center items-center h-screen text-gray-500 text-sm">
      Chargement...
    </div>
  );
}





  return (
    <div className="flex flex-col lg:flex-row min-h-screen bg-[#F7F7F7] relative">
      {/* Sidebar desktop */}
      <aside className="hidden lg:block w-64 px-6 pt-10">
        <img src={LogoBlack} alt="CreditX" className="w-28 mb-10 cursor-pointer" onClick={() => navigate("/")} />
        <nav className="space-y-4">
          <div 
          onClick={() => navigate('/dashboard')}
          className="flex items-center gap-3 bg-blue-100 text-blue-700 font-semibold px-3 py-2 rounded-lg">
            <HomeIcon fontSize="small" />
            <span>Accueil</span>
          </div>
          <div 
          onClick={() => navigate('/demandes-client')}
          className="flex items-center gap-3 bg-blue-100 text-blue-700 font-semibold px-3 py-2 rounded-lg">
            <DescriptionIcon fontSize="small" />
            <span>Mes demandes</span>
          </div>
        </nav>
      </aside>

      {/* Mobile header */}
      <div className="lg:hidden flex items-center justify-between p-4">
        <img src={LogoBlack} alt="CreditX" className="w-24" onClick={() => navigate("/")} />
        <button onClick={() => setMenuOpen(!menuOpen)}>
          {menuOpen ? <CloseIcon fontSize="large" /> : <MenuIcon fontSize="large" />}
        </button>
      </div>

      {/* Mobile menu dropdown */}
      {menuOpen && (
        <div className="lg:hidden bg-white shadow-md rounded-xl mx-4 mt-2 z-50 absolute top-20 left-0 right-0">
          <nav className="flex flex-col">
            <button
              className="flex items-center gap-2 px-4 py-3 text-blue-700 font-semibold hover:bg-blue-50"
              onClick={() => {
                navigate("/");
                setMenuOpen(false);
              }}
            >
              <HomeIcon fontSize="small" />
              Accueil
            </button>
            <button
              className="flex items-center gap-2 px-4 py-3 text-gray-600 hover:bg-gray-100"
              onClick={() => {
                navigate("/demandes");
                setMenuOpen(false);
              }}
            >
              <DescriptionIcon fontSize="small" />
              Demandes de crédit
            </button>
          </nav>
        </div>
      )}

      {/* Main content */}
      <main className="flex-1 p-6 lg:p-12">
        <div className="flex justify-between items-start mb-8 lg:mb-10 relative">
          <h2 className="text-xl font-bold">
            Accueil
            {demandes.length > 0 && demandes[0]?.nom ? (
              <span className="text-gray-500 font-normal"> &gt; {demandes[0].nom}</span>
            ) : null}
          </h2>
          <div>
            <div
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="w-10 h-10 rounded-full bg-black text-white flex items-center justify-center font-bold cursor-pointer"
            >
              {getInitial(user?.email)}
            </div>

            {/* Dropdown Desktop */}
            {dropdownOpen && (
              <div className="hidden lg:block absolute right-0 top-12 w-80 bg-white rounded-xl shadow-md z-50 p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-bold">Habib Osmani</p>
                    <p className="text-blue-600 text-sm">habib.osmani@yahoo.fr</p>
                  </div>
                  <div className="w-10 h-10 rounded-full bg-gray-300 text-white flex items-center justify-center font-bold">
                    {getInitial(user?.email)}
                  </div>
                </div>
                <hr className="my-3" />
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-sm cursor-pointer">
                    <HelpIcon className="text-blue-600" />
                    Aide
                  </div>
                  <div className="flex items-center gap-2 text-sm cursor-pointer">
                    <NotificationsIcon className="text-blue-600" />
                    Boite de réception
                  </div>
                  <div className="flex items-center gap-2 text-sm cursor-pointer">
                    <img src={LogoBlue} alt="logo" className="w-4 h-4" />
                    A propos de nous
                  </div>
                  <div
                    className="flex items-center gap-2 text-sm cursor-pointer"
                    onClick={() => {
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
          </div>
        </div>

        {/* Bloc principal */}
        {!demandeEnCours ? (
          <div className="bg-white rounded-3xl p-10 shadow-md text-center">
            <h3 className="text-3xl font-bold mb-4">Bienvenu sur CreditX</h3>
            <p className="text-gray-600 mb-6">
              Pour lancer une nouvelle demande, cliquez sur le bouton et laissez-vous guider.
            </p>
            <button
              onClick={() => navigate("/nouvelle-demande")}
              className="bg-black text-white px-6 py-3 rounded-full text-sm font-medium hover:bg-gray-900"
            >
              Nouvelle demande
            </button>
          </div>
        ) : (
          <div className="bg-white rounded-3xl shadow-md flex flex-col lg:flex-row overflow-hidden">
            {/* Colonne gauche */}
            <div className="flex-1 px-6 py-8 lg:px-10">
              <h3 className="text-3xl lg:text-4xl font-extrabold leading-tight mb-4">
                Finalisez votre demande
              </h3>
              <div className="h-[4px] w-52 bg-blue-600 mb-4 rounded-full" />
              <p className="text-sm text-gray-700 leading-relaxed max-w-md">
                Vous y êtes presque. Effectuez les tâches restantes pour pouvoir envoyer votre demande.
              </p>
            </div>

            {/* Colonne droite */}
            <div className="w-full lg:w-[420px] bg-[#F4F4F4] p-3 lg:p-6 rounded-b-3xl lg:rounded-b-none lg:rounded-r-3xl">
              {[
                { label: "Demande", key: "typeDemande", statut: demandes[0]?.typeDemande || "Non défini" },
                { label: "Informations sur le bien", key: "etatBien", statut: demandes[0]?.etatBien },
                { label: "Informations personnelles", key: "etatInfos", statut: demandes[0]?.etatInfos },
                { label: "Authentification d’identité", key: "etatIdentite", statut: demandes[0]?.etatIdentite },
                { label: "Pièces jointes", key: "etatDocuments", statut: demandes[0]?.etatDocuments },
                { label: "Résumé et acceptation", key: "etatResume", statut: demandes[0]?.etatResume },
              ].map(({ label, key, statut }) => (
                <div
                  key={key}
                  className="bg-white px-5 py-4 cursor-pointer hover:bg-gray-50 transition flex justify-between items-center"
                  onClick={() => console.log("Go to:", key)}
                >
                  <div>
                    <p className="font-semibold text-[15px] leading-tight">{label}</p>
                    <p className={`text-[13px] font-normal mt-[2px] ${getStatutClass(statut)}`}>
                      {statut || "Non défini"}
                    </p>
                  </div>
                  <ArrowForwardIosIcon fontSize="small" className="text-gray-300" />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Dropdown mobile fullscreen */}
        {dropdownOpen && (
          <div className="lg:hidden absolute inset-0 bg-[#F4F4F4] z-50 p-6">
            <div className="flex justify-between items-center mb-6">
              <CloseIcon className="text-2xl" onClick={() => setDropdownOpen(false)} />
              <div className="w-12 h-12 rounded-full bg-gray-400 text-white flex items-center justify-center font-bold">
                {getInitial(user?.email)}
              </div>
            </div>
            <div className="mb-4">
              <p className="font-bold text-lg">Habib Osmani</p>
              <p className="text-blue-600 text-sm">habib.osmani@yahoo.fr</p>
            </div>
            <div className="bg-white rounded-xl p-4 space-y-6">
              <div className="flex items-center gap-2 text-sm">
                <HelpIcon className="text-blue-600" />
                Aide
              </div>
              <div className="flex items-center gap-2 text-sm">
                <NotificationsIcon className="text-blue-600" />
                Boite de réception
              </div>
              <div className="flex items-center gap-2 text-sm">
                <img src={LogoBlue} alt="logo" className="w-4 h-4" />
                A propos de nous
              </div>
              <div
                className="flex items-center gap-2 text-sm cursor-pointer"
                onClick={() => {
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
      </main>
    </div>
  );
}
