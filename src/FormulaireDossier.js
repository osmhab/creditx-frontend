// src/FormulaireDossier.js

import React, { useEffect, useState } from "react";
import { doc, getDoc, updateDoc, serverTimestamp } from "firebase/firestore";
import { db } from "./firebase-config";
import { useAuth } from "./AuthContext";

function FormulaireDossier() {
  const { user } = useAuth();
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({});
  const [loading, setLoading] = useState(true);
  const [calculEffectue, setCalculEffectue] = useState(false);
  const [erreurFondPropre, setErreurFondPropre] = useState("");
  const [etape3Valide, setEtape3Valide] = useState(false);






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
      await updateDoc(ref, { [name]: value });
    }
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

  const masquerDateNaissance = (val) => {
    const digits = val.replace(/\D/g, "").slice(0, 8);
    const parts = [];
    if (digits.length > 0) parts.push(digits.slice(0, 2));
    if (digits.length > 2) parts.push(digits.slice(2, 4));
    if (digits.length > 4) parts.push(digits.slice(4, 8));
    return parts.join(".");
  };

  const formaterMilliers = (val) => {
    const digits = val.replace(/\D/g, "");
    if (!digits) return "";
    return Number(digits).toLocaleString("fr-CH").replace(/\s/g, "’");
  };

  const calculerValidationFondsPropres = () => {
    const prixAchat = Number(formData.prixAchat || 0);
    const fraisSupp = formData.avecFraisSup ? Number(formData.fraisSupp || 0) : 0;
    const coutTotal = prixAchat + fraisSupp;
  
    const fondsDurs = Number(formData.avoirsCompte || 0) + Number(formData.versement3ePilier || 0);
    const fondsTotal =
      fondsDurs +
      (formData.utilise2ePilier ? Number(formData.versement2ePilier || 0) : 0) +
      (formData.pretTiers ? Number(formData.montantPretTiers || 0) : 0) +
      (formData.avanceHoirie ? Number(formData.montantHoirie || 0) : 0) +
      (formData.donation ? Number(formData.montantDonation || 0) : 0);
  
    const montantPret = coutTotal - fondsTotal;
  
    let erreur = "";
  
    // Cas 1 : fonds propres totaux insuffisants (< 20%)
    if (fondsTotal < coutTotal * 0.20) {
      erreur = "❌ Vous n’avez pas assez de fonds propres (20% du coût total requis).";
    }
  
    // Cas 2 : fonds propres durs insuffisants (< 10%)
    else if (fondsDurs < coutTotal * 0.10) {
      erreur = "❌ Vous devez disposer d'au moins 10% de fonds propres hors 2e pilier.";
    }
  
    // Cas 3 : prêt trop faible ou inutile
    else if (montantPret <= 0) {
      erreur = "✅ Vous n’avez pas besoin d’un prêt hypothécaire pour acquérir ce bien.";
    } else if (montantPret < 20000) {
      erreur = "❌ Le montant minimum pour un prêt hypothécaire est de CHF 20'000.-";
    }
  
    setErreurFondPropre(erreur);
    setCalculEffectue(true);
    setEtape3Valide(erreur === "");
  };
  
  
  
  


  


  
  
  
  
  
  
  

  return (
    <div style={{ maxWidth: "700px", margin: "auto" }}>
      <h2>Formulaire – Étape {step}</h2>

      {step === 1 && (
        <>
          <h3>Vos informations</h3>
          <label>Prénom</label><br />
          <input name="prenom" value={formData.prenom || ""} onChange={handleChange} placeholder="Prénom" /><br />
          <label>Nom</label><br />
          <input name="nom" value={formData.nom || ""} onChange={handleChange} placeholder="Nom" /><br />
          <label>Rue et numéro</label><br />
          <input name="rueNumero" value={formData.rueNumero || ""} onChange={handleChange} placeholder="Rue et numéro" /><br />
          <label>NPA Localité</label><br />
          <input name="npaLocalite" value={formData.npaLocalite || ""} onChange={handleChange} placeholder="NPA / Localité" /><br />
          <label>Téléphone</label><br />
          <input name="telephone" value={formData.telephone || ""} onChange={handleChange} placeholder="+41 70 000 00 00" /><br />
          <label>Date de naissance</label><br />
          <input
  type="text"
  name="dateNaissance"
  inputMode="numeric"
  value={formData.dateNaissance || ""}
  onChange={(e) => {
    const masked = masquerDateNaissance(e.target.value);
    setFormData({ ...formData, dateNaissance: masked });
    if (user) {
      const ref = doc(db, "dossiers", user.uid);
      updateDoc(ref, { dateNaissance: masked });
    }
  }}
  placeholder="JJ.MM.AAAA"
/><br />

<label>Nationalité</label><br />
          <select name="nationalite" value={formData.nationalite || ""} onChange={handleChange}>
  <option value="">-- Nationalité --</option>
  <option value="Suisse">Suisse</option>
  <option value="Allemagne">Allemagne</option>
  <option value="Italie">Italie</option>
  <option value="France">France</option>
  <option value="Afghanistan">Afghanistan</option>
  <option value="Afrique du Sud">Afrique du Sud</option>
  <option value="Albanie">Albanie</option>
  <option value="Algérie">Algérie</option>
  <option value="Andorre">Andorre</option>
  <option value="Angola">Angola</option>
  <option value="Antigua-et-Barbuda">Antigua-et-Barbuda</option>
  <option value="Arabie Saoudite">Arabie Saoudite</option>
  <option value="Argentine">Argentine</option>
  <option value="Arménie">Arménie</option>
  <option value="Australie">Australie</option>
  <option value="Autriche">Autriche</option>
  <option value="Azerbaïdjan">Azerbaïdjan</option>
  <option value="Bahamas">Bahamas</option>
  <option value="Bahreïn">Bahreïn</option>
  <option value="Bangladesh">Bangladesh</option>
  <option value="Barbade">Barbade</option>
  <option value="Belgique">Belgique</option>
  <option value="Belize">Belize</option>
  <option value="Bénin">Bénin</option>
  <option value="Bhoutan">Bhoutan</option>
  <option value="Biélorussie">Biélorussie</option>
  <option value="Birmanie">Birmanie</option>
  <option value="Bolivie">Bolivie</option>
  <option value="Bosnie-Herzégovine">Bosnie-Herzégovine</option>
  <option value="Botswana">Botswana</option>
  <option value="Brésil">Brésil</option>
  <option value="Brunei">Brunei</option>
  <option value="Bulgarie">Bulgarie</option>
  <option value="Burkina Faso">Burkina Faso</option>
  <option value="Burundi">Burundi</option>
  <option value="Cambodge">Cambodge</option>
  <option value="Cameroun">Cameroun</option>
  <option value="Canada">Canada</option>
  <option value="Cap-Vert">Cap-Vert</option>
  <option value="Chili">Chili</option>
  <option value="Chine">Chine</option>
  <option value="Chypre">Chypre</option>
  <option value="Colombie">Colombie</option>
  <option value="Comores">Comores</option>
  <option value="Congo (Brazzaville)">Congo (Brazzaville)</option>
  <option value="Congo (Kinshasa)">Congo (Kinshasa)</option>
  <option value="Corée du Nord">Corée du Nord</option>
  <option value="Corée du Sud">Corée du Sud</option>
  <option value="Costa Rica">Costa Rica</option>
  <option value="Côte d'Ivoire">Côte d'Ivoire</option>
  <option value="Croatie">Croatie</option>
  <option value="Cuba">Cuba</option>
  <option value="Danemark">Danemark</option>
  <option value="Djibouti">Djibouti</option>
  <option value="Dominique">Dominique</option>
  <option value="Égypte">Égypte</option>
  <option value="Émirats Arabes Unis">Émirats Arabes Unis</option>
  <option value="Équateur">Équateur</option>
  <option value="Érythrée">Érythrée</option>
  <option value="Espagne">Espagne</option>
  <option value="Estonie">Estonie</option>
  <option value="Eswatini">Eswatini</option>
  <option value="États-Unis">États-Unis</option>
  <option value="Éthiopie">Éthiopie</option>
  <option value="Fidji">Fidji</option>
  <option value="Finlande">Finlande</option>
  <option value="Gabon">Gabon</option>
  <option value="Gambie">Gambie</option>
  <option value="Géorgie">Géorgie</option>
  <option value="Ghana">Ghana</option>
  <option value="Grèce">Grèce</option>
  <option value="Grenade">Grenade</option>
  <option value="Guatemala">Guatemala</option>
  <option value="Guinée">Guinée</option>
  <option value="Guinée équatoriale">Guinée équatoriale</option>
  <option value="Guinée-Bissau">Guinée-Bissau</option>
  <option value="Guyana">Guyana</option>
  <option value="Haïti">Haïti</option>
  <option value="Honduras">Honduras</option>
  <option value="Hongrie">Hongrie</option>
  <option value="Inde">Inde</option>
  <option value="Indonésie">Indonésie</option>
  <option value="Irak">Irak</option>
  <option value="Iran">Iran</option>
  <option value="Irlande">Irlande</option>
  <option value="Islande">Islande</option>
  <option value="Israël">Israël</option>
  <option value="Jamaïque">Jamaïque</option>
  <option value="Japon">Japon</option>
  <option value="Jordanie">Jordanie</option>
  <option value="Kazakhstan">Kazakhstan</option>
  <option value="Kenya">Kenya</option>
  <option value="Kirghizistan">Kirghizistan</option>
  <option value="Kiribati">Kiribati</option>
  <option value="Koweït">Koweït</option>
  <option value="Laos">Laos</option>
  <option value="Lesotho">Lesotho</option>
  <option value="Lettonie">Lettonie</option>
  <option value="Liban">Liban</option>
  <option value="Libéria">Libéria</option>
  <option value="Libye">Libye</option>
  <option value="Liechtenstein">Liechtenstein</option>
  <option value="Lituanie">Lituanie</option>
  <option value="Luxembourg">Luxembourg</option>
  <option value="Macédoine du Nord">Macédoine du Nord</option>
  <option value="Madagascar">Madagascar</option>
  <option value="Malaisie">Malaisie</option>
  <option value="Malawi">Malawi</option>
  <option value="Maldives">Maldives</option>
  <option value="Mali">Mali</option>
  <option value="Malte">Malte</option>
  <option value="Maroc">Maroc</option>
  <option value="Îles Marshall">Îles Marshall</option>
  <option value="Maurice">Maurice</option>
  <option value="Mauritanie">Mauritanie</option>
  <option value="Mexique">Mexique</option>
  <option value="Micronésie">Micronésie</option>
  <option value="Moldavie">Moldavie</option>
  <option value="Monaco">Monaco</option>
  <option value="Mongolie">Mongolie</option>
  <option value="Monténégro">Monténégro</option>
  <option value="Mozambique">Mozambique</option>
  <option value="Myanmar (Birmanie)">Myanmar (Birmanie)</option>
  <option value="Namibie">Namibie</option>
  <option value="Nauru">Nauru</option>
  <option value="Népal">Népal</option>
  <option value="Nicaragua">Nicaragua</option>
  <option value="Niger">Niger</option>
  <option value="Nigéria">Nigéria</option>
  <option value="Norvège">Norvège</option>
  <option value="Nouvelle-Zélande">Nouvelle-Zélande</option>
  <option value="Oman">Oman</option>
  <option value="Ouganda">Ouganda</option>
  <option value="Ouzbékistan">Ouzbékistan</option>
  <option value="Pakistan">Pakistan</option>
  <option value="Palaos">Palaos</option>
  <option value="Palestine">Palestine</option>
  <option value="Panama">Panama</option>
  <option value="Papouasie-Nouvelle-Guinée">Papouasie-Nouvelle-Guinée</option>
  <option value="Paraguay">Paraguay</option>
  <option value="Pays-Bas">Pays-Bas</option>
  <option value="Pérou">Pérou</option>
  <option value="Philippines">Philippines</option>
  <option value="Pologne">Pologne</option>
  <option value="Portugal">Portugal</option>
  <option value="Qatar">Qatar</option>
  <option value="République centrafricaine">République centrafricaine</option>
  <option value="République démocratique du Congo">République démocratique du Congo</option>
  <option value="République dominicaine">République dominicaine</option>
  <option value="République tchèque">République tchèque</option>
  <option value="Roumanie">Roumanie</option>
  <option value="Royaume-Uni">Royaume-Uni</option>
  <option value="Russie">Russie</option>
  <option value="Rwanda">Rwanda</option>
  <option value="Saint-Christophe-et-Niévès">Saint-Christophe-et-Niévès</option>
  <option value="Saint-Marin">Saint-Marin</option>
  <option value="Saint-Vincent-et-les-Grenadines">Saint-Vincent-et-les-Grenadines</option>
  <option value="Sainte-Lucie">Sainte-Lucie</option>
  <option value="Salomon">Salomon</option>
  <option value="Salvador">Salvador</option>
  <option value="Samoa">Samoa</option>
  <option value="São Tomé-et-Principe">São Tomé-et-Principe</option>
  <option value="Sénégal">Sénégal</option>
  <option value="Serbie">Serbie</option>
  <option value="Seychelles">Seychelles</option>
  <option value="Sierra Leone">Sierra Leone</option>
  <option value="Singapour">Singapour</option>
  <option value="Slovaquie">Slovaquie</option>
  <option value="Slovénie">Slovénie</option>
  <option value="Somalie">Somalie</option>
  <option value="Soudan">Soudan</option>
  <option value="Soudan du Sud">Soudan du Sud</option>
  <option value="Sri Lanka">Sri Lanka</option>
  <option value="Suède">Suède</option>
  <option value="Suriname">Suriname</option>
  <option value="Syrie">Syrie</option>
  <option value="Tadjikistan">Tadjikistan</option>
  <option value="Tanzanie">Tanzanie</option>
  <option value="Tchad">Tchad</option>
  <option value="Thaïlande">Thaïlande</option>
  <option value="Timor oriental">Timor oriental</option>
  <option value="Togo">Togo</option>
  <option value="Tonga">Tonga</option>
  <option value="Trinité-et-Tobago">Trinité-et-Tobago</option>
  <option value="Tunisie">Tunisie</option>
  <option value="Turkménistan">Turkménistan</option>
  <option value="Turquie">Turquie</option>
  <option value="Tuvalu">Tuvalu</option>
  <option value="Ukraine">Ukraine</option>
  <option value="Uruguay">Uruguay</option>
  <option value="Vanuatu">Vanuatu</option>
  <option value="Vatican">Vatican</option>
  <option value="Venezuela">Venezuela</option>
  <option value="Viêt Nam">Viêt Nam</option>
  <option value="Yémen">Yémen</option>
  <option value="Zambie">Zambie</option>
  <option value="Zimbabwe">Zimbabwe</option>
</select><br />

{formData.nationalite && formData.nationalite !== "Suisse" && (
  <>
    <label>Permis de séjour :</label><br />
    <select
      name="permisSejour"
      value={formData.permisSejour || ""}
      onChange={handleChange}
    >
      <option value="">-- Sélectionner le permis --</option>
      <option value="B">Permis B</option>
      <option value="C">Permis C</option>
    </select><br />
  </>
)}
<label>Etat civil</label><br />
          <select
  name="etatCivil"
  value={formData.etatCivil || ""}
  onChange={(e) => {
    const value = e.target.value;
    const updatedData = {
      ...formData,
      etatCivil: value,
    };

    // Réinitialiser ajout conjoint si autre état civil
    if (value !== "marie") {
      updatedData.ajouterDeuxiemePersonne = false;
    }

    setFormData(updatedData);
    if (user) {
      const ref = doc(db, "dossiers", user.uid);
      updateDoc(ref, updatedData);
    }
  }}
>
  <option value="">-- État civil --</option>
  <option value="celibataire">Célibataire</option>
  <option value="marie">Marié(e)</option>
  <option value="divorce">Divorcé(e)</option>
  <option value="veuf">Veuf / Veuve</option>
</select><br />

{formData.etatCivil === "marie" && (
  <label>
    <input
      type="checkbox"
      checked={formData.ajouterDeuxiemePersonne || false}
      onChange={(e) => {
        const checked = e.target.checked;
        const update = {
          ajouterDeuxiemePersonne: checked,
        };

        // Définir l’état civil du conjoint automatiquement si coché
        if (checked) {
          update.conjointEtatCivil = "marie";
        }

        const newData = { ...formData, ...update };
        setFormData(newData);
        if (user) {
          const ref = doc(db, "dossiers", user.uid);
          updateDoc(ref, update);
        }
      }}
    /> Souhaitez-vous ajouter votre conjoint comme 2e personne ?
  </label>
)}<br />

<label>Formation</label><br />
          <input name="formation" value={formData.formation || ""} onChange={handleChange} placeholder="Formation" /><br />
<label>Profession</label><br />
          <input name="profession" value={formData.profession || ""} onChange={handleChange} placeholder="Profession" /><br />
<label>Fonction (Employé, Directeur, etc.)</label><br />         
          <input name="fonction" value={formData.fonction || ""} onChange={handleChange} placeholder="Fonction" /><br />
<label>Employeur</label><br />
          <input name="employeur" value={formData.employeur || ""} onChange={handleChange} placeholder="Nom de l’employeur" /><br />
<label>Adresse employeur (NPA Localité) :</label><br />
          <input name="adresseEmployeur" value={formData.adresseEmployeur || ""} onChange={handleChange} placeholder="Adresse de l’employeur" /><br />

          <label>
            <input
              type="checkbox"
              checked={formData.ayantEnfants || false}
              onChange={(e) => handleChange({ target: { name: "ayantEnfants", value: e.target.checked } })}
            /> J’ai des enfants à charge
          </label><br />

          {formData.ayantEnfants && (
            <>
              {(formData.enfants || []).map((annee, index) => (
                <div key={index}>
                  <input
                    type="text"
                    placeholder="Année de naissance"
                    value={annee}
                    onChange={(e) => {
                      const newEnfants = [...formData.enfants];
                      newEnfants[index] = e.target.value;
                      setFormData({ ...formData, enfants: newEnfants });
                      if (user) {
                        const ref = doc(db, "dossiers", user.uid);
                        updateDoc(ref, { enfants: newEnfants });
                      }
                    }}
                  />
                  <button onClick={() => {
                    const newEnfants = formData.enfants.filter((_, i) => i !== index);
                    setFormData({ ...formData, enfants: newEnfants });
                    if (user) {
                      const ref = doc(db, "dossiers", user.uid);
                      updateDoc(ref, { enfants: newEnfants });
                    }
                  }}>❌</button>
                </div>
              ))}
              <button onClick={() => {
                const newEnfants = [...(formData.enfants || []), ""];
                setFormData({ ...formData, enfants: newEnfants });
                if (user) {
                  const ref = doc(db, "dossiers", user.uid);
                  updateDoc(ref, { enfants: newEnfants });
                }
              }}>➕ Ajouter un enfant</button>
            </>
          )}

          <hr />
          <label>
            <input
              type="checkbox"
              checked={formData.ajouterDeuxiemePersonne || false}
              onChange={(e) => handleChange({ target: { name: "ajouterDeuxiemePersonne", value: e.target.checked } })}
            /> Ajouter une deuxième personne (conjoint·e)
          </label><br />

          {formData.ajouterDeuxiemePersonne && (
            <>
              <h4>Deuxième personne (conjoint·e)</h4>
              
        <label>Prénom</label><br />
        <input name="conjointPrenom" value={formData.conjointPrenom || ""} onChange={handleChange} placeholder="Prénom" /><br />
        <label>Nom</label><br />
              <input name="conjointNom" value={formData.conjointNom || ""} onChange={handleChange} placeholder="Nom" /><br />
        <label>Date de naissance</label><br />
              <input
  type="text"
  name="conjointDateNaissance"
  inputMode="numeric"
  value={formData.conjointDateNaissance || ""}
  onChange={(e) => {
    const masked = masquerDateNaissance(e.target.value);
    setFormData({ ...formData, conjointDateNaissance: masked });
    if (user) {
      const ref = doc(db, "dossiers", user.uid);
      updateDoc(ref, { conjointDateNaissance: masked });
    }
  }}
  placeholder="JJ.MM.AAAA"
/><br />

<label>Nationalité</label><br />
              <select name="conjointNationalite" value={formData.conjointNationalite || ""} onChange={handleChange}>
  <option value="">-- Nationalité --</option>
  <option value="Suisse">Suisse</option>
  <option value="Allemagne">Allemagne</option>
  <option value="Italie">Italie</option>
  <option value="France">France</option>
  <option value="Afghanistan">Afghanistan</option>
  <option value="Afrique du Sud">Afrique du Sud</option>
  <option value="Albanie">Albanie</option>
  <option value="Algérie">Algérie</option>
  <option value="Andorre">Andorre</option>
  <option value="Angola">Angola</option>
  <option value="Antigua-et-Barbuda">Antigua-et-Barbuda</option>
  <option value="Arabie Saoudite">Arabie Saoudite</option>
  <option value="Argentine">Argentine</option>
  <option value="Arménie">Arménie</option>
  <option value="Australie">Australie</option>
  <option value="Autriche">Autriche</option>
  <option value="Azerbaïdjan">Azerbaïdjan</option>
  <option value="Bahamas">Bahamas</option>
  <option value="Bahreïn">Bahreïn</option>
  <option value="Bangladesh">Bangladesh</option>
  <option value="Barbade">Barbade</option>
  <option value="Belgique">Belgique</option>
  <option value="Belize">Belize</option>
  <option value="Bénin">Bénin</option>
  <option value="Bhoutan">Bhoutan</option>
  <option value="Biélorussie">Biélorussie</option>
  <option value="Birmanie">Birmanie</option>
  <option value="Bolivie">Bolivie</option>
  <option value="Bosnie-Herzégovine">Bosnie-Herzégovine</option>
  <option value="Botswana">Botswana</option>
  <option value="Brésil">Brésil</option>
  <option value="Brunei">Brunei</option>
  <option value="Bulgarie">Bulgarie</option>
  <option value="Burkina Faso">Burkina Faso</option>
  <option value="Burundi">Burundi</option>
  <option value="Cambodge">Cambodge</option>
  <option value="Cameroun">Cameroun</option>
  <option value="Canada">Canada</option>
  <option value="Cap-Vert">Cap-Vert</option>
  <option value="Chili">Chili</option>
  <option value="Chine">Chine</option>
  <option value="Chypre">Chypre</option>
  <option value="Colombie">Colombie</option>
  <option value="Comores">Comores</option>
  <option value="Congo (Brazzaville)">Congo (Brazzaville)</option>
  <option value="Congo (Kinshasa)">Congo (Kinshasa)</option>
  <option value="Corée du Nord">Corée du Nord</option>
  <option value="Corée du Sud">Corée du Sud</option>
  <option value="Costa Rica">Costa Rica</option>
  <option value="Côte d'Ivoire">Côte d'Ivoire</option>
  <option value="Croatie">Croatie</option>
  <option value="Cuba">Cuba</option>
  <option value="Danemark">Danemark</option>
  <option value="Djibouti">Djibouti</option>
  <option value="Dominique">Dominique</option>
  <option value="Égypte">Égypte</option>
  <option value="Émirats Arabes Unis">Émirats Arabes Unis</option>
  <option value="Équateur">Équateur</option>
  <option value="Érythrée">Érythrée</option>
  <option value="Espagne">Espagne</option>
  <option value="Estonie">Estonie</option>
  <option value="Eswatini">Eswatini</option>
  <option value="États-Unis">États-Unis</option>
  <option value="Éthiopie">Éthiopie</option>
  <option value="Fidji">Fidji</option>
  <option value="Finlande">Finlande</option>
  <option value="Gabon">Gabon</option>
  <option value="Gambie">Gambie</option>
  <option value="Géorgie">Géorgie</option>
  <option value="Ghana">Ghana</option>
  <option value="Grèce">Grèce</option>
  <option value="Grenade">Grenade</option>
  <option value="Guatemala">Guatemala</option>
  <option value="Guinée">Guinée</option>
  <option value="Guinée équatoriale">Guinée équatoriale</option>
  <option value="Guinée-Bissau">Guinée-Bissau</option>
  <option value="Guyana">Guyana</option>
  <option value="Haïti">Haïti</option>
  <option value="Honduras">Honduras</option>
  <option value="Hongrie">Hongrie</option>
  <option value="Inde">Inde</option>
  <option value="Indonésie">Indonésie</option>
  <option value="Irak">Irak</option>
  <option value="Iran">Iran</option>
  <option value="Irlande">Irlande</option>
  <option value="Islande">Islande</option>
  <option value="Israël">Israël</option>
  <option value="Jamaïque">Jamaïque</option>
  <option value="Japon">Japon</option>
  <option value="Jordanie">Jordanie</option>
  <option value="Kazakhstan">Kazakhstan</option>
  <option value="Kenya">Kenya</option>
  <option value="Kirghizistan">Kirghizistan</option>
  <option value="Kiribati">Kiribati</option>
  <option value="Koweït">Koweït</option>
  <option value="Laos">Laos</option>
  <option value="Lesotho">Lesotho</option>
  <option value="Lettonie">Lettonie</option>
  <option value="Liban">Liban</option>
  <option value="Libéria">Libéria</option>
  <option value="Libye">Libye</option>
  <option value="Liechtenstein">Liechtenstein</option>
  <option value="Lituanie">Lituanie</option>
  <option value="Luxembourg">Luxembourg</option>
  <option value="Macédoine du Nord">Macédoine du Nord</option>
  <option value="Madagascar">Madagascar</option>
  <option value="Malaisie">Malaisie</option>
  <option value="Malawi">Malawi</option>
  <option value="Maldives">Maldives</option>
  <option value="Mali">Mali</option>
  <option value="Malte">Malte</option>
  <option value="Maroc">Maroc</option>
  <option value="Îles Marshall">Îles Marshall</option>
  <option value="Maurice">Maurice</option>
  <option value="Mauritanie">Mauritanie</option>
  <option value="Mexique">Mexique</option>
  <option value="Micronésie">Micronésie</option>
  <option value="Moldavie">Moldavie</option>
  <option value="Monaco">Monaco</option>
  <option value="Mongolie">Mongolie</option>
  <option value="Monténégro">Monténégro</option>
  <option value="Mozambique">Mozambique</option>
  <option value="Myanmar (Birmanie)">Myanmar (Birmanie)</option>
  <option value="Namibie">Namibie</option>
  <option value="Nauru">Nauru</option>
  <option value="Népal">Népal</option>
  <option value="Nicaragua">Nicaragua</option>
  <option value="Niger">Niger</option>
  <option value="Nigéria">Nigéria</option>
  <option value="Norvège">Norvège</option>
  <option value="Nouvelle-Zélande">Nouvelle-Zélande</option>
  <option value="Oman">Oman</option>
  <option value="Ouganda">Ouganda</option>
  <option value="Ouzbékistan">Ouzbékistan</option>
  <option value="Pakistan">Pakistan</option>
  <option value="Palaos">Palaos</option>
  <option value="Palestine">Palestine</option>
  <option value="Panama">Panama</option>
  <option value="Papouasie-Nouvelle-Guinée">Papouasie-Nouvelle-Guinée</option>
  <option value="Paraguay">Paraguay</option>
  <option value="Pays-Bas">Pays-Bas</option>
  <option value="Pérou">Pérou</option>
  <option value="Philippines">Philippines</option>
  <option value="Pologne">Pologne</option>
  <option value="Portugal">Portugal</option>
  <option value="Qatar">Qatar</option>
  <option value="République centrafricaine">République centrafricaine</option>
  <option value="République démocratique du Congo">République démocratique du Congo</option>
  <option value="République dominicaine">République dominicaine</option>
  <option value="République tchèque">République tchèque</option>
  <option value="Roumanie">Roumanie</option>
  <option value="Royaume-Uni">Royaume-Uni</option>
  <option value="Russie">Russie</option>
  <option value="Rwanda">Rwanda</option>
  <option value="Saint-Christophe-et-Niévès">Saint-Christophe-et-Niévès</option>
  <option value="Saint-Marin">Saint-Marin</option>
  <option value="Saint-Vincent-et-les-Grenadines">Saint-Vincent-et-les-Grenadines</option>
  <option value="Sainte-Lucie">Sainte-Lucie</option>
  <option value="Salomon">Salomon</option>
  <option value="Salvador">Salvador</option>
  <option value="Samoa">Samoa</option>
  <option value="São Tomé-et-Principe">São Tomé-et-Principe</option>
  <option value="Sénégal">Sénégal</option>
  <option value="Serbie">Serbie</option>
  <option value="Seychelles">Seychelles</option>
  <option value="Sierra Leone">Sierra Leone</option>
  <option value="Singapour">Singapour</option>
  <option value="Slovaquie">Slovaquie</option>
  <option value="Slovénie">Slovénie</option>
  <option value="Somalie">Somalie</option>
  <option value="Soudan">Soudan</option>
  <option value="Soudan du Sud">Soudan du Sud</option>
  <option value="Sri Lanka">Sri Lanka</option>
  <option value="Suède">Suède</option>
  <option value="Suriname">Suriname</option>
  <option value="Syrie">Syrie</option>
  <option value="Tadjikistan">Tadjikistan</option>
  <option value="Tanzanie">Tanzanie</option>
  <option value="Tchad">Tchad</option>
  <option value="Thaïlande">Thaïlande</option>
  <option value="Timor oriental">Timor oriental</option>
  <option value="Togo">Togo</option>
  <option value="Tonga">Tonga</option>
  <option value="Trinité-et-Tobago">Trinité-et-Tobago</option>
  <option value="Tunisie">Tunisie</option>
  <option value="Turkménistan">Turkménistan</option>
  <option value="Turquie">Turquie</option>
  <option value="Tuvalu">Tuvalu</option>
  <option value="Ukraine">Ukraine</option>
  <option value="Uruguay">Uruguay</option>
  <option value="Vanuatu">Vanuatu</option>
  <option value="Vatican">Vatican</option>
  <option value="Venezuela">Venezuela</option>
  <option value="Viêt Nam">Viêt Nam</option>
  <option value="Yémen">Yémen</option>
  <option value="Zambie">Zambie</option>
  <option value="Zimbabwe">Zimbabwe</option>
</select><br />

{formData.conjointNationalite && formData.conjointNationalite !== "Suisse" && (
  <>
    <label>Permis de séjour :</label><br />
    <select
      name="conjointPermisSejour"
      value={formData.conjointPermisSejour || ""}
      onChange={handleChange}
    >
      <option value="">-- Sélectionner le permis --</option>
      <option value="B">Permis B</option>
      <option value="C">Permis C</option>
    </select><br />
  </>
)}
<label>Etat civil</label><br />
            <select name="conjointEtatCivil" value={formData.conjointEtatCivil || ""} onChange={handleChange}>
                    <option value="">-- État civil --</option>
                    <option value="celibataire">Célibataire</option>
                    <option value="marie">Marié(e)</option>
                     <option value="divorce">Divorcé(e)</option>
                    <option value="veuf">Veuf / Veuve</option>
            </select><br />

    <label>Formation</label><br />  
              <input name="conjointFormation" value={formData.conjointFormation || ""} onChange={handleChange} placeholder="Formation" /><br />
    <label>Profession</label><br />
              <input name="conjointProfession" value={formData.conjointProfession || ""} onChange={handleChange} placeholder="Profession" /><br />
    <label>Fonction (Employé, directeur, etc.)</label><br />
              <input name="conjointFonction" value={formData.conjointFonction || ""} onChange={handleChange} placeholder="Fonction" /><br />
    <label>Employeur</label><br /> 
              <input name="conjointEmployeur" value={formData.conjointEmployeur || ""} onChange={handleChange} placeholder="Nom de l’employeur" /><br />
    <label>Adresse employeur (NPA Localité)</label><br />
              <input name="conjointAdresseEmployeur" value={formData.conjointAdresseEmployeur || ""} onChange={handleChange} placeholder="Adresse de l’employeur" /><br />
            </>
          )}
        </>
      )}
      {step === 2 && (
        <>
        <h4>
            Situation financière de{" "}
            {formData.prenom || ""} {formData.nom || ""}
        </h4>

    <label>Revenu brut régulier par année</label><br />
        <input
  type="text"
  name="revenuBrut"
  inputMode="numeric"
  value={formData.revenuBrut !== undefined ? formaterMilliers(formData.revenuBrut.toString()) : ""}
  onChange={(e) => {
    const digits = e.target.value.replace(/\D/g, "");
    const numericValue = digits === "" ? "" : Number(digits);
    setFormData({ ...formData, revenuBrut: numericValue });
    if (user) {
      const ref = doc(db, "dossiers", user.uid);
      updateDoc(ref, { revenuBrut: numericValue });
    }
  }}
  placeholder="CHF Montant"
/>

<br />

<label>Moyenne des bonus des 3 dernières années</label><br />
<input
  type="text"
  name="bonusMoyenne"
  inputMode="numeric"
  value={formData.bonusMoyenne !== undefined ? formaterMilliers(formData.bonusMoyenne.toString()) : ""}
  onChange={(e) => {
    const digits = e.target.value.replace(/\D/g, "");
    const numericValue = digits === "" ? "" : Number(digits);
    setFormData({ ...formData, bonusMoyenne: numericValue });
    if (user) {
      const ref = doc(db, "dossiers", user.uid);
      updateDoc(ref, { bonusMoyenne: numericValue });
    }
  }}
  placeholder="CHF Montant"
/>

<br />
<label>Revenu complémentaire régulier par année (p. ex. loyer, revenu accessoire)</label><br />
<input
  type="text"
  name="revenuComplementaire"
  inputMode="numeric"
  value={formData.revenuComplementaire !== undefined ? formaterMilliers(formData.revenuComplementaire.toString()) : ""}
  onChange={(e) => {
    const digits = e.target.value.replace(/\D/g, "");
    const numericValue = digits === "" ? "" : Number(digits);
    setFormData({ ...formData, revenuComplementaire: numericValue });
    if (user) {
      const ref = doc(db, "dossiers", user.uid);
      updateDoc(ref, { revenuComplementaire: numericValue });
    }
  }}
  placeholder="CHF Montant"
/>


<br />

          <label>
            <input
              type="checkbox"
              checked={formData.estIndependant || false}
              onChange={(e) =>
                handleChange({ target: { name: "estIndependant", value: e.target.checked } })
              }
            /> Le revenu provient d’une activité indépendante ou d’une entreprise propre
          </label><br />

          <p>Obligations exceptionnelles :</p>
          <label>
            <input
              type="checkbox"
              checked={formData.pensionAlimentaire || false}
              onChange={(e) =>
                handleChange({ target: { name: "pensionAlimentaire", value: e.target.checked } })
              }
            /> Pension alimentaire (par année)
          </label>
          {formData.pensionAlimentaire && (
            <input
  type="text"
  name="montantPension"
  inputMode="numeric"
  value={formData.montantPension !== undefined ? formaterMilliers(formData.montantPension.toString()) : ""}
  onChange={(e) => {
    const digits = e.target.value.replace(/\D/g, "");
    const numericValue = digits === "" ? "" : Number(digits);
    setFormData({ ...formData, montantPension: numericValue });
    if (user) {
      const ref = doc(db, "dossiers", user.uid);
      updateDoc(ref, { montantPension: numericValue });
    }
  }}
  placeholder="CHF Montant"
/>

          )}<br />

          <label>
            <input
              type="checkbox"
              checked={formData.leasing || false}
              onChange={(e) =>
                handleChange({ target: { name: "leasing", value: e.target.checked } })
              }
            /> Leasing (par année)
          </label>
          {formData.leasing && (
            
            <input
  type="text"
  name="montantLeasing"
  inputMode="numeric"
  value={formData.montantLeasing !== undefined ? formaterMilliers(formData.montantLeasing.toString()) : ""}
  onChange={(e) => {
    const digits = e.target.value.replace(/\D/g, "");
    const numericValue = digits === "" ? "" : Number(digits);
    setFormData({ ...formData, montantLeasing: numericValue });
    if (user) {
      const ref = doc(db, "dossiers", user.uid);
      updateDoc(ref, { montantLeasing: numericValue });
    }
  }}
  placeholder="CHF Montant"
/>


          )}<br />

          <label>
            <input
              type="checkbox"
              checked={formData.credits || false}
              onChange={(e) =>
                handleChange({ target: { name: "credits", value: e.target.checked } })
              }
            /> Crédits (par année)
          </label>
          {formData.credits && (
            
            <input
  type="text"
  name="montantCredits"
  inputMode="numeric"
  value={formData.montantCredits !== undefined ? formaterMilliers(formData.montantCredits.toString()) : ""}
  onChange={(e) => {
    const digits = e.target.value.replace(/\D/g, "");
    const numericValue = digits === "" ? "" : Number(digits);
    setFormData({ ...formData, montantCredits: numericValue });
    if (user) {
      const ref = doc(db, "dossiers", user.uid);
      updateDoc(ref, { montantCredits: numericValue });
    }
  }}
  placeholder="CHF Montant"
/>



          )}<br />

          <p>Poursuites sur les 3 dernières années ?</p>
          <label>
            <input
              type="radio"
              name="poursuites"
              value="non"
              checked={formData.poursuites === "non"}
              onChange={handleChange}
            /> Non
          </label>
          <label style={{ marginLeft: "20px" }}>
            <input
              type="radio"
              name="poursuites"
              value="oui"
              checked={formData.poursuites === "oui"}
              onChange={handleChange}
            /> Oui
          </label><br />

          {formData.poursuites === "oui" && (
            <div style={{ backgroundColor: "#ffe6e6", padding: "10px", marginTop: "10px" }}>
              <strong>❌ Votre dossier ne peut pas être poursuivi pour le moment.</strong><br />
              Veuillez revenir avec un extrait de poursuites vierge.
            </div>
          )}

          
{formData.ajouterDeuxiemePersonne && (
  <>
    <hr />
    <h4>
  Situation financière de{" "}
  {formData.conjointPrenom || ""} {formData.conjointNom || ""}
</h4>


    {/* Revenu brut conjoint */}
    <label>Revenu brut régulier par année</label><br />
    <input
      type="text"
      name="revenuBrutConjoint"
      inputMode="numeric"
      value={formData.revenuBrutConjoint !== undefined ? formaterMilliers(formData.revenuBrutConjoint.toString()) : ""}
      onChange={(e) => {
        const digits = e.target.value.replace(/\D/g, "");
        const numericValue = digits === "" ? "" : Number(digits);
        setFormData({ ...formData, revenuBrutConjoint: numericValue });
        if (user) {
          const ref = doc(db, "dossiers", user.uid);
          updateDoc(ref, { revenuBrutConjoint: numericValue });
        }
      }}
      placeholder="Revenu brut (conjoint)"
    /><br />

    {/* Moyenne des bonus conjoint */}
    <label>Moyenne des bonus des 3 dernières années</label><br />
    <input
      type="text"
      name="bonusMoyenneConjoint"
      inputMode="numeric"
      value={formData.bonusMoyenneConjoint !== undefined ? formaterMilliers(formData.bonusMoyenneConjoint.toString()) : ""}
      onChange={(e) => {
        const digits = e.target.value.replace(/\D/g, "");
        const numericValue = digits === "" ? "" : Number(digits);
        setFormData({ ...formData, bonusMoyenneConjoint: numericValue });
        if (user) {
          const ref = doc(db, "dossiers", user.uid);
          updateDoc(ref, { bonusMoyenneConjoint: numericValue });
        }
      }}
      placeholder="CHF Montant"
    /><br />

    {/* Revenu complémentaire conjoint */}
    <label>Revenu complémentaire régulier par année (p. ex. loyer, revenu accessoire)</label><br />
    <input
      type="text"
      name="revenuComplementaireConjoint"
      inputMode="numeric"
      value={formData.revenuComplementaireConjoint !== undefined ? formaterMilliers(formData.revenuComplementaireConjoint.toString()) : ""}
      onChange={(e) => {
        const digits = e.target.value.replace(/\D/g, "");
        const numericValue = digits === "" ? "" : Number(digits);
        setFormData({ ...formData, revenuComplementaireConjoint: numericValue });
        if (user) {
          const ref = doc(db, "dossiers", user.uid);
          updateDoc(ref, { revenuComplementaireConjoint: numericValue });
        }
      }}
      placeholder="CHF Montant"
    /><br />

    {/* Tu peux continuer à dupliquer les autres champs ici si besoin (leasing, pension, crédits...) */}
  
<p>Obligations exceptionnelles :</p>

{/* Pension alimentaire conjoint */}
<label>
  <input
    type="checkbox"
    checked={formData.pensionAlimentaireConjoint || false}
    onChange={(e) =>
      handleChange({ target: { name: "pensionAlimentaireConjoint", value: e.target.checked } })
    }
  /> Pension alimentaire (par année)
</label>
{formData.pensionAlimentaireConjoint && (
  <input
    type="text"
    name="montantPensionConjoint"
    inputMode="numeric"
    value={formData.montantPensionConjoint !== undefined ? formaterMilliers(formData.montantPensionConjoint.toString()) : ""}
    onChange={(e) => {
      const digits = e.target.value.replace(/\D/g, "");
      const numericValue = digits === "" ? "" : Number(digits);
      setFormData({ ...formData, montantPensionConjoint: numericValue });
      if (user) {
        const ref = doc(db, "dossiers", user.uid);
        updateDoc(ref, { montantPensionConjoint: numericValue });
      }
    }}
    placeholder="CHF Montant"
  />
)}<br />

{/* Leasing conjoint */}
<label>
  <input
    type="checkbox"
    checked={formData.leasingConjoint || false}
    onChange={(e) =>
      handleChange({ target: { name: "leasingConjoint", value: e.target.checked } })
    }
  /> Leasing (par année)
</label>
{formData.leasingConjoint && (
  <input
    type="text"
    name="montantLeasingConjoint"
    inputMode="numeric"
    value={formData.montantLeasingConjoint !== undefined ? formaterMilliers(formData.montantLeasingConjoint.toString()) : ""}
    onChange={(e) => {
      const digits = e.target.value.replace(/\D/g, "");
      const numericValue = digits === "" ? "" : Number(digits);
      setFormData({ ...formData, montantLeasingConjoint: numericValue });
      if (user) {
        const ref = doc(db, "dossiers", user.uid);
        updateDoc(ref, { montantLeasingConjoint: numericValue });
      }
    }}
    placeholder="CHF Montant"
  />
)}<br />

{/* Crédit conjoint */}
<label>
  <input
    type="checkbox"
    checked={formData.creditsConjoint || false}
    onChange={(e) =>
      handleChange({ target: { name: "creditsConjoint", value: e.target.checked } })
    }
  /> Crédit (par année)
</label>
{formData.creditsConjoint && (
  <input
    type="text"
    name="montantCreditsConjoint"
    inputMode="numeric"
    value={formData.montantCreditsConjoint !== undefined ? formaterMilliers(formData.montantCreditsConjoint.toString()) : ""}
    onChange={(e) => {
      const digits = e.target.value.replace(/\D/g, "");
      const numericValue = digits === "" ? "" : Number(digits);
      setFormData({ ...formData, montantCreditsConjoint: numericValue });
      if (user) {
        const ref = doc(db, "dossiers", user.uid);
        updateDoc(ref, { montantCreditsConjoint: numericValue });
      }
    }}
    placeholder="CHF Montant"
  />
)}<br />

<p>Poursuites sur les 3 dernières années ?</p>
<label>
  <input
    type="radio"
    name="poursuitesConjoint"
    value="non"
    checked={formData.poursuitesConjoint === "non"}
    onChange={handleChange}
  /> Non
</label>
<label style={{ marginLeft: "20px" }}>
  <input
    type="radio"
    name="poursuitesConjoint"
    value="oui"
    checked={formData.poursuitesConjoint === "oui"}
    onChange={handleChange}
  /> Oui
</label><br />



{formData.poursuitesConjoint === "oui" && (
  <div style={{ backgroundColor: "#ffe6e6", padding: "10px", marginTop: "10px" }}>
    <strong>❌ Le dossier ne peut pas être poursuivi pour le moment (conjoint).</strong><br />
    Veuillez revenir avec un extrait de poursuites vierge pour le/la conjoint·e.
  </div>
    )}
</>
      )}
      </>
)}

      {step === 3 && (
        <>

    <label>Prix d'achat</label><br />
        <input
  type="text"
  name="prixAchat"
  inputMode="numeric"
  value={formData.prixAchat !== undefined ? formaterMilliers(formData.prixAchat.toString()) : ""}
  onChange={(e) => {
    const digits = e.target.value.replace(/\D/g, "");
    const numericValue = digits === "" ? "" : Number(digits);
    setFormData({ ...formData, prixAchat: numericValue });
    if (user) {
      const ref = doc(db, "dossiers", user.uid);
      updateDoc(ref, { prixAchat: numericValue });
    }
  }}
  placeholder="CHF Montant"
/>

          
          
          <br />

          <label>
            <input
              type="checkbox"
              checked={formData.avecFraisSup || false}
              onChange={(e) => handleChange({ target: { name: "avecFraisSup", value: e.target.checked } })}
            /> Frais supplémentaires (rénovations, plus-values, etc.)
          </label><br />

          {formData.avecFraisSup && (


            <input
  type="text"
  name="fraisSupp"
  inputMode="numeric"
  value={formData.fraisSupp !== undefined ? formaterMilliers(formData.fraisSupp.toString()) : ""}
  onChange={(e) => {
    const digits = e.target.value.replace(/\D/g, "");
    const numericValue = digits === "" ? "" : Number(digits);
    setFormData({ ...formData, fraisSupp: numericValue });
    if (user) {
      const ref = doc(db, "dossiers", user.uid);
      updateDoc(ref, { fraisSupp: numericValue });
    }
  }}
  placeholder="Frais supplémentaires"
/>





          )}<br />

          <p>
  Coût total de l’investissement :{" "}
  <strong>
    CHF {formaterMilliers((Number(formData.prixAchat || 0) + (formData.avecFraisSup ? Number(formData.fraisSupp || 0) : 0)).toString())}
  </strong>
</p>

          <h4>Composition des fonds propres</h4>

    <label>Avoirs en compte, titres</label><br />
          <input
  type="text"
  name="avoirsCompte"
  inputMode="numeric"
  value={formData.avoirsCompte !== undefined ? formaterMilliers(formData.avoirsCompte.toString()) : ""}
  onChange={(e) => {
    const digits = e.target.value.replace(/\D/g, "");
    const numericValue = digits === "" ? "" : Number(digits);
    setFormData({ ...formData, avoirsCompte: numericValue });
    if (user) {
      const ref = doc(db, "dossiers", user.uid);
      updateDoc(ref, { avoirsCompte: numericValue });
    }
  }}
  placeholder="Montant CHF"
/>      
          <br />

          
    <label>Versement anticipé 3e pilier</label><br />
          <input
  type="text"
  name="versement3ePilier"
  inputMode="numeric"
  value={formData.versement3ePilier !== undefined ? formaterMilliers(formData.versement3ePilier.toString()) : ""}
  onChange={(e) => {
    const digits = e.target.value.replace(/\D/g, "");
    const numericValue = digits === "" ? "" : Number(digits);
    setFormData({ ...formData, versement3ePilier: numericValue });
    if (user) {
      const ref = doc(db, "dossiers", user.uid);
      updateDoc(ref, { versement3ePilier: numericValue });
    }
  }}
  placeholder="Montant CHF"
/>

<br />


          <label>
            <input
              type="checkbox"
              checked={formData.utilise2ePilier || false}
              onChange={(e) =>
                handleChange({ target: { name: "utilise2ePilier", value: e.target.checked } })
              }
            /> Versement anticipé 2e pilier
          </label><br />

          {formData.utilise2ePilier && (
            <>
            <input
  type="text"
  name="versement2ePilier"
  inputMode="numeric"
  value={formData.versement2ePilier !== undefined ? formaterMilliers(formData.versement2ePilier.toString()) : ""}
  onChange={(e) => {
    const digits = e.target.value.replace(/\D/g, "");
    const numericValue = digits === "" ? "" : Number(digits);
    setFormData({ ...formData, versement2ePilier: numericValue });
    if (user) {
      const ref = doc(db, "dossiers", user.uid);
      updateDoc(ref, { versement2ePilier: numericValue });
    }
  }}
  placeholder="Montant CHF"
/>

<br />



            </>
          )}

          <label>
            <input
              type="checkbox"
              checked={formData.pretTiers || false}
              onChange={(e) =>
                handleChange({ target: { name: "pretTiers", value: e.target.checked } })
              }
            /> Prêt de tiers
          </label><br />
          {formData.pretTiers && (
            <>
              
            <input
  type="text"
  name="montantPretTiers"
  inputMode="numeric"
  value={formData.montantPretTiers !== undefined ? formaterMilliers(formData.montantPretTiers.toString()) : ""}
  onChange={(e) => {
    const digits = e.target.value.replace(/\D/g, "");
    const numericValue = digits === "" ? "" : Number(digits);
    setFormData({ ...formData, montantPretTiers: numericValue });
    if (user) {
      const ref = doc(db, "dossiers", user.uid);
      updateDoc(ref, { montantPretTiers: numericValue });
    }
  }}
  placeholder="CHF Montant"
/>

              
              <br />
              <input
                name="nomPreteur"
                value={formData.nomPreteur || ""}
                onChange={handleChange}
                placeholder="Prêteur(s)"
              /><br />
            </>
          )}

          <label>
            <input
              type="checkbox"
              checked={formData.avanceHoirie || false}
              onChange={(e) =>
                handleChange({ target: { name: "avanceHoirie", value: e.target.checked } })
              }
            /> Avance d’hoirie
          </label><br />
          {formData.avanceHoirie && (
            
            <input
  type="text"
  name="montantHoirie"
  inputMode="numeric"
  value={formData.montantHoirie !== undefined ? formaterMilliers(formData.montantHoirie.toString()) : ""}
  onChange={(e) => {
    const digits = e.target.value.replace(/\D/g, "");
    const numericValue = digits === "" ? "" : Number(digits);
    setFormData({ ...formData, montantHoirie: numericValue });
    if (user) {
      const ref = doc(db, "dossiers", user.uid);
      updateDoc(ref, { montantHoirie: numericValue });
    }
  }}
  placeholder="CHF Montant"
/>

          )}<br/>
          
          

          <label>
            <input
              type="checkbox"
              checked={formData.donation || false}
              onChange={(e) =>
                handleChange({ target: { name: "donation", value: e.target.checked } })
              }
            /> Donation
          </label><br />
          {formData.donation && (

            <input
  type="text"
  name="montantDonation"
  inputMode="numeric"
  value={formData.montantDonation !== undefined ? formaterMilliers(formData.montantDonation.toString()) : ""}
  onChange={(e) => {
    const digits = e.target.value.replace(/\D/g, "");
    const numericValue = digits === "" ? "" : Number(digits);
    setFormData({ ...formData, montantDonation: numericValue });
    if (user) {
      const ref = doc(db, "dossiers", user.uid);
      updateDoc(ref, { montantDonation: numericValue });
    }
  }}
  placeholder="CHF Montant"
/>


          )}<br />

          <p>
        Total fonds propres :{" "}
        <strong>
          CHF {formaterMilliers((
            Number(formData.avoirsCompte || 0) +
            Number(formData.versement3ePilier || 0) +
            (formData.utilise2ePilier ? Number(formData.versement2ePilier || 0) : 0) +
            (formData.pretTiers ? Number(formData.montantPretTiers || 0) : 0) +
            (formData.avanceHoirie ? Number(formData.montantHoirie || 0) : 0) +
            (formData.donation ? Number(formData.montantDonation || 0) : 0)
          ).toString())}
        </strong>
      </p>

      <p>
        Montant du prêt hypothécaire souhaité :{" "}
        <strong>
          CHF {formaterMilliers((
            Number(formData.prixAchat || 0) +
            (formData.avecFraisSup ? Number(formData.fraisSupp || 0) : 0) -
            (
              Number(formData.avoirsCompte || 0) +
              Number(formData.versement3ePilier || 0) +
              (formData.utilise2ePilier ? Number(formData.versement2ePilier || 0) : 0) +
              (formData.pretTiers ? Number(formData.montantPretTiers || 0) : 0) +
              (formData.avanceHoirie ? Number(formData.montantHoirie || 0) : 0) +
              (formData.donation ? Number(formData.montantDonation || 0) : 0)
            )
          ).toString())}
        </strong>
      </p>

          <label>Date de versement souhaitée :</label><br />
          <input
            type="date"
            name="dateVersementSouhaite"
            value={formData.dateVersementSouhaite || ""}
            onChange={handleChange}
            min={new Date().toISOString().split("T")[0]}
          /><br />

<hr />
<button onClick={calculerValidationFondsPropres}>🧮 Calculer la faisabilité</button>
{calculEffectue && (
  <p style={{ color: erreurFondPropre ? 'red' : 'green' }}>
    {erreurFondPropre || '✅ Les règles de fonds propres sont respectées. Le dossier est faisable.'}
  </p>
)}

        </>

        
      )}
      {step === 4 && (
        <>
        <label>Type de bien</label><br />
          <select name="typeBien" value={formData.typeBien || ""} onChange={handleChange}>
            <option value="">-- Type de bien --</option>
            <option value="maison">Maison individuelle</option>
            <option value="appartement">Appartement en PPE (résidence principale)</option>
            <option value="immeuble">Immeuble de rendement</option>
          </select><br />

          {formData.typeBien === "immeuble" && (
            <>
            <label>Part habitation – Revenus locatifs nets (CHF / an)</label><br />
              <input
                name="revenuLocatifHabitation"
                value={formData.revenuLocatifHabitation || ""}
                onChange={handleChange}
                placeholder="CHF / an"
              /><br />
            <label>Part bureaux/commerces – Revenus locatifs nets (CHF / an)</label><br />
              <input
                name="revenuLocatifCommerces"
                value={formData.revenuLocatifCommerces || ""}
                onChange={handleChange}
                placeholder="CHF / an"
              /><br />
            </>
          )}
        <label>Rue et numéro</label><br />
          <input name="adresseBien" value={formData.adresseBien || ""} onChange={handleChange} placeholder="Rue et numéro" /><br />
          <label>NPA / Localité</label><br />
          <input name="npaLocaliteBien" value={formData.npaLocaliteBien || ""} onChange={handleChange} placeholder="NPA / Localité" /><br />

        

         

          
          <label>Année de construction :</label><br />
          <select name="anneeConstruction" value={formData.anneeConstruction || ""} onChange={handleChange}>
            <option value="">-- Choisir --</option>
            {Array.from({ length: new Date().getFullYear() - 1899 }, (_, i) => 1900 + i).map((year) => (
              <option key={year} value={year}>{year}</option>
            ))}
          </select><br />

          {/* Estimation hédoniste après année de construction */}
      <label>Valeur du bien</label><br />
      <input
        name="valeurBien"
        value={formaterMilliers((formData.prixAchat || 0).toString())}
        readOnly
      /><br />

      <label>Surface habitable (en m²)</label><br />
      <input
        name="surfaceHabitable"
        inputMode="numeric"
        value={formData.surfaceHabitable || ""}
        onChange={handleChange}
        placeholder="Surface habitable en m²"
      /><br />

      <label>Surface du terrain (en m²)</label><br />
      <input
        name="surfaceTerrain"
        inputMode="numeric"
        value={formData.surfaceTerrain || ""}
        onChange={handleChange}
        placeholder="Surface du terrain en m²"
      /><br />

      <label>Nombre de pièces</label><br />
      <input
        name="nombrePieces"
        inputMode="numeric"
        value={formData.nombrePieces || ""}
        onChange={handleChange}
        placeholder="Nombre de pièces"
      /><br />

      <label>État général du bien</label><br />
      <select name="etatBien" value={formData.etatBien || ""} onChange={handleChange}>
        <option value="">-- Choisir --</option>
        <option value="neuf">Neuf / rénové</option>
        <option value="bon">Bon état</option>
        <option value="moyen">Moyen</option>
        <option value="à rénover">À rénover</option>
      </select><br />

      <label>Vue / Emplacement</label><br />
      <select name="emplacementBien" value={formData.emplacementBien || ""} onChange={handleChange}>
        <option value="">-- Choisir --</option>
        <option value="exceptionnel">Exceptionnel</option>
        <option value="très bon">Très bon</option>
        <option value="standard">Standard</option>
        <option value="bruyant ou faible">Moins favorable</option>
      </select><br />

      <label>Type de quartier</label><br />
      <select name="typeQuartier" value={formData.typeQuartier || ""} onChange={handleChange}>
        <option value="">-- Choisir --</option>
        <option value="residence">Zone résidentielle calme</option>
        <option value="centre">Centre-ville</option>
        <option value="mixte">Mixte (habitations + commerces)</option>
        <option value="industriel">Zone industrielle</option>
      </select><br />

      <label>Le bien possède-t-il une terrasse ?</label><br />
      <select name="terrasse" value={formData.terrasse || ""} onChange={handleChange}>
        <option value="">-- Choisir --</option>
        <option value="oui">Oui</option>
        <option value="non">Non</option>
      </select><br />

      {formData.terrasse === "oui" && (
        <>
          <label>Surface de la terrasse (en m²)</label><br />
          <input
            name="surfaceTerrasse"
            inputMode="numeric"
            value={formData.surfaceTerrasse || ""}
            onChange={handleChange}
            placeholder="Surface en m²"
          /><br />
        </>
      )}

      <label>Le bien possède-t-il une piscine ?</label><br />
      <select name="piscine" value={formData.piscine || ""} onChange={handleChange}>
        <option value="">-- Choisir --</option>
        <option value="oui">Oui</option>
        <option value="non">Non</option>
      </select><br />

      <label>Le bien possède-t-il un garage ?</label><br />
      <select name="garage" value={formData.garage || ""} onChange={handleChange}>
        <option value="">-- Choisir --</option>
        <option value="oui">Oui</option>
        <option value="non">Non</option>
      </select><br />

      <label>Le bien possède-t-il une place de parc ?</label><br />
      <select name="placeParc" value={formData.placeParc || ""} onChange={handleChange}>
        <option value="">-- Choisir --</option>
        <option value="oui">Oui</option>
        <option value="non">Non</option>
      </select><br />

      {formData.placeParc === "oui" && (
        <>
          <label>Nombre de places de parc</label><br />
          <input
            name="nbPlacesParc"
            inputMode="numeric"
            value={formData.nbPlacesParc || ""}
            onChange={handleChange}
            placeholder="Nombre de places"
          /><br />
        </>
      )}

      <label>Le bien possède-t-il un jardin ?</label><br />
      <select name="jardin" value={formData.jardin || ""} onChange={handleChange}>
        <option value="">-- Choisir --</option>
        <option value="oui">Oui</option>
        <option value="non">Non</option>
      </select><br />

      {/* ... suite du formulaire ... */}

          <p>Type de chauffage :</p>
          {["Mazout", "Gaz", "Sonde géothermique / PAC", "PAC air / eau", "Pellets / copeaux", "Électrique", "Chauffage à distance"].map((type, idx) => {
            const key = `chauffage_${idx}`;
            return (
              <label key={key}>
                <input type="checkbox" name={key} checked={formData[key] || false} onChange={(e) => handleChange({ target: { name: key, value: e.target.checked } })} /> {type}
              </label>
            );
          })}<br />

          <label><input type="checkbox" name="photovoltaique" checked={formData.photovoltaique || false} onChange={(e) => handleChange({ target: { name: "photovoltaique", value: e.target.checked } })} /> Photovoltaïque</label><br />
          <label><input type="checkbox" name="solaireThermique" checked={formData.solaireThermique || false} onChange={(e) => handleChange({ target: { name: "solaireThermique", value: e.target.checked } })} /> Panneaux solaires (thermique)</label><br />

          <label>Distribution de la chaleur :</label><br />
          <select name="distributionChaleur" value={formData.distributionChaleur || ""} onChange={handleChange}>
            <option value="">-- Choisir --</option>
            <option value="sol">Chauffage par le sol</option>
            <option value="radiateurs">Radiateurs / corps de chauffe</option>
            <option value="fourneau">Fourneau central</option>
          </select><br />

          <label>Façade (isolation thermique) :</label><br />
          <select name="facadeIsolation" value={formData.facadeIsolation || ""} onChange={handleChange}>
            <option value="">-- Choisir --</option>
            <option value="toutes">Toutes les façades</option>
            <option value="partielle">Façade(s) isolée(s)</option>
          </select><br />

          <label>Toit :</label><br />
          <select name="toit" value={formData.toit || ""} onChange={handleChange}>
            <option value="">-- Choisir --</option>
            <option value="entier">Entièrement neuf / rénové</option>
            <option value="partiel">Partiellement neuf / rénové</option>
          </select><br />

          <label>Fenêtres :</label><br />
          <select name="fenetres" value={formData.fenetres || ""} onChange={handleChange}>
            <option value="">-- Choisir --</option>
            <option value="triple">Triple vitrage pour toutes les fenêtres</option>
            <option value="double">Double vitrage pour toutes les fenêtres</option>
            <option value="nombre">Je souhaite indiquer le nombre</option>
          </select><br />

          {formData.fenetres === "nombre" && (
            <>
              <input name="nbTriple" value={formData.nbTriple || ""} onChange={handleChange} placeholder="Nombre de triples vitrages" /><br />
              <input name="nbDouble" value={formData.nbDouble || ""} onChange={handleChange} placeholder="Nombre de doubles vitrages" /><br />
            </>
          )}

          <label>Certificat énergétique :</label><br />
          <select name="certificatEnergie" value={formData.certificatEnergie || ""} onChange={handleChange}>
            <option value="">-- Choisir --</option>
            <option value="aucun">Pas d’information</option>
            <option value="cecb">CECB</option>
            <option value="cecbplus">CECB Plus</option>
            <option value="minergie">Minergie</option>
            <option value="minergieP">Minergie P</option>
            <option value="minergieA">Minergie A</option>
            <option value="minergieEco">Minergie Eco</option>
            <option value="snbs">SNBS</option>
          </select><br />
          {formData.certificatEnergie && formData.certificatEnergie !== "aucun" && (
            <p>📄 Vous devrez fournir le certificat énergétique dans les documents à fournir.</p>
          )}
        </>
      )}

      {/* Navigation + soumission */}
      <div style={{ marginTop: "20px" }}>
        {step > 1 && <button onClick={prevStep}>⬅ Retour</button>}
        {step < 4 && formData.poursuites !== "oui" && etape3Valide && (
  <button
    onClick={() => {
      if (step === 3 && !etape3Valide) {
        alert("⚠️ Merci de cliquer sur le bouton 🧮 Calculer et vérifier vos fonds propres avant de continuer.");
        return;
      }
      nextStep();
    }}
    style={{ marginLeft: 10 }}
  >
    Suivant ➡
  </button>
)}

        {step === 4 && (
          <button style={{ marginLeft: 10, background: "green", color: "white" }} onClick={handleSoumission}>
            ✅ Soumettre le dossier
          </button>
        )}
      </div>
    </div>
  );
}

export default FormulaireDossier;
