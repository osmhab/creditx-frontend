import React, { useEffect, useState } from "react";
import { useAuth } from "../AuthContext";
import { useNavigate } from "react-router-dom";
import { signOut } from "firebase/auth";
import { auth, db } from "../firebase-config";
import {
  collection,
  query,
  where,
  onSnapshot,
  orderBy,
  doc,
  deleteDoc,
} from "firebase/firestore";

export default function DashboardClient() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [demandes, setDemandes] = useState([]);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    if (!user) return;

    const q = query(
      collection(db, "dossiers"),
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

  const handleLogout = async () => {
    await signOut(auth);
    navigate("/login-client");
  };

  const getInitial = (email) => email?.charAt(0)?.toUpperCase() || "?";

  return (
    <div className="flex flex-col min-h-screen text-black">
      {/* Menu mobile */}
      <div className="md:hidden px-4 py-4 flex justify-between items-center">
        <h1 onClick={() => navigate("/")} className="text-xl font-extrabold cursor-pointer">
          CreditX
        </h1>
        <button onClick={() => setMobileMenuOpen(true)} className="text-2xl font-bold">
          ☰
        </button>
      </div>

      {/* Menu mobile plein écran */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 bg-white z-50 p-6 flex flex-col shadow-lg">
          <div className="flex justify-between items-center mb-6 border-b border-gray-200 pb-4">
            <h1 className="text-2xl font-bold text-black select-none">Menu</h1>
            <button onClick={() => setMobileMenuOpen(false)} aria-label="Fermer le menu" className="text-3xl text-gray-700 hover:text-gray-900 transition">×</button>
          </div>
          <nav className="flex flex-col space-y-6 text-lg font-semibold text-gray-900">
            <button onClick={() => { navigate("/dashboard"); setMobileMenuOpen(false); }}className="text-left hover:text-blue-600 transition">Accueil</button>
            <button onClick={() => { navigate("/formulaire"); setMobileMenuOpen(false); }}className="text-left hover:text-blue-600 transition">Nouvelle demande</button>
            <button onClick={() => { navigate("/demandes"); setMobileMenuOpen(false); }}className="text-left hover:text-blue-600 transition">Mes dossiers</button>
            <button onClick={handleLogout} className="text-red-600" className="text-left text-red-600 hover:text-red-800 transition">Se déconnecter</button>
          </nav>
        </div>
      )}

      {/* Contenu principal + sidebar */}
      <div className="flex-1 flex flex-col md:flex-row">
        {/* Barre latérale (desktop uniquement) */}
        <aside className="w-64 bg-white border-r shadow-sm hidden md:flex flex-col justify-between py-10 px-6">
          <div>
            <h1
              onClick={() => navigate("/")}
              className="text-2xl font-extrabold cursor-pointer hover:opacity-80 transition"
            >
              CreditX
            </h1>

            <nav className="mt-10 space-y-4 text-lg font-medium">
              <button
                onClick={() => navigate("/dashboard")}
                className="text-left w-full hover:text-blue-600 transition"
              >
                Accueil
              </button>
              <button
                onClick={() => navigate("/formulaire")}
                className="text-left w-full hover:text-blue-600 transition"
              >
                Nouvelle demande
              </button>
              <button
                onClick={() => navigate("/demandes")}
                className="text-left w-full hover:text-blue-600 transition"
              >
                Mes dossiers
              </button>
            </nav>
          </div>

          <button
            onClick={handleLogout}
            className="text-sm text-red-600 hover:underline"
          >
            Se déconnecter
          </button>
        </aside>

        {/* Contenu principal */}
        <main className="flex-1 px-6 py-10">
          <div className="max-w-4xl mx-auto space-y-10">
            {/* Avatar + email */}
            <div className="flex items-center justify-center gap-4 flex-col sm:flex-row text-center sm:text-left">
              <div className="bg-black text-white rounded-full w-16 h-16 flex items-center justify-center text-2xl font-bold">
                {getInitial(user?.email)}
              </div>
              <div>
                <h2 className="text-2xl font-bold">Bienvenue !</h2>
                <p className="text-gray-600">
                  Connecté en tant que <strong>{user?.email}</strong>
                </p>
              </div>
            </div>

            {/* Liste des demandes */}
            <div>
              <h3 className="text-xl font-semibold mb-4">Dernières demandes</h3>

              {demandes.length === 0 ? (
                <p className="text-gray-500">
                  Aucune demande enregistrée pour l’instant.
                </p>
              ) : (
                <div className="bg-white border rounded-xl overflow-hidden shadow-sm">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-gray-100 border-b">
                      <tr>
                        <th className="py-3 px-4">ID</th>
                        <th className="py-3 px-4">Date</th>
                        <th className="py-3 px-4">Montant</th>
                        <th className="py-3 px-4">Statut</th>
                        <th className="py-3 px-4 text-center">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {demandes.map((d) => (
                        <tr
                          key={d.id}
                          className="border-b hover:bg-gray-50 transition"
                        >
                          <td className="py-3 px-4 font-mono">{d.id}</td>
                          <td className="py-3 px-4">
                            {d.dateCreation
                              ?.toDate()
                              .toLocaleDateString("fr-CH")}
                          </td>
                          <td className="py-3 px-4">
                            {d.montant
                              ? `${Number(d.montant).toLocaleString("fr-CH")} CHF`
                              : "-"}
                          </td>
                          <td className="py-3 px-4">{d.statut || "Non défini"}</td>
                          <td className="py-3 px-4 flex justify-center gap-2">
                            <button
                              onClick={() => navigate(`/dossier/${d.id}`)}
                              className="text-sm bg-black text-white px-4 py-2 rounded-full hover:bg-gray-900 transition"
                            >
                              Voir
                            </button>
                            <button
                              onClick={async () => {
                                const confirm = window.confirm(
                                  "Supprimer cette demande ?"
                                );
                                if (confirm) {
                                  await deleteDoc(doc(db, "dossiers", d.id));
                                }
                              }}
                              className="text-sm bg-red-100 text-red-700 px-4 py-2 rounded-full hover:bg-red-200 transition"
                            >
                              Supprimer
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </main>
      </div>

      {/* Footer */}
      <footer className="bg-gray-50 border-t py-6 text-center text-sm text-gray-500">
        <div className="font-bold text-gray-600 mb-1">CreditX</div>
        <div className="flex justify-center gap-4 text-xs mb-1">
          <button onClick={() => navigate("/")} className="hover:underline">
            Accueil
          </button>
          <button
            onClick={() => navigate("/mentions-legales")}
            className="hover:underline"
          >
            Mentions légales
          </button>
        </div>
        <p className="text-[11px]">
          &copy; {new Date().getFullYear()} CreditX. Tous droits réservés.
        </p>
      </footer>
    </div>
  );
}