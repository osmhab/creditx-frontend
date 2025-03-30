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

  useEffect(() => {
    const fetchDossiers = async () => {
      const q = query(
        collection(db, "dossiers"),
        where("soumis", "==", true)
      );
      const snap = await getDocs(q);
      const result = snap.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          dateSoumission: data.dateSoumission?.toDate?.() || null
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
    const filtered = dossiers.filter(d =>
      d.nom?.toLowerCase().includes(val) ||
      d.email?.toLowerCase().includes(val) ||
      d.id?.toLowerCase().includes(val)
    );
    setFiltered(filtered);
  };

  if (loading) return <p>Chargement des dossiers...</p>;

  return (
    <div style={{ padding: 20 }}>
      <h2>📂 Dossiers soumis</h2>
      <input
        type="text"
        placeholder="🔍 Rechercher par nom, email ou n° dossier"
        value={search}
        onChange={handleSearch}
        style={{ marginBottom: 20, padding: 8, width: "100%" }}
      />
      {filtered.length === 0 ? (
        <p>Aucun dossier trouvé.</p>
      ) : (
        <ul>
          {filtered.map((dossier) => (
            <li key={dossier.id} style={{ marginBottom: 10 }}>
              <strong>Dossier #{dossier.id.slice(0, 6).toUpperCase()}</strong> – {dossier.nom} {dossier.prenom}<br />
              {dossier.email}<br />
              Étape actuelle : {dossier.etape || 1}<br />
              {dossier.dateSoumission && (
                <em>Soumis le {dossier.dateSoumission.toLocaleDateString()} à {dossier.dateSoumission.toLocaleTimeString()}</em>
              )}<br />
              <Link to={`/dossier/${dossier.id}`}>🔍 Voir le dossier</Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default DashboardBanque;
