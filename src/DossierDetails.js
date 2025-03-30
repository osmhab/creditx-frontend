// src/DossierDetails.js

import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { doc, getDoc } from "firebase/firestore";
import { db } from "./firebase-config";

function DossierDetails() {
  const { id } = useParams();
  const [dossier, setDossier] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDossier = async () => {
      const ref = doc(db, "dossiers", id);
      const snap = await getDoc(ref);
      if (snap.exists()) {
        const data = snap.data();
        setDossier({ ...data, dateSoumission: data.dateSoumission?.toDate?.() || null });
      }
      setLoading(false);
    };
    fetchDossier();
  }, [id]);

  if (loading) return <p>Chargement du dossier...</p>;
  if (!dossier) return <p>Dossier introuvable.</p>;

  const prixAchat = parseFloat(dossier.prixAchat) || 0;
  const fondsPropres = parseFloat(dossier.apport) || 0;
  const fonds2ePillier = parseFloat(dossier.fonds2ePillier || 0);
  const revenus = parseFloat(dossier.revenuAnnuel || 0);
  const montantFinancement = prixAchat - fondsPropres;
  const charges = montantFinancement * 0.05;
  const capaciteMax = revenus * 0.33;
  const capacitePourcentage = revenus > 0 ? (charges / revenus) * 100 : 0;
  const capaciteOK = charges <= capaciteMax;

  return (
    <div style={{ padding: 20 }}>
      <h2>Dossier #{id.slice(0, 6).toUpperCase()} – {dossier.nom} {dossier.prenom}</h2>

      {dossier.dateSoumission && (
        <p><em>Soumis le {dossier.dateSoumission.toLocaleDateString()} à {dossier.dateSoumission.toLocaleTimeString()}</em></p>
      )}

      <div style={{ border: '1px solid #ccc', padding: 20, borderRadius: 8, marginBottom: 30, background: '#f9f9f9' }}>
        <h3>📋 Résumé financier</h3>
        <p><strong>Capacité financière :</strong> {capaciteOK ? "✅ OK" : "❌ Dépassée"} ({capacitePourcentage.toFixed(1)} % du revenu)</p>
        <p><strong>Fonds propres totaux :</strong> CHF {fondsPropres.toLocaleString()}</p>
        <p><strong>Fonds du 2e pilier :</strong> CHF {fonds2ePillier.toLocaleString()}</p>
        <p><strong>Montant du crédit souhaité :</strong> CHF {montantFinancement.toLocaleString()}</p>
        <p><strong>Type de bien :</strong> {dossier.typeBien}</p>
        <p><strong>Prix du bien :</strong> CHF {prixAchat.toLocaleString()}</p>
        <p><strong>Lieu du bien :</strong> {dossier.adresseBien}</p>
      </div>

      <section>
        <h3>1. Identité</h3>
        <p><strong>Date de naissance :</strong> {dossier.dateNaissance}</p>
        <p><strong>Nationalité :</strong> {dossier.nationalite}</p>
        <p><strong>État civil :</strong> {dossier.etatCivil}</p>
        <p><strong>Enfants :</strong> {dossier.enfants}</p>
        <p><strong>Adresse :</strong> {dossier.adresse}</p>
        <p><strong>Téléphone :</strong> {dossier.telephone}</p>
        <p><strong>Email :</strong> {dossier.email}</p>
      </section>

      <section>
        <h3>2. Profession</h3>
        <p><strong>Statut professionnel :</strong> {dossier.statutPro}</p>
        <p><strong>Employeur :</strong> {dossier.employeur}</p>
        <p><strong>Fonction :</strong> {dossier.fonction}</p>
        <p><strong>Taux d’occupation :</strong> {dossier.tauxOccupation}</p>
        <p><strong>Date d’entrée :</strong> {dossier.dateEntree}</p>
        <p><strong>Revenu annuel :</strong> {dossier.revenuAnnuel}</p>
        <p><strong>Bonus :</strong> {dossier.bonus}</p>
        <p><strong>Revenu conjoint :</strong> {dossier.revenuConjoint}</p>
      </section>

      <section>
        <h3>3. Situation financière</h3>
        <p><strong>Fortune :</strong> {dossier.fortune}</p>
        <p><strong>Dettes :</strong> {dossier.dettes}</p>
        <p><strong>Loyer :</strong> {dossier.loyer}</p>
        <p><strong>Autres revenus :</strong> {dossier.autresRevenus}</p>
      </section>

      <section>
        <h3>4. Projet immobilier</h3>
        <p><strong>Type de bien :</strong> {dossier.typeBien}</p>
        <p><strong>Adresse du bien :</strong> {dossier.adresseBien}</p>
        <p><strong>Prix d’achat :</strong> CHF {prixAchat.toLocaleString()}</p>
        <p><strong>Apport personnel :</strong> CHF {fondsPropres.toLocaleString()}</p>
        <p><strong>Montant à financer :</strong> CHF {montantFinancement.toLocaleString()}</p>
        <p><strong>Travaux :</strong> {dossier.travaux}</p>
        <p><strong>Bien trouvé :</strong> {dossier.bienTrouve}</p>
        <p><strong>Usage :</strong> {dossier.typeAchat}</p>
        <p><strong>Rendement locatif :</strong> {dossier.rendementLocatif}</p>
      </section>

      <section>
        <h3>5. Documents</h3>
        {dossier.ficheSalaireURL ? (
          <p><a href={dossier.ficheSalaireURL} target="_blank" rel="noreferrer">📄 Voir fiche de salaire</a></p>
        ) : (
          <p>Fiche de salaire : non fournie</p>
        )}

        {dossier.attestationEmployeurURL ? (
          <p><a href={dossier.attestationEmployeurURL} target="_blank" rel="noreferrer">📄 Attestation employeur</a></p>
        ) : (
          <p>Attestation employeur : non fournie</p>
        )}

        {dossier.documentsBienURL ? (
          <p><a href={dossier.documentsBienURL} target="_blank" rel="noreferrer">📄 Documents du bien</a></p>
        ) : (
          <p>Documents du bien : non fournis</p>
        )}
      </section>
    </div>
  );
}

export default DossierDetails;
