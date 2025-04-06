// src/FormulaireDossier.js

import React, { useEffect, useState } from "react";
import { doc, getDoc, updateDoc, serverTimestamp } from "firebase/firestore";
import { db } from "./firebase-config";
import { useAuth } from "./AuthContext";
import {
    Grid,
    TextField,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    FormControlLabel,
    Checkbox,
    Button,
    Box,
    Typography
  } from "@mui/material";
  
  



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
          <TextField
        label="Prénom"
        name="prenom"
        value={formData.prenom || ""}
        onChange={handleChange}
        fullWidth
        margin="normal"
        />

        <TextField
      label="Nom"
      name="nom"
      value={formData.nom || ""}
      onChange={handleChange}
      fullWidth
      margin="normal"
        />
          <TextField
      label="Rue et numéro"
      name="rueNumero"
      value={formData.rueNumero || ""}
      onChange={handleChange}
      fullWidth
      margin="normal"
    />
          <TextField
      label="NPA / Localité"
      name="npaLocalite"
      value={formData.npaLocalite || ""}
      onChange={handleChange}
      fullWidth
      margin="normal"
    />
          <TextField
      label="Téléphone"
      name="telephone"
      value={formData.telephone || ""}
      onChange={handleChange}
      fullWidth
      margin="normal"
    />
          <TextField
      label="Date de naissance"
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
      fullWidth
      margin="normal"
      placeholder="JJ.MM.AAAA"
    />

<FormControl fullWidth margin="normal">
  <InputLabel>Nationalité</InputLabel>
  <Select
    label="Nationalité"
    name="nationalite"
    value={formData.nationalite || ""}
    onChange={handleChange}
  >
    <MenuItem value="">-- Nationalité --</MenuItem>
    <MenuItem value="Suisse">Suisse</MenuItem>
  <MenuItem value="Allemange">Allemagne</MenuItem>
  <MenuItem value="Italie">Italie</MenuItem>
  <MenuItem value="France">France</MenuItem>
  <MenuItem value="Afghanistan">Afghanistan</MenuItem>
    <MenuItem value="Afrique du Sud">Afrique du Sud</MenuItem>
    <MenuItem value="Albanie">Albanie</MenuItem>
    <MenuItem value="Algérie">Algérie</MenuItem>
    <MenuItem value="Andorre">Andorre</MenuItem>
    <MenuItem value="Angola">Angola</MenuItem>
    <MenuItem value="Antigua-et-Barbuda">Antigua-et-Barbuda</MenuItem>
    <MenuItem value="Arabie Saoudite">Arabie Saoudite</MenuItem>
    <MenuItem value="Argentine">Argentine</MenuItem>
    <MenuItem value="Arménie">Arménie</MenuItem>
    <MenuItem value="Australie">Australie</MenuItem>
    <MenuItem value="Autriche">Autriche</MenuItem>
    <MenuItem value="Azerbaïdjan">Azerbaïdjan</MenuItem>
    <MenuItem value="Bahamas">Bahamas</MenuItem>
    <MenuItem value="Bahreïn">Bahreïn</MenuItem>
    <MenuItem value="Bangladesh">Bangladesh</MenuItem>
    <MenuItem value="Barbade">Barbade</MenuItem>
    <MenuItem value="Belgique">Belgique</MenuItem>
    <MenuItem value="Belize">Belize</MenuItem>
    <MenuItem value="Bénin">Bénin</MenuItem>
    <MenuItem value="Bhoutan">Bhoutan</MenuItem>
    <MenuItem value="Biélorussie">Biélorussie</MenuItem>
    <MenuItem value="Birmanie">Birmanie</MenuItem>
    <MenuItem value="Bolivie">Bolivie</MenuItem>
    <MenuItem value="Bosnie-Herzégovine">Bosnie-Herzégovine</MenuItem>
    <MenuItem value="Botswana">Botswana</MenuItem>
    <MenuItem value="Brésil">Brésil</MenuItem>
    <MenuItem value="Brunei">Brunei</MenuItem>
    <MenuItem value="Bulgarie">Bulgarie</MenuItem>
    <MenuItem value="Burkina Faso">Burkina Faso</MenuItem>
    <MenuItem value="Burundi">Burundi</MenuItem>
    <MenuItem value="Cambodge">Cambodge</MenuItem>
    <MenuItem value="Cameroun">Cameroun</MenuItem>
    <MenuItem value="Canada">Canada</MenuItem>
    <MenuItem value="Cap-Vert">Cap-Vert</MenuItem>
    <MenuItem value="Chili">Chili</MenuItem>
    <MenuItem value="Chine">Chine</MenuItem>
    <MenuItem value="Chypre">Chypre</MenuItem>
    <MenuItem value="Colombie">Colombie</MenuItem>
    <MenuItem value="Comores">Comores</MenuItem>
    <MenuItem value="Congo (Brazzaville)">Congo (Brazzaville)</MenuItem>
    <MenuItem value="Congo (Kinshasa)">Congo (Kinshasa)</MenuItem>
    <MenuItem value="Corée du Nord">Corée du Nord</MenuItem>
    <MenuItem value="Corée du Sud">Corée du Sud</MenuItem>
    <MenuItem value="Costa Rica">Costa Rica</MenuItem>
    <MenuItem value="Côte d'Ivoire">Côte d'Ivoire</MenuItem>
    <MenuItem value="Croatie">Croatie</MenuItem>
    <MenuItem value="Cuba">Cuba</MenuItem>
    <MenuItem value="Danemark">Danemark</MenuItem>
    <MenuItem value="Djibouti">Djibouti</MenuItem>
    <MenuItem value="Dominique">Dominique</MenuItem>
    <MenuItem value="Égypte">Égypte</MenuItem>
    <MenuItem value="Émirats Arabes Unis">Émirats Arabes Unis</MenuItem>
    <MenuItem value="Équateur">Équateur</MenuItem>
    <MenuItem value="Érythrée">Érythrée</MenuItem>
    <MenuItem value="Espagne">Espagne</MenuItem>
    <MenuItem value="Estonie">Estonie</MenuItem>
    <MenuItem value="Eswatini">Eswatini</MenuItem>
    <MenuItem value="États-Unis">États-Unis</MenuItem>
    <MenuItem value="Éthiopie">Éthiopie</MenuItem>
    <MenuItem value="Fidji">Fidji</MenuItem>
    <MenuItem value="Finlande">Finlande</MenuItem>
    <MenuItem value="Gabon">Gabon</MenuItem>
    <MenuItem value="Gambie">Gambie</MenuItem>
    <MenuItem value="Géorgie">Géorgie</MenuItem>
    <MenuItem value="Ghana">Ghana</MenuItem>
    <MenuItem value="Grèce">Grèce</MenuItem>
    <MenuItem value="Grenade">Grenade</MenuItem>
    <MenuItem value="Guatemala">Guatemala</MenuItem>
    <MenuItem value="Guinée">Guinée</MenuItem>
    <MenuItem value="Guinée équatoriale">Guinée équatoriale</MenuItem>
    <MenuItem value="Guinée-Bissau">Guinée-Bissau</MenuItem>
    <MenuItem value="Guyana">Guyana</MenuItem>
    <MenuItem value="Haïti">Haïti</MenuItem>
    <MenuItem value="Honduras">Honduras</MenuItem>
    <MenuItem value="Hongrie">Hongrie</MenuItem>
    <MenuItem value="Inde">Inde</MenuItem>
    <MenuItem value="Indonésie">Indonésie</MenuItem>
    <MenuItem value="Irak">Irak</MenuItem>
    <MenuItem value="Iran">Iran</MenuItem>
    <MenuItem value="Irlande">Irlande</MenuItem>
    <MenuItem value="Islande">Islande</MenuItem>
    <MenuItem value="Israël">Israël</MenuItem>
    <MenuItem value="Jamaïque">Jamaïque</MenuItem>
    <MenuItem value="Japon">Japon</MenuItem>
    <MenuItem value="Jordanie">Jordanie</MenuItem>
    <MenuItem value="Kazakhstan">Kazakhstan</MenuItem>
    <MenuItem value="Kenya">Kenya</MenuItem>
    <MenuItem value="Kirghizistan">Kirghizistan</MenuItem>
    <MenuItem value="Kiribati">Kiribati</MenuItem>
    <MenuItem value="Koweït">Koweït</MenuItem>
    <MenuItem value="Laos">Laos</MenuItem>
    <MenuItem value="Lesotho">Lesotho</MenuItem>
    <MenuItem value="Lettonie">Lettonie</MenuItem>
    <MenuItem value="Liban">Liban</MenuItem>
    <MenuItem value="Libéria">Libéria</MenuItem>
    <MenuItem value="Libye">Libye</MenuItem>
    <MenuItem value="Liechtenstein">Liechtenstein</MenuItem>
    <MenuItem value="Lituanie">Lituanie</MenuItem>
    <MenuItem value="Luxembourg">Luxembourg</MenuItem>
    <MenuItem value="Macédoine du Nord">Macédoine du Nord</MenuItem>
    <MenuItem value="Madagascar">Madagascar</MenuItem>
    <MenuItem value="Malaisie">Malaisie</MenuItem>
    <MenuItem value="Malawi">Malawi</MenuItem>
    <MenuItem value="Maldives">Maldives</MenuItem>
    <MenuItem value="Mali">Mali</MenuItem>
    <MenuItem value="Malte">Malte</MenuItem>
    <MenuItem value="Maroc">Maroc</MenuItem>
    <MenuItem value="Îles Marshall">Îles Marshall</MenuItem>
    <MenuItem value="Maurice">Maurice</MenuItem>
    <MenuItem value="Mauritanie">Mauritanie</MenuItem>
    <MenuItem value="Mexique">Mexique</MenuItem>
    <MenuItem value="Micronésie">Micronésie</MenuItem>
    <MenuItem value="Moldavie">Moldavie</MenuItem>
    <MenuItem value="Monaco">Monaco</MenuItem>
    <MenuItem value="Mongolie">Mongolie</MenuItem>
    <MenuItem value="Monténégro">Monténégro</MenuItem>
    <MenuItem value="Mozambique">Mozambique</MenuItem>
    <MenuItem value="Myanmar (Birmanie)">Myanmar (Birmanie)</MenuItem>
    <MenuItem value="Namibie">Namibie</MenuItem>
    <MenuItem value="Nauru">Nauru</MenuItem>
    <MenuItem value="Népal">Népal</MenuItem>
    <MenuItem value="Nicaragua">Nicaragua</MenuItem>
    <MenuItem value="Niger">Niger</MenuItem>
    <MenuItem value="Nigéria">Nigéria</MenuItem>
    <MenuItem value="Norvège">Norvège</MenuItem>
    <MenuItem value="Nouvelle-Zélande">Nouvelle-Zélande</MenuItem>
    <MenuItem value="Oman">Oman</MenuItem>
    <MenuItem value="Ouganda">Ouganda</MenuItem>
    <MenuItem value="Ouzbékistan">Ouzbékistan</MenuItem>
    <MenuItem value="Pakistan">Pakistan</MenuItem>
    <MenuItem value="Palaos">Palaos</MenuItem>
    <MenuItem value="Palestine">Palestine</MenuItem>
    <MenuItem value="Panama">Panama</MenuItem>
    <MenuItem value="Papouasie-Nouvelle-Guinée">Papouasie-Nouvelle-Guinée</MenuItem>
    <MenuItem value="Paraguay">Paraguay</MenuItem>
    <MenuItem value="Pays-Bas">Pays-Bas</MenuItem>
    <MenuItem value="Pérou">Pérou</MenuItem>
    <MenuItem value="Philippines">Philippines</MenuItem>
    <MenuItem value="Pologne">Pologne</MenuItem>
    <MenuItem value="Portugal">Portugal</MenuItem>
    <MenuItem value="Qatar">Qatar</MenuItem>
    <MenuItem value="République centrafricaine">République centrafricaine</MenuItem>
    <MenuItem value="République démocratique du Congo">République démocratique du Congo</MenuItem>
    <MenuItem value="République dominicaine">République dominicaine</MenuItem>
    <MenuItem value="République tchèque">République tchèque</MenuItem>
    <MenuItem value="Roumanie">Roumanie</MenuItem>
    <MenuItem value="Royaume-Uni">Royaume-Uni</MenuItem>
    <MenuItem value="Russie">Russie</MenuItem>
    <MenuItem value="Rwanda">Rwanda</MenuItem>
    <MenuItem value="Saint-Christophe-et-Niévès">Saint-Christophe-et-Niévès</MenuItem>
    <MenuItem value="Saint-Marin">Saint-Marin</MenuItem>
    <MenuItem value="Saint-Vincent-et-les-Grenadines">Saint-Vincent-et-les-Grenadines</MenuItem>
    <MenuItem value="Sainte-Lucie">Sainte-Lucie</MenuItem>
    <MenuItem value="Salomon">Salomon</MenuItem>
    <MenuItem value="Salvador">Salvador</MenuItem>
    <MenuItem value="Samoa">Samoa</MenuItem>
    <MenuItem value="São Tomé-et-Principe">São Tomé-et-Principe</MenuItem>
    <MenuItem value="Sénégal">Sénégal</MenuItem>
    <MenuItem value="Serbie">Serbie</MenuItem>
    <MenuItem value="Seychelles">Seychelles</MenuItem>
    <MenuItem value="Sierra Leone">Sierra Leone</MenuItem>
    <MenuItem value="Singapour">Singapour</MenuItem>
    <MenuItem value="Slovaquie">Slovaquie</MenuItem>
    <MenuItem value="Slovénie">Slovénie</MenuItem>
    <MenuItem value="Somalie">Somalie</MenuItem>
    <MenuItem value="Soudan">Soudan</MenuItem>
    <MenuItem value="Soudan du Sud">Soudan du Sud</MenuItem>
    <MenuItem value="Sri Lanka">Sri Lanka</MenuItem>
    <MenuItem value="Suède">Suède</MenuItem>
    <MenuItem value="Suriname">Suriname</MenuItem>
    <MenuItem value="Syrie">Syrie</MenuItem>
    <MenuItem value="Tadjikistan">Tadjikistan</MenuItem>
    <MenuItem value="Tanzanie">Tanzanie</MenuItem>
    <MenuItem value="Tchad">Tchad</MenuItem>
    <MenuItem value="Thaïlande">Thaïlande</MenuItem>
    <MenuItem value="Timor oriental">Timor oriental</MenuItem>
    <MenuItem value="Togo">Togo</MenuItem>
    <MenuItem value="Tonga">Tonga</MenuItem>
    <MenuItem value="Trinité-et-Tobago">Trinité-et-Tobago</MenuItem>
    <MenuItem value="Tunisie">Tunisie</MenuItem>
    <MenuItem value="Turkménistan">Turkménistan</MenuItem>
    <MenuItem value="Turquie">Turquie</MenuItem>
    <MenuItem value="Tuvalu">Tuvalu</MenuItem>
    <MenuItem value="Ukraine">Ukraine</MenuItem>
    <MenuItem value="Uruguay">Uruguay</MenuItem>
    <MenuItem value="Vanuatu">Vanuatu</MenuItem>
    <MenuItem value="Vatican">Vatican</MenuItem>
    <MenuItem value="Venezuela">Venezuela</MenuItem>
    <MenuItem value="Viêt Nam">Viêt Nam</MenuItem>
    <MenuItem value="Yémen">Yémen</MenuItem>
    <MenuItem value="Zambie">Zambie</MenuItem>
    <MenuItem value="Zimbabwe">Zimbabwe</MenuItem>
    
  </Select>
</FormControl>


{formData.nationalite && formData.nationalite !== "Suisse" && (
  <>
  <FormControl fullWidth margin="normal">
  <InputLabel id="permisSejour-label">Permis de séjour</InputLabel>
  <Select
    labelId="permisSejour-label"
    id="permisSejour"
    name="permisSejour"
    value={formData.permisSejour || ""}
    onChange={handleChange}
    label="Permis de séjour"
  >
    <MenuItem value=""><em>-- Sélectionner le permis --</em></MenuItem>
    <MenuItem value="B">Permis B</MenuItem>
    <MenuItem value="C">Permis C</MenuItem>
    <MenuItem value="L">Permis L</MenuItem>
    <MenuItem value="G">Permis G</MenuItem>
  </Select>
</FormControl>

  </>
)}
<FormControl fullWidth margin="normal">


  <InputLabel>État civil</InputLabel>
  <Select
    label="État civil"
    name="etatCivil"
    value={formData.etatCivil || ""}
    onChange={(e) => {
      const value = e.target.value;
      const updatedData = { ...formData, etatCivil: value };
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
    <MenuItem value="">-- État civil --</MenuItem>
    <MenuItem value="celibataire">Célibataire</MenuItem>
    <MenuItem value="marie">Marié(e)</MenuItem>
    <MenuItem value="divorce">Divorcé(e)</MenuItem>
    <MenuItem value="veuf">Veuf / Veuve</MenuItem>
  </Select>
</FormControl>


    <TextField
  label="Formation"
  name="formation"
  value={formData.formation || ""}
  onChange={handleChange}
  fullWidth
  margin="normal"
/>

<TextField
  label="Profession"
  name="profession"
  value={formData.profession || ""}
  onChange={handleChange}
  fullWidth
  margin="normal"
/>

<TextField
  label="Fonction (Employé, Directeur, etc.)"
  name="fonction"
  value={formData.fonction || ""}
  onChange={handleChange}
  fullWidth
  margin="normal"
/>

<TextField
  label="Employeur"
  name="employeur"
  value={formData.employeur || ""}
  onChange={handleChange}
  fullWidth
  margin="normal"
/>

<TextField
  label="Adresse employeur (NPA Localité)"
  name="adresseEmployeur"
  value={formData.adresseEmployeur || ""}
  onChange={handleChange}
  fullWidth
  margin="normal"
/>

<FormControlLabel
  control={
    <Checkbox
      checked={formData.ayantEnfants || false}
      onChange={(e) => handleChange({ target: { name: "ayantEnfants", value: e.target.checked } })}
    />
  }
  label="J’ai des enfants à charge"
/>

{formData.ayantEnfants && (
  <>
    {(formData.enfants || []).map((annee, index) => (
      <Box key={index} display="flex" alignItems="center" gap={1} mb={1}>
        <TextField
          label={`Année de naissance #${index + 1}`}
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
        <Button
          color="error"
          variant="outlined"
          onClick={() => {
            const newEnfants = formData.enfants.filter((_, i) => i !== index);
            setFormData({ ...formData, enfants: newEnfants });
            if (user) {
              const ref = doc(db, "dossiers", user.uid);
              updateDoc(ref, { enfants: newEnfants });
            }
          }}
        >
          ❌
        </Button>
      </Box>
    ))}
    <Button
      variant="outlined"
      onClick={() => {
        const newEnfants = [...(formData.enfants || []), ""];
        setFormData({ ...formData, enfants: newEnfants });
        if (user) {
          const ref = doc(db, "dossiers", user.uid);
          updateDoc(ref, { enfants: newEnfants });
        }
      }}
    >
      ➕ Ajouter un enfant
    </Button>
  </>
          )}

          <hr />
          <FormControlLabel
  control={
    <Checkbox
      checked={formData.ajouterDeuxiemePersonne || false}
      onChange={(e) => handleChange({
        target: {
          name: "ajouterDeuxiemePersonne",
          value: e.target.checked
        }
      })}
    />
  }
  label="Ajouter une deuxième personne (conjoint·e)"
/>

{formData.ajouterDeuxiemePersonne && (
  <>
    <Typography variant="h6" sx={{ mt: 3 }}>Deuxième personne (conjoint·e)</Typography>

    <TextField
      label="Prénom"
      name="conjointPrenom"
      value={formData.conjointPrenom || ""}
      onChange={handleChange}
      fullWidth
      margin="normal"
    />

    <TextField
      label="Nom"
      name="conjointNom"
      value={formData.conjointNom || ""}
      onChange={handleChange}
      fullWidth
      margin="normal"
    />

    <TextField
      label="Date de naissance"
      name="conjointDateNaissance"
      inputMode="numeric"
      value={formData.conjointDateNaissance || ""}
      onChange={(e) => {
        const masked = masquerDateNaissance(e.target.value);
        setFormData({ ...formData, conjointDateNaissance: masked });
        if (user) updateDoc(doc(db, "dossiers", user.uid), { conjointDateNaissance: masked });
      }}
      placeholder="JJ.MM.AAAA"
      fullWidth
      margin="normal"
    />

    <FormControl fullWidth margin="normal">
      <InputLabel>Nationalité</InputLabel>
      <Select
        name="conjointNationalite"
        value={formData.conjointNationalite || ""}
        onChange={handleChange}
        label="Nationalité"
      >
       <MenuItem value="">-- Nationalité --</MenuItem>
    <MenuItem value="Suisse">Suisse</MenuItem>
  <MenuItem value="Allemange">Allemagne</MenuItem>
  <MenuItem value="Italie">Italie</MenuItem>
  <MenuItem value="France">France</MenuItem>
  <MenuItem value="Afghanistan">Afghanistan</MenuItem>
    <MenuItem value="Afrique du Sud">Afrique du Sud</MenuItem>
    <MenuItem value="Albanie">Albanie</MenuItem>
    <MenuItem value="Algérie">Algérie</MenuItem>
    <MenuItem value="Andorre">Andorre</MenuItem>
    <MenuItem value="Angola">Angola</MenuItem>
    <MenuItem value="Antigua-et-Barbuda">Antigua-et-Barbuda</MenuItem>
    <MenuItem value="Arabie Saoudite">Arabie Saoudite</MenuItem>
    <MenuItem value="Argentine">Argentine</MenuItem>
    <MenuItem value="Arménie">Arménie</MenuItem>
    <MenuItem value="Australie">Australie</MenuItem>
    <MenuItem value="Autriche">Autriche</MenuItem>
    <MenuItem value="Azerbaïdjan">Azerbaïdjan</MenuItem>
    <MenuItem value="Bahamas">Bahamas</MenuItem>
    <MenuItem value="Bahreïn">Bahreïn</MenuItem>
    <MenuItem value="Bangladesh">Bangladesh</MenuItem>
    <MenuItem value="Barbade">Barbade</MenuItem>
    <MenuItem value="Belgique">Belgique</MenuItem>
    <MenuItem value="Belize">Belize</MenuItem>
    <MenuItem value="Bénin">Bénin</MenuItem>
    <MenuItem value="Bhoutan">Bhoutan</MenuItem>
    <MenuItem value="Biélorussie">Biélorussie</MenuItem>
    <MenuItem value="Birmanie">Birmanie</MenuItem>
    <MenuItem value="Bolivie">Bolivie</MenuItem>
    <MenuItem value="Bosnie-Herzégovine">Bosnie-Herzégovine</MenuItem>
    <MenuItem value="Botswana">Botswana</MenuItem>
    <MenuItem value="Brésil">Brésil</MenuItem>
    <MenuItem value="Brunei">Brunei</MenuItem>
    <MenuItem value="Bulgarie">Bulgarie</MenuItem>
    <MenuItem value="Burkina Faso">Burkina Faso</MenuItem>
    <MenuItem value="Burundi">Burundi</MenuItem>
    <MenuItem value="Cambodge">Cambodge</MenuItem>
    <MenuItem value="Cameroun">Cameroun</MenuItem>
    <MenuItem value="Canada">Canada</MenuItem>
    <MenuItem value="Cap-Vert">Cap-Vert</MenuItem>
    <MenuItem value="Chili">Chili</MenuItem>
    <MenuItem value="Chine">Chine</MenuItem>
    <MenuItem value="Chypre">Chypre</MenuItem>
    <MenuItem value="Colombie">Colombie</MenuItem>
    <MenuItem value="Comores">Comores</MenuItem>
    <MenuItem value="Congo (Brazzaville)">Congo (Brazzaville)</MenuItem>
    <MenuItem value="Congo (Kinshasa)">Congo (Kinshasa)</MenuItem>
    <MenuItem value="Corée du Nord">Corée du Nord</MenuItem>
    <MenuItem value="Corée du Sud">Corée du Sud</MenuItem>
    <MenuItem value="Costa Rica">Costa Rica</MenuItem>
    <MenuItem value="Côte d'Ivoire">Côte d'Ivoire</MenuItem>
    <MenuItem value="Croatie">Croatie</MenuItem>
    <MenuItem value="Cuba">Cuba</MenuItem>
    <MenuItem value="Danemark">Danemark</MenuItem>
    <MenuItem value="Djibouti">Djibouti</MenuItem>
    <MenuItem value="Dominique">Dominique</MenuItem>
    <MenuItem value="Égypte">Égypte</MenuItem>
    <MenuItem value="Émirats Arabes Unis">Émirats Arabes Unis</MenuItem>
    <MenuItem value="Équateur">Équateur</MenuItem>
    <MenuItem value="Érythrée">Érythrée</MenuItem>
    <MenuItem value="Espagne">Espagne</MenuItem>
    <MenuItem value="Estonie">Estonie</MenuItem>
    <MenuItem value="Eswatini">Eswatini</MenuItem>
    <MenuItem value="États-Unis">États-Unis</MenuItem>
    <MenuItem value="Éthiopie">Éthiopie</MenuItem>
    <MenuItem value="Fidji">Fidji</MenuItem>
    <MenuItem value="Finlande">Finlande</MenuItem>
    <MenuItem value="Gabon">Gabon</MenuItem>
    <MenuItem value="Gambie">Gambie</MenuItem>
    <MenuItem value="Géorgie">Géorgie</MenuItem>
    <MenuItem value="Ghana">Ghana</MenuItem>
    <MenuItem value="Grèce">Grèce</MenuItem>
    <MenuItem value="Grenade">Grenade</MenuItem>
    <MenuItem value="Guatemala">Guatemala</MenuItem>
    <MenuItem value="Guinée">Guinée</MenuItem>
    <MenuItem value="Guinée équatoriale">Guinée équatoriale</MenuItem>
    <MenuItem value="Guinée-Bissau">Guinée-Bissau</MenuItem>
    <MenuItem value="Guyana">Guyana</MenuItem>
    <MenuItem value="Haïti">Haïti</MenuItem>
    <MenuItem value="Honduras">Honduras</MenuItem>
    <MenuItem value="Hongrie">Hongrie</MenuItem>
    <MenuItem value="Inde">Inde</MenuItem>
    <MenuItem value="Indonésie">Indonésie</MenuItem>
    <MenuItem value="Irak">Irak</MenuItem>
    <MenuItem value="Iran">Iran</MenuItem>
    <MenuItem value="Irlande">Irlande</MenuItem>
    <MenuItem value="Islande">Islande</MenuItem>
    <MenuItem value="Israël">Israël</MenuItem>
    <MenuItem value="Jamaïque">Jamaïque</MenuItem>
    <MenuItem value="Japon">Japon</MenuItem>
    <MenuItem value="Jordanie">Jordanie</MenuItem>
    <MenuItem value="Kazakhstan">Kazakhstan</MenuItem>
    <MenuItem value="Kenya">Kenya</MenuItem>
    <MenuItem value="Kirghizistan">Kirghizistan</MenuItem>
    <MenuItem value="Kiribati">Kiribati</MenuItem>
    <MenuItem value="Koweït">Koweït</MenuItem>
    <MenuItem value="Laos">Laos</MenuItem>
    <MenuItem value="Lesotho">Lesotho</MenuItem>
    <MenuItem value="Lettonie">Lettonie</MenuItem>
    <MenuItem value="Liban">Liban</MenuItem>
    <MenuItem value="Libéria">Libéria</MenuItem>
    <MenuItem value="Libye">Libye</MenuItem>
    <MenuItem value="Liechtenstein">Liechtenstein</MenuItem>
    <MenuItem value="Lituanie">Lituanie</MenuItem>
    <MenuItem value="Luxembourg">Luxembourg</MenuItem>
    <MenuItem value="Macédoine du Nord">Macédoine du Nord</MenuItem>
    <MenuItem value="Madagascar">Madagascar</MenuItem>
    <MenuItem value="Malaisie">Malaisie</MenuItem>
    <MenuItem value="Malawi">Malawi</MenuItem>
    <MenuItem value="Maldives">Maldives</MenuItem>
    <MenuItem value="Mali">Mali</MenuItem>
    <MenuItem value="Malte">Malte</MenuItem>
    <MenuItem value="Maroc">Maroc</MenuItem>
    <MenuItem value="Îles Marshall">Îles Marshall</MenuItem>
    <MenuItem value="Maurice">Maurice</MenuItem>
    <MenuItem value="Mauritanie">Mauritanie</MenuItem>
    <MenuItem value="Mexique">Mexique</MenuItem>
    <MenuItem value="Micronésie">Micronésie</MenuItem>
    <MenuItem value="Moldavie">Moldavie</MenuItem>
    <MenuItem value="Monaco">Monaco</MenuItem>
    <MenuItem value="Mongolie">Mongolie</MenuItem>
    <MenuItem value="Monténégro">Monténégro</MenuItem>
    <MenuItem value="Mozambique">Mozambique</MenuItem>
    <MenuItem value="Myanmar (Birmanie)">Myanmar (Birmanie)</MenuItem>
    <MenuItem value="Namibie">Namibie</MenuItem>
    <MenuItem value="Nauru">Nauru</MenuItem>
    <MenuItem value="Népal">Népal</MenuItem>
    <MenuItem value="Nicaragua">Nicaragua</MenuItem>
    <MenuItem value="Niger">Niger</MenuItem>
    <MenuItem value="Nigéria">Nigéria</MenuItem>
    <MenuItem value="Norvège">Norvège</MenuItem>
    <MenuItem value="Nouvelle-Zélande">Nouvelle-Zélande</MenuItem>
    <MenuItem value="Oman">Oman</MenuItem>
    <MenuItem value="Ouganda">Ouganda</MenuItem>
    <MenuItem value="Ouzbékistan">Ouzbékistan</MenuItem>
    <MenuItem value="Pakistan">Pakistan</MenuItem>
    <MenuItem value="Palaos">Palaos</MenuItem>
    <MenuItem value="Palestine">Palestine</MenuItem>
    <MenuItem value="Panama">Panama</MenuItem>
    <MenuItem value="Papouasie-Nouvelle-Guinée">Papouasie-Nouvelle-Guinée</MenuItem>
    <MenuItem value="Paraguay">Paraguay</MenuItem>
    <MenuItem value="Pays-Bas">Pays-Bas</MenuItem>
    <MenuItem value="Pérou">Pérou</MenuItem>
    <MenuItem value="Philippines">Philippines</MenuItem>
    <MenuItem value="Pologne">Pologne</MenuItem>
    <MenuItem value="Portugal">Portugal</MenuItem>
    <MenuItem value="Qatar">Qatar</MenuItem>
    <MenuItem value="République centrafricaine">République centrafricaine</MenuItem>
    <MenuItem value="République démocratique du Congo">République démocratique du Congo</MenuItem>
    <MenuItem value="République dominicaine">République dominicaine</MenuItem>
    <MenuItem value="République tchèque">République tchèque</MenuItem>
    <MenuItem value="Roumanie">Roumanie</MenuItem>
    <MenuItem value="Royaume-Uni">Royaume-Uni</MenuItem>
    <MenuItem value="Russie">Russie</MenuItem>
    <MenuItem value="Rwanda">Rwanda</MenuItem>
    <MenuItem value="Saint-Christophe-et-Niévès">Saint-Christophe-et-Niévès</MenuItem>
    <MenuItem value="Saint-Marin">Saint-Marin</MenuItem>
    <MenuItem value="Saint-Vincent-et-les-Grenadines">Saint-Vincent-et-les-Grenadines</MenuItem>
    <MenuItem value="Sainte-Lucie">Sainte-Lucie</MenuItem>
    <MenuItem value="Salomon">Salomon</MenuItem>
    <MenuItem value="Salvador">Salvador</MenuItem>
    <MenuItem value="Samoa">Samoa</MenuItem>
    <MenuItem value="São Tomé-et-Principe">São Tomé-et-Principe</MenuItem>
    <MenuItem value="Sénégal">Sénégal</MenuItem>
    <MenuItem value="Serbie">Serbie</MenuItem>
    <MenuItem value="Seychelles">Seychelles</MenuItem>
    <MenuItem value="Sierra Leone">Sierra Leone</MenuItem>
    <MenuItem value="Singapour">Singapour</MenuItem>
    <MenuItem value="Slovaquie">Slovaquie</MenuItem>
    <MenuItem value="Slovénie">Slovénie</MenuItem>
    <MenuItem value="Somalie">Somalie</MenuItem>
    <MenuItem value="Soudan">Soudan</MenuItem>
    <MenuItem value="Soudan du Sud">Soudan du Sud</MenuItem>
    <MenuItem value="Sri Lanka">Sri Lanka</MenuItem>
    <MenuItem value="Suède">Suède</MenuItem>
    <MenuItem value="Suriname">Suriname</MenuItem>
    <MenuItem value="Syrie">Syrie</MenuItem>
    <MenuItem value="Tadjikistan">Tadjikistan</MenuItem>
    <MenuItem value="Tanzanie">Tanzanie</MenuItem>
    <MenuItem value="Tchad">Tchad</MenuItem>
    <MenuItem value="Thaïlande">Thaïlande</MenuItem>
    <MenuItem value="Timor oriental">Timor oriental</MenuItem>
    <MenuItem value="Togo">Togo</MenuItem>
    <MenuItem value="Tonga">Tonga</MenuItem>
    <MenuItem value="Trinité-et-Tobago">Trinité-et-Tobago</MenuItem>
    <MenuItem value="Tunisie">Tunisie</MenuItem>
    <MenuItem value="Turkménistan">Turkménistan</MenuItem>
    <MenuItem value="Turquie">Turquie</MenuItem>
    <MenuItem value="Tuvalu">Tuvalu</MenuItem>
    <MenuItem value="Ukraine">Ukraine</MenuItem>
    <MenuItem value="Uruguay">Uruguay</MenuItem>
    <MenuItem value="Vanuatu">Vanuatu</MenuItem>
    <MenuItem value="Vatican">Vatican</MenuItem>
    <MenuItem value="Venezuela">Venezuela</MenuItem>
    <MenuItem value="Viêt Nam">Viêt Nam</MenuItem>
    <MenuItem value="Yémen">Yémen</MenuItem>
    <MenuItem value="Zambie">Zambie</MenuItem>
    <MenuItem value="Zimbabwe">Zimbabwe</MenuItem>
        {/* tu peux continuer la liste ici comme pour la première personne */}
      </Select>
    </FormControl>

    {formData.conjointNationalite && formData.conjointNationalite !== "Suisse" && (
      <FormControl fullWidth margin="normal">
        <InputLabel>Permis de séjour</InputLabel>
        <Select
          name="conjointPermisSejour"
          value={formData.conjointPermisSejour || ""}
          onChange={handleChange}
          label="Permis de séjour"
        >
          <MenuItem value="">-- Sélectionner le permis --</MenuItem>
          <MenuItem value="B">Permis B</MenuItem>
          <MenuItem value="C">Permis C</MenuItem>
          <MenuItem value="L">Permis L</MenuItem>
          <MenuItem value="G">Permis G</MenuItem>
        </Select>
      </FormControl>
    )}

    <FormControl fullWidth margin="normal">
      <InputLabel>État civil</InputLabel>
      <Select
        name="conjointEtatCivil"
        value={formData.conjointEtatCivil || ""}
        onChange={handleChange}
        label="État civil"
      >
        <MenuItem value="">-- État civil --</MenuItem>
        <MenuItem value="celibataire">Célibataire</MenuItem>
        <MenuItem value="marie">Marié(e)</MenuItem>
        <MenuItem value="divorce">Divorcé(e)</MenuItem>
        <MenuItem value="veuf">Veuf / Veuve</MenuItem>
      </Select>
    </FormControl>

    <TextField
      label="Formation"
      name="conjointFormation"
      value={formData.conjointFormation || ""}
      onChange={handleChange}
      fullWidth
      margin="normal"
    />

    <TextField
      label="Profession"
      name="conjointProfession"
      value={formData.conjointProfession || ""}
      onChange={handleChange}
      fullWidth
      margin="normal"
    />

    <TextField
      label="Fonction (Employé, Directeur, etc.)"
      name="conjointFonction"
      value={formData.conjointFonction || ""}
      onChange={handleChange}
      fullWidth
      margin="normal"
    />

    <TextField
      label="Employeur"
      name="conjointEmployeur"
      value={formData.conjointEmployeur || ""}
      onChange={handleChange}
      fullWidth
      margin="normal"
    />

    <TextField
      label="Adresse employeur (NPA Localité)"
      name="conjointAdresseEmployeur"
      value={formData.conjointAdresseEmployeur || ""}
      onChange={handleChange}
      fullWidth
      margin="normal"
    />
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
