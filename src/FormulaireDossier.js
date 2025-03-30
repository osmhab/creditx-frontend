// src/FormulaireDossier.js

import React, { useEffect, useState } from "react";
import { doc, getDoc, updateDoc, serverTimestamp } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { db, storage } from "./firebase-config";
import { useAuth } from "./AuthContext";

function FormulaireDossier() {
  const { user } = useAuth();
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      if (!user) return;
      const ref = doc(db, "dossiers", user.uid);
      const snap = await getDoc(ref);
      if (snap.exists()) {
        const data = snap.data();
        setFormData(data);
        if (data.etape) setStep(data.etape);
      }
      setLoading(false);
    };
    fetchData();
  }, [user]);

  const handleChange = async (e) => {
    const { name, value } = e.target;
    const newData = { ...formData, [name]: value };
    setFormData(newData);
    if (user) {
      const ref = doc(db, "dossiers", user.uid);
      await updateDoc(ref, {
        [name]: value,
      });
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file || !user) return;

    const storageRef = ref(storage, `dossiers/${user.uid}/ficheSalaire.pdf`);
    await uploadBytes(storageRef, file);
    const downloadURL = await getDownloadURL(storageRef);

    const dossierRef = doc(db, "dossiers", user.uid);
    await updateDoc(dossierRef, {
      ficheSalaireURL: downloadURL,
    });

    setFormData((prev) => ({ ...prev, ficheSalaireURL: downloadURL }));
    alert("✅ Fichier envoyé avec succès");
  };

  const saveStep = async (newStep) => {
    setStep(newStep);
    if (user) {
      const ref = doc(db, "dossiers", user.uid);
      await updateDoc(ref, { etape: newStep });
    }
  };

  const nextStep = () => saveStep(step + 1);
  const prevStep = () => saveStep(step - 1);

  const handleSoumission = async () => {
    if (!user) return;
    const ref = doc(db, "dossiers", user.uid);
    await updateDoc(ref, {
      soumis: true,
      dateSoumission: serverTimestamp()
    });
    alert("✅ Dossier soumis avec succès !");
  };

  if (!user || loading) return <p>Chargement...</p>;

  return (
    <div style={{ maxWidth: "600px", margin: "auto" }}>
      <h2>Formulaire – Étape {step}</h2>

      {step === 1 && (
        <>
          <input name="nom" value={formData.nom || ""} onChange={handleChange} placeholder="Nom" /><br />
          <input name="prenom" value={formData.prenom || ""} onChange={handleChange} placeholder="Prénom" /><br />
          <input name="dateNaissance" value={formData.dateNaissance || ""} onChange={handleChange} placeholder="Date de naissance" /><br />
          <input name="nationalite" value={formData.nationalite || ""} onChange={handleChange} placeholder="Nationalité" /><br />
          <input name="telephone" value={formData.telephone || ""} onChange={handleChange} placeholder="Téléphone" /><br />
        </>
      )}

      {step === 2 && (
        <>
          <input name="statutPro" value={formData.statutPro || ""} onChange={handleChange} placeholder="Statut professionnel" /><br />
          <input name="employeur" value={formData.employeur || ""} onChange={handleChange} placeholder="Employeur" /><br />
          <input name="fonction" value={formData.fonction || ""} onChange={handleChange} placeholder="Fonction" /><br />
          <input name="revenuAnnuel" value={formData.revenuAnnuel || ""} onChange={handleChange} placeholder="Revenu annuel brut" /><br />

          <label>Fiche de salaire (PDF)</label><br />
          <input type="file" accept="application/pdf" onChange={handleFileUpload} /><br />
          {formData.ficheSalaireURL && (
            <p><a href={formData.ficheSalaireURL} target="_blank" rel="noreferrer">Voir la fiche envoyée</a></p>
          )}
        </>
      )}

      {step === 3 && (
        <>
          <input name="fortune" value={formData.fortune || ""} onChange={handleChange} placeholder="Fortune (avoirs, 3e pilier…)" /><br />
          <input name="dettes" value={formData.dettes || ""} onChange={handleChange} placeholder="Dettes (leasing, crédits…)" /><br />
          <input name="loyer" value={formData.loyer || ""} onChange={handleChange} placeholder="Loyer mensuel" /><br />
        </>
      )}

      {step === 4 && (
        <>
          <input name="typeBien" value={formData.typeBien || ""} onChange={handleChange} placeholder="Type de bien" /><br />
          <input name="adresseBien" value={formData.adresseBien || ""} onChange={handleChange} placeholder="Adresse du bien" /><br />
          <input name="prixAchat" value={formData.prixAchat || ""} onChange={handleChange} placeholder="Prix d’achat" /><br />
          <input name="apport" value={formData.apport || ""} onChange={handleChange} placeholder="Apport personnel" /><br />

          <button style={{ marginTop: "20px", background: "green", color: "white" }} onClick={handleSoumission}>
            ✅ Soumettre le dossier
          </button>
        </>
      )}

      <div style={{ marginTop: "20px" }}>
        {step > 1 && <button onClick={prevStep}>Retour</button>}
        {step < 4 && <button onClick={nextStep} style={{ marginLeft: 10 }}>Suivant</button>}
      </div>
    </div>
  );
}

export default FormulaireDossier;
