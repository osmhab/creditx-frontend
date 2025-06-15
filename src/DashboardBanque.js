// src/DashboardBanque.js

import React, { useEffect, useState } from "react";
import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "./firebase-config";
import { Link } from "react-router-dom";

function DashboardBanque() {
  const [dossiers, setDossiers] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filtreStatut, setFiltreStatut] = useState("tous");

  useEffect(() => {
    const fetchDossiers = async () => {
      const q = query(collection(db, "dossiers"), where("soumis", "==", true));
      const snap = await getDocs(q);
      const result = snap.docs.map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          dateSoumission: data.dateSoumission?.toDate?.() || null,
        };
      });

      result.sort((a, b) => {
        if (!a.dateSoumission) return 1;
        if (!b.dateSoumission) return -1;
        return b.dateSoumission - a.dateSoumission;
      });

      setDossiers(result);
      setFiltered(result);
      setLoading(false);
    };
    fetchDossiers();
  }, []);

  const handleSearch = (e) => {
    const val = e.target.value.toLowerCase();
    setSearch(val);
    applyFilters(val, filtreStatut);
  };

  const applyFilters = (searchText, statut) => {
    let result = dossiers;

    if (statut !== "tous") {
      result = result.filter((d) => d.statutDossier === statut);
    }

    if (searchText) {
      result = result.filter((d) =>
        d.nom?.toLowerCase().includes(searchText) ||
        d.email?.toLowerCase().includes(searchText) ||
        d.id?.toLowerCase().includes(searchText)
      );
    }

    setFiltered(result);
  };

  const handleStatutChange = (statut) => {
    setFiltreStatut(statut);
    applyFilters(search, statut);
  };

  const badgeStatut = (statut) => {
    const styles = {
      en_attente: "bg-yellow-100 text-yellow-800",
      accepte: "bg-green-100 text-green-800",
      refuse: "bg-red-100 text-red-800",
    };

    const labels = {
      en_attente: "⏳ En attente",
      accepte: "✅ Accepté",
      refuse: "❌ Refusé",
    };

    return (
      <span className={`px-3 py-1 rounded-full text-xs font-medium ${styles[statut] || "bg-gray-100 text-gray-500"}`}>
        {labels[statut] || "Statut inconnu"}
      </span>
    );
  };

  const badgeEtape = (etape) => (
    <span className="ml-2 px-2 py-0.5 text-xs font-semibold bg-blue-100 text-blue-700 rounded-full">
      Étape {etape || 1}
    </span>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <p className="text-gray-600 text-lg">Chargement des dossiers...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-10">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-3xl font-bold mb-6 text-gray-800">📂 Dossiers soumis</h1>

        {/* Barre de recherche */}
        <input
          type="text"
          placeholder="🔍 Rechercher un nom, email ou n° dossier..."
          value={search}
          onChange={handleSearch}
          className="w-full p-3 mb-4 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
        />

        {/* Filtres */}
        <div className="mb-6 flex gap-2 flex-wrap">
          {["tous", "en_attente", "accepte", "refuse"].map((statut) => (
            <button
              key={statut}
              onClick={() => handleStatutChange(statut)}
              className={`px-4 py-2 rounded-full text-sm border ${
                filtreStatut === statut
                  ? "bg-blue-600 text-white"
                  : "bg-white text-gray-600 border-gray-300 hover:bg-gray-100"
              }`}
            >
              {statut === "tous"
                ? "Tous"
                : statut === "en_attente"
                ? "⏳ En attente"
                : statut === "accepte"
                ? "✅ Acceptés"
                : "❌ Refusés"}
            </button>
          ))}
        </div>

        {filtered.length === 0 ? (
          <p className="text-gray-500">Aucun dossier trouvé.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {filtered.map((dossier) => (
              <div
                key={dossier.id}
                className="bg-white rounded-2xl shadow p-6 hover:shadow-md transition"
              >
                <div className="mb-2 text-sm text-gray-400">
                  #{dossier.id.slice(0, 6).toUpperCase()}
                </div>
                <h3 className="text-lg font-semibold text-gray-800">
                  {dossier.nom} {dossier.prenom}
                </h3>
                <p className="text-sm text-gray-600 mb-1">{dossier.email}</p>
                <div className="flex items-center gap-2 mt-2">
                  {badgeStatut(dossier.statutDossier)}
                  {badgeEtape(dossier.etape)}
                </div>
                {dossier.dateSoumission && (
                  <p className="text-xs text-gray-400 mt-2">
                    Soumis le{" "}
                    {dossier.dateSoumission.toLocaleDateString()} à{" "}
                    {dossier.dateSoumission.toLocaleTimeString()}
                  </p>
                )}
                <div className="mt-4">
                  <Link
                    to={`/dossier/${dossier.id}`}
                    className="inline-block text-blue-600 hover:underline text-sm"
                  >
                    🔍 Voir le dossier
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default DashboardBanque;
